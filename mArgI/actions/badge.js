"use server"

import { auth } from "@/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

async function apiFetch(endpoint, options = {}) {
    const session = await auth();
    if (!session?.accessToken) throw new Error("Unauthorized");

    console.log(`[apiFetch] Calling ${endpoint} with token: ${session.accessToken ? 'Present' : 'MISSING'}`);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.accessToken}`,
            ...options.headers,
        },
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.detail || "Request failed");
    return result;
}

async function safeApiFetch(endpoint, options = {}) {
    try {
        const session = await auth();
        if (!session?.accessToken) {
            console.log(`[safeApiFetch] No accessToken found for ${endpoint}`);
            return { error: "Authentication session expired. Please sign in again." };
        }
        return await apiFetch(endpoint, options);
    } catch (error) {
        console.error(`[safeApiFetch] Error for ${endpoint}:`, error.message);
        return { error: error.message }; 
    }
}

export async function issueVerificationBadge() {
    try {
        return await safeApiFetch("/achievements/badge/issue", {
            method: "POST",
        });
    } catch (error) {
        return { error: error.message };
    }
}
