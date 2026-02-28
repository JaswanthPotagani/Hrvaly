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
    const deleted = await db.verificationCode.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    const message = `Cleaned up ${deleted.count} expired verification codes.`;

    // --- SUCCESS ALERT ---
    await sendAlert(`✅ Cron Job Success: OTP Cleanup`, {
        message: message,
        deletedCount: deleted.count,
        context: 'cron_otp_cleanup',
        level: 'info'
    });

    return NextResponse.json({
      success: true,
      message: message,
      deletedCount: deleted.count,
    });
  } catch (error) {
    console.error("Cron Error: Failed to cleanup OTP codes", error);
    
    // --- FAILURE ALERT ---
    await sendAlert(`❌ Cron Job Failed: OTP Cleanup`, {
        error: error.message,
        context: 'cron_otp_cleanup'
    });

    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
