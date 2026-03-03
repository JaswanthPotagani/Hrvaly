"use server"

import { auth } from "@/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

async function apiFetch(endpoint, options = {}) {
    const session = await auth();
    if (!session?.accessToken) throw new Error("Unauthorized");

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

export async function getUserOnboardingStatus() {
    try {
        const user = await apiFetch("/user/me");
        return { isOnboarded: user.onboarded };
    } catch (error) {
        console.error("Error checking onboarding status:", error);
        return { isOnboarded: false };
    }
}

export async function updateUser(data) {
    try {
        return await apiFetch("/user/update", {
            method: "POST",
            body: JSON.stringify(data),
        });
    } catch (error) {
        return { error: error.message };
    }
}

export async function loginUser(credentials) {
    // Note: Sign-in is handled by auth.js Credentials provider.
    // This wrapper is for UI compatibility if needed by existing components.
    // In many setups, the UI calls signIn('credentials', ...) from next-auth/react directly.
    return { success: true }; 
}
