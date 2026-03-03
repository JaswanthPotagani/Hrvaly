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

export async function createResume(data) {
    try {
        return await apiFetch("/resume", {
            method: "POST",
            body: JSON.stringify(data),
        });
    } catch (error) {
        return { error: error.message };
    }
}

export async function getResume(id) {
    try {
        return await apiFetch(`/resume/${id}`);
    } catch (error) {
        console.error(`Error fetching resume ${id}:`, error);
        throw error;
    }
}

export async function updateResume(id, data) {
    try {
        return await apiFetch(`/resume/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        });
    } catch (error) {
        return { error: error.message };
    }
}

export async function getResumes() {
    try {
        return await apiFetch("/resume");
    } catch (error) {
        console.error("Error fetching resumes:", error);
        return [];
    }
}
