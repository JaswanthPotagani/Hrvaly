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

export async function getUserDashboardData() {
    try {
        const stats = await apiFetch("/dashboard/stats");
        // Maintain legacy structure for frontend components
        return {
            userData: stats,
            insights: null // Handled separately or included in future
        };
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        throw error;
    }
}

export async function fetchMarketTrends(user) {
    try {
        // Industry insights API usually handles the AI generation on backend
        return await apiFetch("/insights/trends");
    } catch (error) {
        console.error("Error fetching market trends:", error);
        return { trendingRoles: [], salaryData: null };
    }
}

export async function getUpgradeSkills(user) {
    try {
        const result = await apiFetch("/insights/skills");
        return {
            currentStatus: result.currentStatus || {},
            upgradeSkills: result.upgradeSkills || []
        };
    } catch (error) {
        console.error("Error fetching upgrade skills:", error);
        return { currentStatus: {}, upgradeSkills: [] };
    }
}
