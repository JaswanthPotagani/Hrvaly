import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "../prisma";
import { inngest } from "./client";
import { sendAlert } from "@/lib/monitoring";
import { fetchJobsFromAPI } from "@/actions/jobs";
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
});

export const generateIndustryInsights = inngest.createFunction(
   { name: "Generate Industry Insights"},
    {cron:"0 0 * * 0"},
    async ({step}) => {
      try {
        const industries = await step.run("Fetch industries", async () => {
          return await db.industryInsight.findMany({
            select:{ industry: true },
          });   
        });
        

        for(const {industry} of industries){
            
        const prompt = `
          Analyze the current state of the ${industry} industry and provide insights in ONLY the following JSON format without any additional notes or explanations:
          {
            "salaryRanges": [
              { "role": "string", "min": number, "max": number, "median": number, "location - India": "string" }
            ],
            "growthRate": number,
            "demandLevel": "HIGH" | "MEDIUM" | "LOW",
            "topSkills": ["skill1", "skill2"],
            "marketOutlook": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
            "keyTrends": ["trend1", "trend2"],
            "recommendedSkills": ["skill1", "skill2"]
          }
          
          IMPORTANT: Return ONLY the JSON. No additional text, notes, or markdown formatting.
          Include at least 5 common roles for salary ranges.
          Include at least 5 common roles for salary ranges.
          Salary figures must be in Indian Rupees (INR) and must be in LAKHS (e.g. return 15 for 15 Lakhs, NOT 1500000).
          Growth rate should be a percentage.          Growth rate should be a percentage.
          Include at least 5 skills and trends.
        `;
        const res = await step.ai.wrap(
            "gemini",
            async(p) => {
                return await model.generateContent(p);
            },
            prompt
        );

        const text = res.response.candidates[0].content.parts[0].text || "";
        const cleanedText = text.replace(/```(?:json)?\n?/g,"").trim();
        const insights = JSON.parse(cleanedText);

        await step.run(`Update ${industry} insights`, async () => {
          await db.industryInsight.update({
            where: {industry},
                data: {
                    ...insights,
                    lastUpdated: new Date(),
                    nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                },
            });
        });

        }
    } catch (error) {
        // Log locally
        console.error("Inngest Industry Insight Error:", error);
        
        // Send Discord Alert
        await sendAlert(`❌ Inngest Function Failed: Generate Industry Insights`, {
            error: error.message,
            context: 'inngest_industry_insights'
        });
        
        // Re-throw to let Inngest handle retries or mark as failed
        throw error;
    }
  }
);

export const agenticJobSearch = inngest.createFunction(
  { id: "agentic-job-search", name: "Agentic Job Search & Draft" },
  { cron: "0 */6 * * *" }, // Run every 6 hours
  async ({ step }) => {
    
    // 1. Fetch Candidates (Basic & Premium Users)
    const users = await step.run("fetch-active-users", async () => {
      return await db.user.findMany({
        where: {
          plan: { in: ["BASIC", "PREMIUM"] },
        },
        include: {
           resume: {
               orderBy: { updatedAt: 'desc' },
               take: 1
           }
        }
      });
    });
    
    const results = [];

    // 2. Process Each User
    for (const user of users) {
        if (!user.industry || !user.location || !user.resume[0]) continue;

        const result = await step.run(`process-user-${user.id}`, async () => {
            // A. Search Jobs
            const jobs = await fetchJobsFromAPI(user.industry, user.location);
            if (!jobs || jobs.length === 0) return { userId: user.id, status: "no-jobs" };

            let draftsCreated = 0;

            // B. Analyze Top 5 Newest Jobs
            const recentJobs = jobs.slice(0, 5); // Limit to top 5 to save tokens
            
            for (const job of recentJobs) {
                 // Check if already drafted or applied
                 const existingDraft = await db.jobDraft.findFirst({
                     where: { userId: user.id, jobId: job.job_id }
                 });
                 const existingApp = await db.jobApplication.findFirst({
                     where: { userId: user.id, jobId: job.job_id }
                 });

                 if (existingDraft || existingApp) continue;

                 // AI Match
                 const prompt = `
                 Analyze the fit between this resume and job description.
                 
                 Resume:
                 ${user.resume[0].content.substring(0, 3000)}

                 Job:
                 ${job.job_description ? job.job_description.substring(0, 3000) : "No description"}

                 Return JSON:
                 {
                    "matchScore": number (0-100),
                    "explanation": "Brief 1-sentence reason"
                 }
                 `;
                 
                 try {
                     const aiResult = await model.generateContent(prompt);
                     const text = aiResult.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
                     const { matchScore, explanation } = JSON.parse(text);

                     if (matchScore >= 80) {
                         // Create Draft
                         await db.jobDraft.create({
                             data: {
                                 userId: user.id,
                                 jobId: job.job_id,
                                 jobTitle: job.job_title,
                                 company: job.employer_name,
                                 jobUrl: job.job_apply_link,
                                 matchScore: matchScore,
                                 explanation: explanation,
                                 status: "DRAFT"
                             }
                         });
                         
                         // Send Email
                         if (process.env.RESEND_API_KEY) {
                             await resend.emails.send({
                                from: 'Margi AI <ai@margi.live>',
                                to: user.email,
                                subject: `🎯 New 80%+ Match: ${job.job_title}`,
                                html: `
                                  <h1>We found a high match job for you!</h1>
                                  <p><strong>Role:</strong> ${job.job_title} at ${job.employer_name}</p>
                                  <p><strong>Match Score:</strong> ${matchScore}%</p>
                                  <p><strong>Why:</strong> ${explanation}</p>
                                  <p><a href="${job.job_apply_link}">View Job</a></p>
                                `
                             });
                         }
                         draftsCreated++;
                     }

                 } catch (e) {
                     console.error(`AI Error for user ${user.id}:`, e);
                 }
            }
            return { userId: user.id, drafts: draftsCreated };
        });
        results.push(result);
    }

    return { processed: users.length, results };
  }
);

export const onboardingCoach = inngest.createFunction(
    { id: "onboarding-coach", name: "Onboarding Coach (90 Days)" },
    { event: "app/status.hired" },
    async ({ event, step }) => {
        const { userId, jobTitle, company, industry, weakAreas } = event.data;
        console.log(`[INNGSET] Starting onboarding coach for user ${userId} at ${company}`);
        const totalWeeks = 12;

        for (let week = 1; week <= totalWeeks; week++) {
            // 1. Wait for 7 days (or 5s for demo if needed, but using 7d for prod)
            // For first week, maybe send immediately? "Week 1" usually starts on day 1.
            // Let's send Week 1 immediately, then wait.
            if (week > 1) {
                await step.sleep(`wait-for-week-${week}`, "7d");
            }

            // 2. Generate Advice
            const advice = await step.run(`generate-advice-week-${week}`, async () => {
                const prompt = `
                You are an Executive Coach. The user has just been hired as a ${jobTitle} at ${company} in the ${industry} industry.
                They have previously identified these weak areas: ${weakAreas?.join(", ") || "None specified"}.
                
                Generate "Week ${week}" onboarding advice.
                Focus on:
                - Week 1-4: Integration & Culture.
                - Week 5-8: Early Wins & OKRs.
                - Week 9-12: Independence & Strategy.
                
                Current Week: ${week}.
                
                Return JSON:
                {
                   "title": "Short Title (e.g. Navigating Culture)",
                   "content": "Detailed advice (3-4 sentences). Actionable steps."
                }
                `;
                
                const aiResult = await model.generateContent(prompt);
                const text = aiResult.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
                return JSON.parse(text);
            });

            // 3. Save Milestone to DB
            await step.run(`save-milestone-week-${week}`, async () => {
                await db.careerMilestone.create({
                    data: {
                        userId,
                        week,
                        title: advice.title,
                        content: advice.content,
                        status: "PENDING"
                    }
                });
            });

            // 4. Send Email
            if (process.env.RESEND_API_KEY) {
                await step.run(`email-week-${week}`, async () => {
                     const user = await db.user.findUnique({ where: { id: userId }, select: { email: true } });
                     if (user) {
                         await resend.emails.send({
                             from: 'Margi Coach <coach@margi.live>',
                             to: user.email,
                             subject: `🚀 New Job Week ${week}: ${advice.title}`,
                             html: `
                               <h1>Week ${week}: ${advice.title}</h1>
                               <p>${advice.content}</p>
                               <p><em>Check your Dashboard for more details.</em></p>
                             `
                         });
                     }
                });
            }
        }
    }
);

export const analyzeUserGrowth = inngest.createFunction(
    { id: "analyze-user-growth", name: "Analyze User Growth (Agentic Memory)" },
    { event: "app/user.action" },
    async ({ event, step }) => {
        const { userId } = event.data;

        // 1. Increment Action Count
        const user = await step.run("increment-action-count", async () => {
            return await db.user.update({
                where: { id: userId },
                data: { actionCount: { increment: 1 } },
                select: { actionCount: true, industry: true }
            });
        });

        // 2. Check Threshold (Every 3 actions)
        if (user.actionCount >= 3) {
            const insight = await step.run("generate-secret-insight", async () => {
                // Fetch full history
                const fullUser = await db.user.findUnique({
                    where: { id: userId },
                    include: {
                        resume: { orderBy: { updatedAt: 'desc' }, take: 1 },
                        assessment: { orderBy: { createdAt: 'desc' }, take: 5 }
                    }
                });

                const resumeContent = fullUser.resume[0]?.content || "No resume uploaded yet.";
                const interviewHistory = fullUser.assessment.map(a => 
                    `Quiz: ${a.quizScore}% score. Improvement areas: ${a.improvementAreas || 'None'}`
                ).join("\n");

                const prompt = `
                You are an Agentic Career Mentor with "Infinite Memory". 
                Analyze the following user history to find one "Secret Strength"—a unique skill or competitive advantage this user has but hasn't explicitly highlighted or realized yet.
                
                Industry: ${fullUser.industry}
                Resume Snippet: ${resumeContent.substring(0, 2000)}
                Recent Interview Performance:
                ${interviewHistory}

                Rules:
                1. Focus on "Hidden Patterns" (e.g., they talk about tech but their results show high leadership/sales potential).
                2. Be encouraging but hyper-specific.
                3. Keep it to 2-3 impact-heavy sentences.
                4. Do NOT use generic praise. Use data-backed insights.

                Return ONLY the insight text. No JSON, no preamble.
                `;

                const aiResult = await model.generateContent(prompt);
                return aiResult.response.text().trim();
            });

            // 3. Update User & Reset Count
            await step.run("save-insight", async () => {
                await db.user.update({
                    where: { id: userId },
                    data: {
                        secretInsight: insight,
                        actionCount: 0
                    }
                });
            });
        }
    }
);