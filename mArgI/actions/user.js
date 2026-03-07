"use server"

import { auth, signIn } from "@/auth";
import { AuthError } from "next-auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

async function apiFetch(endpoint, options = {}) {
    const session = await auth();
    if (!session?.accessToken) throw new Error("Unauthorized");

    const targetUrl = `${API_BASE_URL}${endpoint}`;
    console.log(`[apiFetch] Calling ${targetUrl} with token: ${session.accessToken ? 'Present' : 'MISSING'}`);
    const response = await fetch(targetUrl, {
        ...options,
        keepalive: true,
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
        if (error.cause) console.error(`[safeApiFetch] Error Cause:`, error.cause);
        return { error: error.message }; 
    }
}

export async function getUserOnboardingStatus() {
    try {
        const user = await safeApiFetch("/user/me");
        if (!user) return { isOnboarded: false };
        return { isOnboarded: user.onboarded };
    } catch (error) {
        console.error("Error checking onboarding status:", error);
        return { isOnboarded: false };
    }
}

export async function getUserData() {
    try {
        const user = await safeApiFetch("/user/me");
        return user || null;
    } catch (error) {
        console.error("Error fetching user data:", error);
        return null;
    }
}

export async function updateUser(data) {
    try {
        return await safeApiFetch("/user/update", {
            method: "POST",
            body: JSON.stringify(data),
        });
    } catch (error) {
        return { error: error.message };
    }
}

export async function loginUser(credentials) {
    try {
        await signIn("credentials", {
          ...credentials,
          redirect: false,
        });
        return { success: true };
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return { error: "Invalid credentials or account banned." };
                default:
                    return { error: "Something went wrong during sign-in." };
            }
        }
        // Next.js redirect errors should be allowed to bubble up if we didn't use redirect: false
        // but since we used redirect: false, we handle it here.
        return { error: error.message || "Failed to sign in" };
    }
}
