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

export async function getUserDashboardData() {
    try {
        const stats = await safeApiFetch("/dashboard/stats");
        if (!stats || stats.error) throw new Error(stats?.error || "Unauthorized or user data not found");
        
        // Fetch full industry pulse data for the summary sections
        let insights = null;
        if (stats.industry) {
            console.log(`[getUserDashboardData] Fetching insights for industry: ${stats.industry}`);
            insights = await safeApiFetch(`/insights/${encodeURIComponent(stats.industry)}`);
        }

        return {
            userData: stats,
            insights: insights && !insights.error ? insights : null
        };
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        throw error;
    }
}

export async function fetchMarketTrends(user) {
    try {
        const trends = await safeApiFetch("/insights/trends");
        return trends || { trendingRoles: [], salaryData: null };
    } catch (error) {
        console.error("Error fetching market trends:", error);
        return { trendingRoles: [], salaryData: null };
    }
}

export async function getUpgradeSkills(user) {
    try {
        const result = await safeApiFetch("/insights/skills");
        if (!result) return { currentStatus: {}, upgradeSkills: [] };
        return {
            currentStatus: result.currentStatus || {},
            upgradeSkills: result.upgradeSkills || []
        };
    } catch (error) {
        console.error("Error fetching upgrade skills:", error);
        return { currentStatus: {}, upgradeSkills: [] };
    }
}
