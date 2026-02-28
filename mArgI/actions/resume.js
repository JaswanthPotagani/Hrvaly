"use server";

import { db } from "@/lib/prisma";
import { auth } from "@/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { revalidatePath } from "next/cache";
import { PLAN_LIMITS } from "@/lib/pricing";
import crypto from "crypto";
import { generateInputHash } from "@/lib/helper";
import { sendAlert } from "@/lib/monitoring";
import { getNichePrompt } from "@/lib/niche-config";
import { inngest } from "@/lib/inngest/client";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
});



export async function checkResumeCreationLimit() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    const userId = session.user.id;

    const user = await db.user.findUnique({
        where: { id: userId }
    });

    if (!user) throw new Error("User not found");

    const plan = user.plan || "FREE";
    const storageLimit = PLAN_LIMITS[plan]?.resumeStorage || PLAN_LIMITS.FREE.resumeStorage;

    const resumeCount = await db.resume.count({
        where: { userId: user.id }
    });

    if (resumeCount >= storageLimit) {
        throw new Error("RESUME_CREATION_LIMIT_REACHED");
    }

    return { success: true };
}

export async function getUserResumeStats() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    const userId = session.user.id;

    const user = await db.user.findUnique({
        where: { id: userId }
    });

    if (!user) throw new Error("User not found");

    const plan = user.plan || "FREE";
    const storageLimit = PLAN_LIMITS[plan]?.resumeStorage || PLAN_LIMITS.FREE.resumeStorage;

    const resumeCount = await db.resume.count({
        where: { userId: user.id }
    });

    return {
        resumeCount,
        storageLimit,
        canCreate: resumeCount < storageLimit
    };
}

export async function createResume(title) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    const userId = session.user.id;

    const user = await db.user.findUnique({
        where: { id: userId }
    });

    if (!user) throw new Error("User not found");

    // Double-check Storage Limit (in case user bypassed frontend check)
    const plan = user.plan || "FREE";
    const storageLimit = PLAN_LIMITS[plan]?.resumeStorage || PLAN_LIMITS.FREE.resumeStorage;

    const resumeCount = await db.resume.count({
        where: { userId: user.id }
    });

    if (resumeCount >= storageLimit) {
        throw new Error("RESUME_CREATION_LIMIT_REACHED");
    }

    // Generate UUID for the new resume but DO NOT save to DB yet
    const newId = crypto.randomUUID();

    return { id: newId, title, isNew: true };
}

export async function getAllResumes() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    const userId = session.user.id;

    const user = await db.user.findUnique({
        where: { id: userId }
    });

    if (!user) throw new Error("User not found");

    return await db.resume.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: 'desc' }
    });
}

export async function getResumeById(id) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    const userId = session.user.id;

    const user = await db.user.findUnique({
        where: { id: userId }
    });

    if (!user) throw new Error("User not found");

    return await db.resume.findUnique({
        where: { 
            id: id,
            userId: user.id 
        }
    });
}

export async function updateResume(id, content, title = "My Resume") {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    const userId = session.user.id;

    const user = await db.user.findUnique({
        where: { id: userId }
    });

    if (!user) throw new Error("User not found");

    // Implement Caching: Check if content changed
    const inputHash = generateInputHash(content);

    // Check if resume exists
    const existingResume = await db.resume.findUnique({
        where: { id, userId: user.id }
    });

    let atsResult;
    let shouldUpdateATS = true;

    if (existingResume && existingResume.inputHash === inputHash && existingResume.atsScore) {
        shouldUpdateATS = false;
        atsResult = {
             atsScore: existingResume.atsScore,
             feedback: existingResume.feedback,
             // keywordScore is not stored, so we might lose it on cached hits unless we store it.
             // Proceeding without keywordScore as per schema instructions.
             keywordScore: 0 // or null
        };
        console.log("CACHE HIT: Skipping ATS generation");
    } else {
         // Generate new score
         atsResult = await generateATSScore(content);
    }

    const plan = user.plan || "FREE";
    const scanLimit = PLAN_LIMITS[plan]?.resume || PLAN_LIMITS.FREE.resume;
    let isEscrowed = false;

    if (shouldUpdateATS) {
        const currentUsage = user.monthlyUsage?.resume || 0;
        if (currentUsage >= scanLimit) {
            throw new Error("PLAN_LIMIT_EXCEEDED");
        }

        // --- QUOTA ALERT ---
        // Alert if usage hits 80% (just a warning, not blocking)
        if (currentUsage + 1 >= scanLimit * 0.8 && scanLimit > 0) {
            sendAlert(`⚠️ High Usage Alert: User ${user.email} (ID: ${user.id}) hit ${(currentUsage + 1)/scanLimit * 100}% of resume limit`, {
                userId: user.id,
                email: user.email,
                currentUsage: currentUsage + 1,
                limit: scanLimit,
                plan: plan,
                context: 'resume_quota'
            }).catch(e => console.error("Quota alert failed", e));
        }

        // --- ESCROW LOCK ---
        await db.user.update({
            where: { id: user.id },
            data: {
                monthlyUsage: {
                    ...user.monthlyUsage,
                    resume: currentUsage + 1
                }
            }
        });
        isEscrowed = true;
    }

    try {
        if (shouldUpdateATS) {
            atsResult = await generateATSScore(content);
        }

        if (!existingResume) {
            // Check Storage Limit
            const storageLimit = PLAN_LIMITS[plan]?.resumeStorage || PLAN_LIMITS.FREE.resumeStorage;
            const resumeCount = await db.resume.count({ where: { userId: user.id } });

            if (resumeCount >= storageLimit) {
                throw new Error("RESUME_CREATION_LIMIT_REACHED");
            }

            const resume = await db.resume.create({
                data: {
                    id,
                    title,
                    userId: user.id,
                    content,
                    atsScore: atsResult.atsScore,
                    feedback: atsResult.feedback,
                    inputHash,
                }
            });
            
            revalidatePath("/resume");
            // Trigger Career Memory Trigger
            await inngest.send({
                name: "app/user.action",
                data: { userId },
            });
            return { ...resume, keywordScore: atsResult.keywordScore };
        } else {
            // Update existing
            const resume = await db.resume.update({
                where: { id: id, userId: user.id },
                data: {
                    content,
                    atsScore: atsResult.atsScore,
                    feedback: atsResult.feedback,
                    inputHash,
                },
            });

            revalidatePath("/resume");
            revalidatePath(`/resume/${id}`);
            return { ...resume, keywordScore: atsResult.keywordScore };
        }
    } catch (error) {
        // --- REFUND ON FAILURE ---
        if (isEscrowed) {
             const currentUser = await db.user.findUnique({
                where: { id: user.id },
                select: { monthlyUsage: true }
            });
            const usage = currentUser?.monthlyUsage || {};
            await db.user.update({
                where: { id: user.id },
                data: {
                    monthlyUsage: {
                        ...usage,
                        resume: Math.max(0, (usage.resume || 1) - 1)
                    }
                }
            });
        }
        console.error("Update Resume Error:", error);
        throw error;
    }
}

async function generateATSScore(content) {
    const prompt = `
    Act as an expert Resume Strategist and ATS Optimization Specialist.
    Analyze the following resume content and act as an application tracking system (ATS).

    Resume Content:
    "${content}"

    Your task is to provide:
    1. An ATS Score (0-100) based on relevance, clarity, and impact.
    2. A Keyword Match Score (0-100) based on industry-standard keywords.
    3. Constructive feedback (2-3 sentences max) on how to improve the resume.

    OUTPUT FORMAT:
    Return a valid JSON object with the following structure:
    {
        "atsScore": number,
        "keywordScore": number,
        "feedback": "string"
    }
    Do not include any other text or markdown.
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text().trim();
        
        const cleanedJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        let data;
        try {
            data = JSON.parse(cleanedJson);
        } catch (parseError) {
             const fixedJson = cleanedJson.replace(/"((?:\\.|[^"\\])*)"/g, (match, p1) => {
               return '"' + p1
                 .replace(/\n/g, "\\n")
                 .replace(/\r/g, "\\r")
                 .replace(/\t/g, "\\t")
                 .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
                 + '"';
             });
             data = JSON.parse(fixedJson);
        }

        return {
            atsScore: data.atsScore,
            feedback: data.feedback,
            keywordScore: data.keywordScore
        };
    } catch (error) {
        console.error("Error generating ATS score:", error);
        
        // --- GEMINI FAILURE ALERT ---
        await sendAlert(`Gemini API Failed in generateATSScore`, {
            error: error.message,
            context: 'resume_ats_score'
        });

        // Fallback
        return {
            atsScore: 70,
            feedback: "Unable to calculate detailed score at the moment. Please ensure your resume content is detailed.",
            keywordScore: 0
        };
    }
}

export async function improvedWithAI({ current, type }) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    const userId = session.user.id;

    const user = await db.user.findUnique({
        where: {
            id: userId
        }
    });

    if (!user) throw new Error("User not found");

    const nichePrompt = getNichePrompt(user.specialization);
    const nicheContext = nichePrompt ? `\n\nNICHE-SPECIFIC RULES (PRIORITIZE THESE):\n${nichePrompt}` : "";

    const prompt = `
    Act as an expert Resume Strategist and ATS Optimization Specialist with deep knowledge of the ${user.industry} industry.${nicheContext}

    Your task is to rewrite the following ${type} description to make it high-impact, professional, and ATS-friendly.

    Original Content: "${current}"

    STRICT IMPROVEMENT GUIDELINES:
    1. **Use the "Google Formula"**: Where possible, structure sentences as "Accomplished [X] as measured by [Y], by doing [Z]".
    2. **Active Voice**: Start with strong power verbs (e.g., "Engineered", "Spearheaded", "Optimized") instead of passive phrases like "Responsible for" or "Helped with".
    3. **Quantifiable Impact**: If the original content implies a result, sharpen it to focus on efficiency, revenue, or performance improvements. (Do not invent false numbers, but frame it to highlight value).
    4. **ATS Keywords**: Naturally integrate technical and industry-specific keywords relevant to ${user.industry} to pass automated screeners.
    5. **Conciseness**: Remove filler words and fluff. Every word must add value.

    OUTPUT REQUIREMENTS:
    - Return ONLY the improved text. 
    - Format as a single, cohesive paragraph.
    - Do NOT include any introductory text, markdown formatting, or explanations.
  `;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const improvedContent = response.text().trim();
        return improvedContent;
    } catch (error) {
        console.error("Error improving resume:", error);
        
        // --- GEMINI FAILURE ALERT ---
        await sendAlert(`Gemini API Failed in improvedWithAI`, {
            error: error.message,
            context: 'resume_improvement'
        });

        throw new Error("Failed to improve resume");
    }
}

export async function saveResumeFile(formData) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    const userId = session.user.id;
    
    const file = formData.get("resume");
    if (!file) throw new Error("No file uploaded");

    // Check storage limits
    const user = await db.user.findUnique({
        where: { id: userId }
    });
    
    if (!user) throw new Error("User not found");

    const plan = user.plan || "FREE";
    const storageLimit = PLAN_LIMITS[plan]?.resumeStorage || PLAN_LIMITS.FREE.resumeStorage;
    const resumeCount = await db.resume.count({
        where: { userId: user.id }
    });

    if (resumeCount >= storageLimit) {
        throw new Error("RESUME_CREATION_LIMIT_REACHED");
    }

    // Simulate file upload (in real app, upload to S3/Blob here)
    // For now, we'll generate a mock URL
    const fileName = file.name;
    const mockFileUrl = `https://placehold.co/600x400?text=${encodeURIComponent(fileName)}`;

    const resume = await db.resume.create({
        data: {
            userId: userId,
            title: fileName,
            content: `Uploaded Resume: ${fileName}`, // Storing description since we can't parse PDF content easily without libs
            fileUrl: mockFileUrl,
            atsScore: 0,
            feedback: "Uploaded resume file"
        }
    });

    revalidatePath("/resume");
    return resume;
}