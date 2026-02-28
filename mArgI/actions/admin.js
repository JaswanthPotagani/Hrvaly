"use server";

import { db } from "@/lib/prisma";
import { blacklistUserTokens } from "@/lib/session-blacklist";
import { auth } from "@/auth";
import { sendAlert } from "@/lib/monitoring";

/**
 * Ban a user
 * @param {string} userId - ID of the user to ban
 */
export async function banUser(userId) {
  const session = await auth();
  
  // Check if current user is admin (you might want to add specific admin role check)
  // For now, checking if session exists, but ideally verify role
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Update user in database
  await db.user.update({
    where: { id: userId },
    data: { 
      bannedAt: new Date() 
    }
  });

  // Blacklist their tokens (session invalidation)
  blacklistUserTokens(userId);

  // Alert security channel
  await sendAlert(`🚨 User BANNED by Admin`, {
    targetUserId: userId,
    adminId: session.user.id,
    adminEmail: session.user.email,
    timestamp: new Date().toISOString()
  });

  return { success: true };
}

/**
 * Unban a user
 * @param {string} userId - ID of the user to unban
 */
export async function unbanUser(userId) {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Remove ban timestamp
  await db.user.update({
    where: { id: userId },
    data: { 
      bannedAt: null 
    }
  });

  // Note: We don't need to strictly clear blacklist tokens because
  // the database check in jwt callback will now pass
  
  return { success: true };
}
