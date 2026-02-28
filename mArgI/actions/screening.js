"use server";

import { db } from "@/lib/prisma";
import { checkUser } from "@/lib/checkUser";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { revalidatePath } from "next/cache";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-lite",
});

/**
 * Checks if the current user has already vetted (passed screening) for a specific job.
 * @param {string} jobId 
 * @returns {Promise<boolean>}
 */
export async function checkVettingStatus(jobId) {
    const user = await checkUser();
    if (!user) return false;

    const screening = await db.jobScreening.findFirst({
        where: {
            userId: user.id,
            jobId: jobId,
            passed: true
        }
    });

    return !!screening;
}

/**
 * Generates 3 text-based interview questions for a specific job.
 * @param {string} jobDescription 
 * @param {string} jobTitle 
 */
export async function generateScreeningQuestions(jobDescription, jobTitle) {
    const prompt = `
    You are an expert Technical Recruiter.
    Generate exactly 3 screening interview questions for the role of "${jobTitle}".
    
    Job Description Context:
    "${jobDescription ? jobDescription.substring(0, 1000) : "No description provided."}"

    Rules:
    1. Question 1: Verify core technical skill or experience requirement.
    2. Question 2: A situational question relevant to the role.
    3. Question 3: A behavioral or culture-fit question.
    
    Return ONLY a JSON array of strings:
    ["Question 1", "Question 2", "Question 3"]
    `;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(text);
    } catch (error) {
        console.error("Failed to generate screening questions:", error);
        // Fallback questions if AI fails
        return [
            "Why are you interested in this specific role?",
            "Describe a challenging project you worked on recently.",
            "What makes you a good fit for this position?"
        ];
    }
}

/**
 * Evaluates the full screening transcript and saves the result.
 */
export async function submitScreening(jobId, transcript) {
    const user = await checkUser();
    if (!user) throw new Error("Unauthorized");

    const job = await db.jobPost.findUnique({
        where: { id: jobId }
    });

    if (!job) throw new Error("Job not found");

    // Format transcript for AI
    const formattedTranscript = transcript.map(t => `${t.role === 'model' ? 'Interviewer' : 'Candidate'}: ${t.content}`).join("\n");

    const prompt = `
    You are a Hiring Manager evaluating a candidate's screening interview for the role of ${job.title} at ${job.company}.
    
    Transcript:
    ${formattedTranscript}

    Criteria:
    - Did the candidate answer relevantly?
    - Did they demonstrate basic competence?
    - Are they professional?

    Task:
    - Assign a score from 0 to 100.
    - Pass mark is 70.
    - Provide brief feedback.

    Return JSON:
    {
      "score": number,
      "passed": boolean,
      "feedback": "string"
    }
    `;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
        const evaluation = JSON.parse(text);

        await db.jobScreening.create({
            data: {
                userId: user.id,
                jobId: jobId,
                score: evaluation.score,
                passed: evaluation.passed,
                transcript: transcript, // Save raw chat history
            }
        });

        revalidatePath(`/jobs`);
        revalidatePath(`/mock-interview/${jobId}`);

        return evaluation;
    } catch (error) {
        console.error("Screening submission failed:", error);
        throw new Error("Failed to evaluate screening.");
    }
}
