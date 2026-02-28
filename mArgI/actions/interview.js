"use server"

import { db } from "@/lib/prisma";
import { auth } from "@/auth";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { PLAN_LIMITS } from "@/lib/pricing";
import { revalidatePath } from "next/cache";
import { checkUser } from "@/lib/checkUser";
import { sendAlert } from "@/lib/monitoring";
import { getNichePrompt } from "@/lib/niche-config";
import { inngest } from "@/lib/inngest/client";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-lite",
});

/**
 * Pre-generates a pool of 20 voice interview questions for the user's industry.
 * This reduces API calls during the interactive session and ensures variety.
 */
export async function pregenerateVoiceQuestions(userId) {
    const user = await db.user.findUnique({
        where: { id: userId },
        select: { industry: true, userType: true, weakAreas: true, specialization: true }
    });

    const nichePrompt = getNichePrompt(user.specialization);
    const nicheContext = nichePrompt ? `\n\nNICHE DOMINANCE FOCUS:\n${nichePrompt}` : "";

    // Fetch previous questions to avoid repetition
    const previousAssessments = await db.assessment.findMany({
        where: { userId, interviewType: "Voice" },
        select: { questions: true },
        orderBy: { createdAt: "desc" },
        take: 10 // Analyze last 10 interviews
    });

    const previousQuestions = previousAssessments.flatMap(a => 
        (a.questions || []).map(q => typeof q === 'string' ? q : q.q)
    );
    const excludeString = previousQuestions.slice(-50).join(" | ");

    const weakAreasText = user.weakAreas && user.weakAreas.length > 0 
        ? `Focus specifically on these weak areas identified from previous rejections: ${user.weakAreas.join(", ")}.`
        : "";

    const prompt = `
    Generate a list of 20 challenging technical and behavioral interview questions for a ${user.userType === "student" ? "student" : "professional"} in the ${user.industry} industry.${nicheContext}
    ${weakAreasText}
    Focus on core concepts, problem-solving, and situational scenarios.
    
    STRICT REQUIREMENT: DO NOT include or rephrase any of these previous questions: [${excludeString}].
    Return 20 completely new and unique questions.
    `;

    try {
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.ARRAY,
                    items: { type: SchemaType.STRING },
                },
            },
        });
        
        let questions = JSON.parse(result.response.text());
        
        // Final deduplication against previous questions
        questions = questions.filter(q => !previousQuestions.includes(q));

        await db.voiceQuestionPool.upsert({
            where: { userId_industry: { userId, industry: user.industry } },
            update: { questions, updatedAt: new Date() },
            create: { userId, industry: user.industry, questions }
        });

        return questions;
    } catch (error) {
        console.error("Pregen Voice Error:", error);
        
        // --- GEMINI FAILURE ALERT ---
        await sendAlert(`Gemini API Failed in pregenerateVoiceQuestions`, {
             error: error.message,
             context: 'interview_pregenerate_voice'
        });

        throw new Error("Failed to pre-generate questions.");
    }
}

/**
 * Initializes the AI Voice Interview process.
 * Restricted to PREMIUM plan users.
 */
export async function startVoiceInterview() {
    const user = await checkUser();
    if (!user) throw new Error("Unauthorized");
    const userId = user.id;
    
    // Plan Limit Check
    const plan = user.plan || "FREE";
    const limit = PLAN_LIMITS[plan]?.voiceInterview || 0;
    const currentUsage = user.monthlyUsage?.voiceInterview || 0;
    
    if (limit === 0) throw new Error("PREMIUM_REQUIRED");
    if (currentUsage >= limit) throw new Error("VOICE_LIMIT_EXCEEDED");
    
    // --- QUOTA ALERT ---
    if (currentUsage + 1 >= limit * 0.8 && limit > 0) {
        sendAlert(`⚠️ High Usage Alert: User ${user.email} (ID: ${userId}) hit ${(currentUsage + 1)/limit * 100}% of voice interview limit`, {
             userId: userId,
             email: user.email,
             currentUsage: currentUsage + 1,
             limit: limit,
             plan: plan,
             context: 'voice_interview_quota'
        }).catch(e => console.error("Quota alert failed", e));
    }

    // --- ESCROW LOCK ---
    await db.user.update({
        where: { id: userId },
        data: {
            monthlyUsage: {
                ...user.monthlyUsage,
                voiceInterview: currentUsage + 1
            }
        }
    });

    // --- BEHAVIORAL DATA FETCH ---
    const previousVoice = await db.voiceAssessment.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" }
    });
    const previousFeedback = previousVoice?.improvementTip || "No previous feedback available.";

    try {
        // Check for cached questions
        let pool = await db.voiceQuestionPool.findUnique({
            where: { userId_industry: { userId, industry: user.industry } }
        });

        let questions = pool?.questions || [];
        if (questions.length < 5) {
            questions = await pregenerateVoiceQuestions(userId);
        }

        // Pick 5 random questions for this session
        const shuffled = [...questions].sort(() => 0.5 - Math.random());
        const selectedQuestions = shuffled.slice(0, 5);
        const updatedQuestions = questions.filter(q => !selectedQuestions.includes(q));

        // Update pool to remove used questions
        await db.voiceQuestionPool.update({
            where: { userId_industry: { userId, industry: user.industry } },
            data: { questions: updatedQuestions }
        });

        // Build context
        let context = "";
        if (user.userType === "student") {
            context = `The candidate is a Student in their ${user.currentYear} year of study in the ${user.industry} industry.`;
        } else {
            context = `The candidate is a Professional with ${user.experience} years of experience in the ${user.industry} industry.`;
        }

        const systemInstruction = `
        Act as a Senior Technical Interviewer and Career Coach for the ${user.industry} industry.
        ${context}
        
        IMPORTANT: This is a 5-question mock interview.
        The questions for this session are:
        ${selectedQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}

        Your task:
        1. Introduce yourself briefly and ask the FIRST question.
        2. Wait for the user's response.
        3. CHECK THE USER'S RESPONSE:
           - If the user provides NO answer, or a nonsensical answer (like "skip", " I don't know", "...", or random noise), DO NOT accept it. DO NOT move to the next question. Instead, politely ask the user to provide a proper answer to the current question.
           - If the user provides a valid answer, provide very brief professional feedback/follow-up and ask the NEXT question from the list.
        4. Stay strictly within the 5-question limit.
        5. After the 5th response, YOU MUST provide a final assessment as a structured JSON at the very end of your message.

        FINAL ASSESSMENT CRITERIA:
        - Overall Percentage Score (0-100) based on quality of answers.
        - GRAMMAR & CLARITY: Strictly analyze the user's grammar usage. Mention specific mistakes if any, or praise clarity.
        - CONFIDENCE LEVEL: Analyze the tone and phrasing to determine confidence (High/Medium/Low).
        - Improvement Tips: Provide 3 actionable tips based on their actual performance.
        - "Ideal Answers": Provide a concise, perfect answer for each question asked.
        - Key Technical/Behavioral Knowledge Gaps.
        - "Ideal Answers" for each of the 5 questions asked.

        JSON FORMAT (End of conversation):
        {
          "type": "RESULT",
          "score": number, 
          "learnabilityScore": number (1-100, based on improvement from this previous feedback: ${previousFeedback}),
          "grammar": "Short analysis",
          "confidence": "Short analysis",
          "tips": ["Tip 1", "Tip 2", ...],
          "questions": [
            { "q": "Question Text", "ideal": "What a perfect answer would include" }
          ]
        }

        CONSTRAINTS:
        - Keep spoken responses natural and short (for text-to-speech).
        - DO NOT use Markdown (bold, italics, etc.) in the spoken parts.
        - Only output the JSON at the very end of the interview.
        `;

        const chat = model.startChat({
            history: [],
            generationConfig: {
                maxOutputTokens: 500,
            },
        });

        const result = await chat.sendMessage(systemInstruction + "\n\nBegin the interview now.");
        const response = result.response.text();
        
        return {
            text: response,
            history: [
                { role: "user", parts: [{ text: systemInstruction }] },
                { role: "model", parts: [{ text: response }] }
            ]
        };
    } catch (error) {
        // --- REFUND ON FAILURE ---
        const currentUser = await db.user.findUnique({
             where: { id: userId },
             select: { monthlyUsage: true }
        });
        const usage = currentUser?.monthlyUsage || {};
        await db.user.update({
            where: { id: userId },
            data: {
                monthlyUsage: {
                    ...usage,
                    voiceInterview: Math.max(0, (usage.voiceInterview || 1) - 1)
                }
            }
        });
        console.error("Voice Interview Error:", error);
        throw new Error("Failed to start voice interview: " + (error.message || "Unknown error"));
    }
}

import { generateInputHash } from "@/lib/helper";

/**
 * Normalizes text for better fuzzy matching (strips non-alphanumeric, lowercases, trims).
 */
function normalizeText(text) {
    if (!text) return "";
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .trim();
}

/**
 * Generates the next turn in the voice interview.
 */
export async function generateVoiceResponse(history, userMessage) {
    const user = await checkUser();
    if (!user) throw new Error("Unauthorized");
    const userId = user.id;

    // Check if this is the final turn (Turn 5) to potentially cache the RESULT
    // History indices: 0: System, 1: Q1, 2: A1, 3: Q2, 4: A2, 5: Q3, 6: A3, 7: Q4, 8: A4, 9: Q5
    // userMessage: A5
    if (history.length === 10) {
        // Extract questions from system instruction (history[0])
        const systemPrompt = history[0].parts[0].text;
        const questionsMatch = systemPrompt.match(/\d\.\s(.*)/g);
        const questions = questionsMatch ? questionsMatch.slice(0, 5).map(q => normalizeText(q)).join("|") : "";

        // Extract previous 4 answers from history
        const prevAnswers = history
            .filter(item => item.role === "user" && item.parts?.[0]?.text && !item.parts[0].text.includes("Act as a Senior"))
            .map(item => normalizeText(item.parts[0].text));
        
        const answers = [...prevAnswers, normalizeText(userMessage)].join("|");
        
        // Final Input Hash
        const sessionHash = generateInputHash(questions + answers);

        // Check for cached assessment
        const cachedAssessment = await db.voiceAssessment.findFirst({
            where: {
                userId,
                inputHash: sessionHash
            },
            orderBy: { createdAt: "desc" }
        });

        if (cachedAssessment) {
            console.log("CACHE HIT: Reusing voice assessment for session hash:", sessionHash);
            
            // Reconstruct the RESULT JSON from the cached data
            const tipsArray = cachedAssessment.improvementTip.split("\n").map(line => line.split(": ")[1] || line);
            const grammar = tipsArray[0] || "";
            const confidence = tipsArray[1] || "";
            const tips = tipsArray.slice(2);

            const resultJson = {
                type: "RESULT",
                score: cachedAssessment.quizScore,
                grammar,
                confidence,
                tips,
                questions: cachedAssessment.questions.map(q => ({ q: q.q, ideal: q.ideal }))
            };

            const responseText = `I have finished reviewing your performance. Based on our similar previous practice, here is your evaluation:\n\n${JSON.stringify(resultJson)}`;

            return {
                text: responseText,
                history: [
                    ...history,
                    { role: "user", parts: [{ text: userMessage }] },
                    { role: "model", parts: [{ text: responseText }] }
                ],
                inputHash: sessionHash // Return the hash
            };
        }

        // If not cached, we'll still need the hash later to save it
        try {
            const chat = model.startChat({
                history: history,
            });

            const result = await chat.sendMessage(userMessage);
            const response = result.response.text();

            return {
                text: response,
                history: [
                    ...history,
                    { role: "user", parts: [{ text: userMessage }] },
                    { role: "model", parts: [{ text: response }] }
                ],
                inputHash: sessionHash // Return the hash even for new generations
            };
        } catch (error) {
            console.error("Voice Turn Error:", error);
            throw new Error("AI turn failed.");
        }
    }
   
    try {
        const chat = model.startChat({
            history: history,
        });

        const result = await chat.sendMessage(userMessage);
        const response = result.response.text();

        return {
            text: response,
            history: [
                ...history,
                { role: "user", parts: [{ text: userMessage }] },
                { role: "model", parts: [{ text: response }] }
            ]
        };
    } catch (error) {
        console.error("Voice Turn Error:", error);
        throw new Error("AI turn failed.");
    }
}

/**
 * Generates all 3 quizzes (Technical, Aptitude, HR) in a single batched AI call.
 * This saves on API requests and ensures consistency across rounds.
 */
export async function generateAllQuizzes() {
  const user = await checkUser();
  if (!user) throw new Error("Unauthorized");
  const userId = user.id;

  const plan = user.plan || "FREE";
  const limit = PLAN_LIMITS[plan]?.interview || 2;
  const currentUsage = user.monthlyUsage?.interview || 0;

  // Check limit BEFORE attempting generation
  if (currentUsage >= limit) {
    throw new Error("PLAN_LIMIT_EXCEEDED");
  }

  try {
    const userWithAssessments = await db.user.findUnique({
      where: { id: userId },
      include: { assessment: { select: { questions: true } } },
    });

    const previousQuestionsString = userWithAssessments.assessment
      ? userWithAssessments.assessment.flatMap((a) => a.questions.map((q) => q.question)).slice(-100).join(" | ")
      : "";

    const nichePrompt = getNichePrompt(user.specialization);
    const nicheContext = nichePrompt ? `\n\nNICHE DOMINANCE FOCUS (ENSURE QUESTIONS ALIGN WITH THIS):\n${nichePrompt}` : "";

    // DYNAMIC PERSONA & CONTEXT
    let persona = "";
    let profileContext = "";

    if (user.userType === "student") {
      persona = `Campus Recruitment Officer for ${user.industry}`;
      if (user.isGraduated) {
        profileContext = `Candidate is a Fresh Graduate (Class of ${user.graduationYear}) in ${user.industry}.`;
      } else {
        profileContext = `Candidate is a Year ${user.currentYear} student in ${user.degree} (${user.branch}).`;
      }
    } else {
      persona = `Senior Industry Lead with ${user.experience} years in ${user.industry}`;
      profileContext = `Candidate is a Professional with ${user.experience} years experience.`;
    }

    const weakAreasText = user.weakAreas && user.weakAreas.length > 0 
      ? `Candidate has identified weak areas in: ${user.weakAreas.join(", ")}. Ensure at least 3 questions specifically target these topics.`
      : "";

    const prompt = `
      Act as an ${persona}.
      Profile Context: ${profileContext}
      Industry: ${user.industry} / ${user.branch || "General"}
      Skills: ${user.skills?.join(", ") || "General"}
      ${weakAreasText}
      ${nicheContext}

      TASK: Generate a batch of exactly 30 interview questions, divided into 3 rounds: Technical, Aptitude, and HR. Each round MUST contain exactly 10 questions.

      ROUND-SPECIFIC RULES:
      1. Technical (10 questions): Focus on core fundamentals of ${user.industry}, industry-specific tools, and conceptual knowledge.
      2. Aptitude (10 questions): Focus on general cognitive abilities: Quantitative Aptitude, Logical Reasoning, and Verbal Ability. IGNORE industry context. Generate standard graduation-level aptitude questions.
      3. HR (10 questions): Focus on general behavioral interview questions (e.g., "Tell me about yourself", "Why should we hire you?"). IGNORE industry context.

      STRICT REQUIREMENTS:
      - DIFFICULTY: Align with ${user.userType === "student" ? "Entry Level" : "Experienced Professional"} standards.
      - UNIQUENESS: DO NOT repeat or rephrase any of these: [${previousQuestionsString}].
      - QUESTION COUNT: You MUST provide EXACTLY 10 questions for each of the three rounds (Technical, Aptitude, HR). No more, no less.
    `;

    const questionSchema = {
      type: SchemaType.OBJECT,
      properties: {
        question: { type: SchemaType.STRING },
        options: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        correctAnswer: { type: SchemaType.STRING },
        explanation: { type: SchemaType.STRING },
      },
      required: ["question", "options", "correctAnswer", "explanation"],
    };

    const quizSchema = {
      type: SchemaType.OBJECT,
      properties: {
        Technical: { type: SchemaType.ARRAY, items: questionSchema },
        Aptitude: { type: SchemaType.ARRAY, items: questionSchema },
        HR: { type: SchemaType.ARRAY, items: questionSchema },
      },
      required: ["Technical", "Aptitude", "HR"],
    };

    let result;
    let retries = 3;
    while (retries > 0) {
      try {
        result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: quizSchema,
          },
        });
        break;
      } catch (error) {
        if (error.status === 503 && retries > 1) {
          retries--;
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        throw error;
      }
    }

    const batchedQuizzes = JSON.parse(result.response.text());

    const poolData = Object.entries(batchedQuizzes).map(([type, questions]) => ({
      userId,
      interviewType: type,
      questions: questions.slice(0, 10),
    }));

    await db.quizPool.deleteMany({ where: { userId } });
    await Promise.all(poolData.map(data => db.quizPool.create({ data })));

    // --- INCREMENT USAGE ONLY AFTER SUCCESS ---
    /*
    await db.user.update({
      where: { id: userId },
      data: {
        monthlyUsage: {
          ...user.monthlyUsage,
          interview: currentUsage + 1
        }
      }
    });

    // --- QUOTA ALERT (after increment) ---
    const newUsage = currentUsage + 1;
    const usagePercent = Math.round((newUsage / limit) * 100);
    if (newUsage >= limit * 0.8 && limit > 0) {
      sendAlert(`⚠️ High Usage Alert: User ${user.email} (ID: ${userId}) hit ${usagePercent}% of quiz/interview limit`, {
        userId: userId,
        email: user.email,
        currentUsage: newUsage,
        limit: limit,
        plan: plan,
        context: 'interview_quiz_quota'
      }).catch(e => console.error("Quota alert failed", e));
    }
    */

    revalidatePath("/interview");
    return true;
  } catch (error) {
    console.error("Batch Quiz Error:", error);
    
    // --- GEMINI FAILURE ALERT ---
    await sendAlert(`Gemini API Failed in generateAllQuizzes`, {
         error: error.message,
         context: 'interview_generate_batch'
    });

    throw new Error(error.message || "Failed to generate interview questions.");
  }
}

/**
 * Gets a specific quiz from the pool.
 * If the pool is empty, it returns null (triggering a batch generation call from the UI).
 */
export async function generateQuiz(interviewType = "Technical") {
  const user = await checkUser();
  if (!user) throw new Error("Unauthorized");
  const userId = user.id;

  try {
    const pooledQuiz = await db.quizPool.findUnique({
      where: {
        userId_interviewType: {
          userId,
          interviewType,
        }
      }
    });

    if (pooledQuiz) {
      return pooledQuiz.questions;
    }

    // If no pool, it means we need to generate. 
    // In the new batched flow, the UI should call generateAllQuizzes first.
    return null;
  } catch (error) {
    console.error("Quiz Error:", error);
    throw new Error("Failed to retrieve quiz.");
  }
}

export async function saveQuizResult(questions, answers, score, interviewType = "Technical") {
    const user = await checkUser();
    if (!user) throw new Error("Unauthorized");
    const userId = user.id;

    if (!interviewType) {
        throw new Error("Interview type is required");
    }

    const questionResults = questions.map((q,index) => ({
    question: q.question,
    answer: q.correctAnswer,
    userAnswer: answers[index],
    isCorrect: interviewType === "HR" ? true : q.correctAnswer === answers[index],
    explanation: q.explanation,
   }));

   // --- QUIZ CACHING ---
   const normalizedQuestions = questions.map(q => normalizeText(q.question)).join("|");
   const normalizedAnswers = answers.map(a => normalizeText(a)).join("|");
   const quizHash = generateInputHash(normalizedQuestions + normalizedAnswers);
   let improvementTip = null;

   // Check for recent assessment with same hash
   const lastAssessment = await db.assessment.findFirst({
       where: {
           userId,
           interviewType,
       },
       orderBy: { createdAt: "desc" }
   });

   const existingAssessment = await db.assessment.findFirst({
       where: {
           userId,
           interviewType,
           inputHash: quizHash
       },
       orderBy: { createdAt: "desc" }
   });

   if (existingAssessment) {
       console.log("CACHE HIT: Reusing quiz assessment for hash:", quizHash);
       // We'll still create a new record so it appears in history, but we skip the AI call for improvement tips
       improvementTip = existingAssessment.improvementTip;
   } else {
       if (interviewType === "HR") {
            // ... (AI logic for HR tips) ...
    const hrQuestionsText = questionResults.map((q) => `Question: "${q.question}"\nCandidate Answer: "${q.userAnswer}"` ).join("\n\n");
    const previousFeedback = lastAssessment?.improvementTip || "No previous feedback available.";
    const hrPrompt = `
      You are an expert HR Interviewer and English Language Coach.
      
      Analyze the following candidate's HR interview responses:
      ${hrQuestionsText}

      PREVIOUS FEEDBACK TO TRACK LEARNABILITY:
      ${previousFeedback}

      TASK:
      1. EVALUATE LEARNABILITY: Check if the user has corrected mistakes mentioned in the previous feedback. 
      2. ENGLISH GRAMMAR & CLARITY: Identify specific grammatical errors and professional corrections.
      3. CONTENT EVALUATION: Analyze behavioral response quality (STAR method).

      STRICT REQUIREMENTS:
      - Return EXACTLY a JSON object.
      - "evaluation": Plain text summary of feedback (grammar, content, etc.).
      - "learnabilityScore": A number from 1-100 based on how well they incorporated previous feedback. If no previous feedback, use 50 as baseline.
      
      JSON FORMAT:
      {
        "evaluation": "string",
        "learnabilityScore": number
      }
    `;

    try {
        let result;
        let retries = 2;
        while (retries > 0) {
          try {
            result = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: hrPrompt }] }],
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: SchemaType.OBJECT,
                        properties: {
                            evaluation: { type: SchemaType.STRING },
                            learnabilityScore: { type: SchemaType.NUMBER },
                        },
                        required: ["evaluation", "learnabilityScore"],
                    },
                },
            });
            break;
          } catch (error) {
            if (error.status === 503 && retries > 1) {
              retries--;
              await new Promise(resolve => setTimeout(resolve, 1000));
              continue;
            }
            throw error;
          }
        }
        const data = JSON.parse(result.response.text());
        improvementTip = data.evaluation;
        var aiLearnabilityScore = data.learnabilityScore;
    } catch(error) {
        console.error("Error generating HR evaluation:" , error);
    }

   } else {
    const wrongAnswers = questionResults.filter((q) => !q.isCorrect );
    if(wrongAnswers.length > 0 ){
    const wrongQuestionsText = wrongAnswers.map((q) => `Question: "${q.question}"\nUser Answer: "${q.userAnswer}"` ).join("\n\n");
    const previousFeedback = lastAssessment?.improvementTip || "No previous feedback available.";

    const improvementPrompt = `
    You are an expert career coach ${interviewType === 'Aptitude' ? 'specializing in general aptitude and cognitive testing' : `and technical interviewer specializing in the ${user.industry} industry`}.
    
    A candidate recently missed the following questions:
    ${wrongQuestionsText}

    PREVIOUS FEEDBACK TO TRACK LEARNABILITY:
    ${previousFeedback}

    Task:
    1. EVALUATE LEARNABILITY: Analyze if the candidate is repeating same mistakes or showing improvement based on previous feedback.
    2. KNOWLEDGE GAPS: Identify current knowledge gaps.
    3. ACTIONABLE ADVICE: Provide tips for improvement.

    STRICT REQUIREMENTS:
    - Return EXACTLY a JSON object.
    - "evaluation": Plain text advice/gap analysis.
    - "learnabilityScore": A number from 1-100.
    
    JSON FORMAT:
    {
      "evaluation": "string",
      "learnabilityScore": number
    }
    `;

    try {
        let result;
        let retries = 2;
        while (retries > 0) {
          try {
            result = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: improvementPrompt }] }],
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: SchemaType.OBJECT,
                        properties: {
                            evaluation: { type: SchemaType.STRING },
                            learnabilityScore: { type: SchemaType.NUMBER },
                        },
                        required: ["evaluation", "learnabilityScore"],
                    },
                },
            });
            break;
          } catch (error) {
            if (error.status === 503 && retries > 1) {
              retries--;
              await new Promise(resolve => setTimeout(resolve, 1000));
              continue;
            }
            throw error;
          }
        }
        const data = JSON.parse(result.response.text());
        improvementTip = data.evaluation;
        var aiLearnabilityScore = data.learnabilityScore;
    } catch(error) {
        console.error("Error generating evaluation:" , error);
    }
    }
   }
  }
 
   try {

    const assessment = await db.assessment.create({
      data: {
        userId: user.id,
        quizScore: score,
        questions: questionResults,
        category: interviewType,
        interviewType: interviewType,
        improvementTip,
        inputHash: quizHash,
      },
    });

    // --- BEHAVIORAL DATA TRACKING ---
    const previousAssessment = await db.assessment.findFirst({
      where: {
        userId,
        interviewType,
        id: { not: assessment.id },
      },
      orderBy: { createdAt: "desc" },
    });

    const deltaScore = previousAssessment ? score - previousAssessment.quizScore : 0;

    await db.interview.create({
      data: {
        userId,
        deltaScore,
        learnabilityScore: aiLearnabilityScore || (previousAssessment ? 50 : score),
      },
    });

    // Update User's Learnability Index & Decision Quality
    const currentLearnability = user.learnabilityScore || 0;
    const finalLearnabilityWeight = aiLearnabilityScore ? aiLearnabilityScore / 10 : (deltaScore + 50) / 10;
    const newLearnability = previousAssessment 
      ? (currentLearnability * 0.7) + (finalLearnabilityWeight * 0.3) 
      : score / 10;

    // decisionQuality tracks performance across rounds
    const currentDecisionQuality = user.decisionQuality || { technical: 0, aptitude: 0, hr: 0 };
    const fieldMapping = { Technical: "technical", Aptitude: "aptitude", HR: "hr" };
    const field = fieldMapping[interviewType] || "technical";
    
    await db.user.update({
      where: { id: userId },
      data: {
        learnabilityScore: newLearnability,
        decisionQuality: {
          ...currentDecisionQuality,
          [field]: score
        }
      },
    });

    // Delete the specific pooled quiz so next time it triggers a new batch if needed
    await db.quizPool.deleteMany({
      where: {
        userId,
        interviewType,
      },
    });

    // Increment usage counter after successful save
    await db.user.update({
        where: { id: userId },
        data: {
            monthlyUsage: {
                ...user.monthlyUsage,
                interview: (user.monthlyUsage?.interview || 0) + 1
            }
        }
    });

    revalidatePath("/interview");

    // Trigger Career Memory Trigger
    await inngest.send({
        name: "app/user.action",
        data: { userId },
    });

    return {
      ...assessment,
      learnabilityScore: aiLearnabilityScore || (previousAssessment ? 50 : score),
    };
    } catch (error) {
        console.error("Error saving quiz result:", error);
        throw new Error("Failed to save quiz result");
    }
}

export async function saveVoiceAssessment(result, inputHash = null) {
    const user = await checkUser();
    if (!user) throw new Error("Unauthorized");

    try {
        const assessment = await db.voiceAssessment.create({
            data: {
                userId: user.id,
                quizScore: result.score,
                category: "Voice",
                questions: result.questions,
                improvementTip: `Grammar: ${result.grammar}\nConfidence: ${result.confidence}\nTips: ${result.tips.join(", ")}`,
                inputHash: inputHash
            },
        });

        // --- BEHAVIORAL DATA TRACKING (VOICE) ---
        const previousVoice = await db.voiceAssessment.findFirst({
            where: {
                userId: user.id,
                id: { not: assessment.id }
            },
            orderBy: { createdAt: "desc" }
        });

        const deltaScore = previousVoice ? result.score - previousVoice.quizScore : 0;

        await db.interview.create({
            data: {
                userId: user.id,
                deltaScore,
                learnabilityScore: result.learnabilityScore || (previousVoice ? 50 : result.score),
            }
        });

        const currentLearnability = user.learnabilityScore || 0;
        const finalLearnabilityWeight = result.learnabilityScore ? result.learnabilityScore / 10 : (deltaScore + 50) / 10;
        const newLearnability = previousVoice 
            ? (currentLearnability * 0.7) + (finalLearnabilityWeight * 0.3) 
            : result.score / 10;

        await db.user.update({
            where: { id: user.id },
            data: {
                learnabilityScore: newLearnability,
                decisionQuality: {
                    ...(user.decisionQuality || {}),
                    voice: result.score
                }
            }
        });

        revalidatePath("/voice-interview");

        // Trigger Career Memory Trigger
        await inngest.send({
            name: "app/user.action",
            data: { userId: user.id },
        });

        return assessment;
    } catch (error) {
        console.error("Error saving voice assessment:", error);
        throw new Error("Failed to save voice assessment");
    }
}

export async function getLatestVoiceAssessment() {
    const user = await checkUser();
    if (!user) throw new Error("Unauthorized");

    try {
        const assessment = await db.voiceAssessment.findFirst({
            where: {
                userId: user.id,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return assessment;
    } catch (error) {
        console.error("Error fetching latest voice assessment:", error);
        return null;
    }
}

export async function getAssessments() {
  const user = await checkUser();
  if (!user) throw new Error("Unauthorized");

  try {
    const assessments = await db.assessment.findMany({
      where: {
        userId: user.id,
        NOT: {
          interviewType: "Voice",
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return assessments;
  } catch (error) {
    console.error("Error fetching assessments:", error);
    return [];
  }
}

export async function getVoiceAssessments() {
  const user = await checkUser();
  if (!user) throw new Error("Unauthorized");

  try {
    const assessments = await db.voiceAssessment.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return assessments;
  } catch (error) {
    console.error("Error fetching voice assessments:", error);
    return [];
  }
}
