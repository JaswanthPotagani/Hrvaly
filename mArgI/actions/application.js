"use server";

import { db } from "@/lib/prisma";
import { auth } from "@/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { revalidatePath } from "next/cache";
import { PLAN_LIMITS } from "@/lib/pricing";
import { inngest } from "@/lib/inngest/client";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-lite",
});

export async function updateApplicationStatus(applicationId, newStatus, feedback = null) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = session.user.id;

  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { monthlyUsage: true, plan: true, weakAreas: true, industry: true }
    });

    if (!user) throw new Error("User not found");

    const application = await db.jobApplication.findUnique({
      where: { id: applicationId },
      select: { userId: true, jobId: true, jobTitle: true, employerName: true }
    });

    if (!application || application.userId !== userId) {
      throw new Error("Application not found or unauthorized");
    }

    if (newStatus.toLowerCase() === "hired") {
        console.log(`[ACTION] Sending app/status.hired event for user ${userId}`);
        await inngest.send({
            name: "app/status.hired",
            data: {
                userId: userId,
                jobTitle: application.jobTitle,
                company: application.employerName,
                industry: user.industry,
                weakAreas: user.weakAreas
            }
        });
    }

    let analysis = null;
    let isEscrowed = false;

    // If rejected and feedback is provided, analyze it
    if (newStatus === "rejected" && feedback) {
        // Plan Limit Check
        const plan = user.plan || "FREE";
        const limit = PLAN_LIMITS[plan]?.rejectionAnalysis || 5;
        const currentUsage = user.monthlyUsage?.rejectionAnalysis || 0;

        if (currentUsage >= limit) {
             console.warn("Rejection analysis limit reached for user:", userId);
             // We still update the status, but skip AI analysis
        } else {
            // --- ESCROW LOCK ---
            await db.user.update({
                where: { id: userId },
                data: {
                    monthlyUsage: {
                        ...user.monthlyUsage,
                        rejectionAnalysis: currentUsage + 1
                    }
                }
            });
            isEscrowed = true;

            try {
                analysis = await processRejectionFeedback(feedback);
                
                // Update User's weak areas if new ones found
                if (analysis?.weakAreas && analysis.weakAreas.length > 0) {
                    const existingWeakAreas = user.weakAreas || [];
                    const updatedWeakAreas = [...new Set([...existingWeakAreas, ...analysis.weakAreas])];
                    
                    await db.user.update({
                        where: { id: userId },
                        data: { weakAreas: updatedWeakAreas }
                    });
                }
            } catch (aiError) {
                // --- REFUND ON FAILURE ---
                if (isEscrowed) {
                    const currentUser = await db.user.findUnique({ where: { id: userId }, select: { monthlyUsage: true } });
                    const usage = currentUser?.monthlyUsage || {};
                    await db.user.update({
                        where: { id: userId },
                        data: {
                            monthlyUsage: {
                                ...usage,
                                rejectionAnalysis: Math.max(0, (usage.rejectionAnalysis || 1) - 1)
                            }
                        }
                    });
                }
                console.error("Feedback analysis failed:", aiError);
                // Continue with app update even if AI fails
            }
        }
    }

    const updatedApp = await db.jobApplication.update({
      where: { id: applicationId },
      data: {
        status: newStatus,
        feedback: feedback,
        analysis: analysis
      }
    });

    revalidatePath("/applications");
    return { success: true, data: updatedApp };

  } catch (error) {
    console.error("Error updating application status:", error);
    return { success: false, error: error.message };
  }
}



async function processRejectionFeedback(feedback) {
    const prompt = `
    Analyze the following job rejection feedback provided by a candidate:
    "${feedback}"

    Extract specific technical or behavioral weak areas that they need to improve on.
    
    Return a JSON object:
    {
      "weakAreas": ["Area 1", "Area 2"],
      "constructiveAdvice": "Brief encouraging advice."
    }
    
    Rules:
    - "weakAreas" should be concise phrases (e.g., "System Design", "JavaScript Enclosures", "Confidence").
    - Return ONLY the JSON.
    `;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        // Clean markdown
        const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleanedText);
    } catch (error) {
        console.error("AI Analysis Failed:", error);
        return null;
    }
}
