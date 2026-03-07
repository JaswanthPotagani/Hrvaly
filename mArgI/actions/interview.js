"use server"

import { auth } from "@/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

async function apiFetch(endpoint, options = {}) {
    const session = await auth();
    if (!session?.accessToken) throw new Error("Unauthorized");

    const targetUrl = `${API_BASE_URL}${endpoint}`;
    console.log(`[apiFetch] Calling ${targetUrl}`);
    const response = await fetch(targetUrl, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.accessToken}`,
            ...options.headers,
        },
    });

    if (response.status === 404) {
        return null; 
    }

    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.detail || "Request failed");
    }
    return result;
}

export async function getAssessments() {
    try {
        const result = await apiFetch("/interview/assessments");
        return result || [];
    } catch (error) {
        console.error("Error fetching assessments:", error);
        return []; // Return empty array to avoid crash in history list
    }
}

export async function generateQuiz(type) {
    // We want useFetch to catch errors here, so we don't try-catch internally if we want it to bubble up
    return await apiFetch(`/interview/questions/${type}`);
}

export async function generateAllQuizzes() {
    return await apiFetch("/interview/start", {
        method: "POST"
    });
}

export async function getPoolStatus() {
    try {
        return await apiFetch("/interview/pool/status");
    } catch {
        return { Technical: { ready: false }, Aptitude: { ready: false }, HR: { ready: false } };
    }
}

export async function saveQuizResult(quizData, answers, score, type) {
    return await apiFetch("/interview/assessment", {
        method: "POST",
        body: JSON.stringify({
            quizData,
            answers,
            score,
            type
        })
    });
}
