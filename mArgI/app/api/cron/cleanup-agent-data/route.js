import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendAlert } from "@/lib/monitoring";
import { verifyCronAuth } from "@/lib/cron";

export const dynamic = "force-dynamic";

export async function GET(req) {
  if (!verifyCronAuth(req)) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const hundredDaysAgo = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000);

    // 1. Cleanup Old Job Drafts
    const deletedDrafts = await db.jobDraft.deleteMany({
      where: {
        createdAt: {
          lt: fourteenDaysAgo,
        },
      },
    });

    // 2. Cleanup Old Career Milestones
    const deletedMilestones = await db.careerMilestone.deleteMany({
      where: {
        createdAt: {
          lt: hundredDaysAgo,
        },
      },
    });

    const message = `Cleaned up ${deletedDrafts.count} drafts and ${deletedMilestones.count} milestones.`;

    // --- SUCCESS ALERT ---
    await sendAlert(`✅ Cron Job Success: Agent Data Cleanup`, {
        message: message,
        deletedDrafts: deletedDrafts.count,
        deletedMilestones: deletedMilestones.count,
        context: 'cron_agent_cleanup',
        level: 'info'
    });

    return NextResponse.json({
      success: true,
      message: message,
      deletedDrafts: deletedDrafts.count,
      deletedMilestones: deletedMilestones.count
    });

  } catch (error) {
    console.error("Cron Error: Failed to cleanup agent data", error);
    
    // --- FAILURE ALERT ---
    await sendAlert(`❌ Cron Job Failed: Agent Data Cleanup`, {
        error: error.message,
        context: 'cron_agent_cleanup'
    });

    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
