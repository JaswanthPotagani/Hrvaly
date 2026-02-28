"use server"

import { db } from "@/lib/prisma";
import { checkUser } from "@/lib/checkUser";
import { revalidatePath } from "next/cache";

/**
 * Issues or updates a VerificationBadge for the user.
 * This is our "proprietary shared credential".
 */
export async function issueVerificationBadge(userId, roleNiche) {
    const user = await db.user.findUnique({
        where: { id: userId },
        include: { assessment: true, interviews: true }
    });

    if (!user) throw new Error("User not found");

    // Calculate Percentile Rank (Mock logic: compare user score to a global baseline)
    // In a real system, this would query aggregated scores from all users.
    const userAvgScore = user.assessment.length > 0 
        ? user.assessment.reduce((acc, curr) => acc + curr.quizScore, 0) / user.assessment.length
        : 0;
    
    // For now, let's assume a baseline mean of 70 and std dev of 15
    // Percentile = 100 * (1 / (1 + exp(- (score - mean) / scale)))
    const percentileRank = Math.min(99, Math.max(1, Math.round(100 * (1 / (1 + Math.exp(-(userAvgScore - 70) / 10))))));

    const uniqueShareableId = `badge_${userId.substring(0, 8)}_${Math.random().toString(36).substring(2, 7)}`;

    const badge = await db.verificationBadge.upsert({
        where: { userId_roleNiche: { userId, roleNiche } },
        update: {
            percentileRank,
            updatedAt: new Date()
        },
        create: {
            userId,
            uniqueShareableId,
            percentileRank,
            roleNiche,
        }
    });

    // Ensure we have a uniqueShareableId even if it was an older record missing one
    if (!badge.uniqueShareableId) {
        return await db.verificationBadge.update({
            where: { id: badge.id },
            data: { uniqueShareableId }
        });
    }

    revalidatePath("/dashboard");
    return badge;
}

/**
 * Fetches badge data for public verification.
 */
export async function getPublicBadge(uniqueShareableId) {
    if (!uniqueShareableId) return null;
    
    // Sanitize input
    const cleanId = uniqueShareableId.trim();
    console.log(`[getPublicBadge] Fetching for ID: '${cleanId}' (Original: '${uniqueShareableId}')`);

    try {
        const badge = await db.verificationBadge.findUnique({
            where: { uniqueShareableId: cleanId },
            include: {
                user: {
                    select: {
                        name: true,
                        imageUrl: true,
                        industry: true,
                        decisionQuality: true,
                    }
                }
            }
        });

        if (!badge) {
            console.log("No badge found for ID:", uniqueShareableId);
            return null;
        }

        console.log("Badge found for user:", badge.user.name);
        return badge;
    } catch (error) {
        console.error("Error fetching public badge:", error);
        return null;
    }
}
