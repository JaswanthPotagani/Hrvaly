import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendAlert } from "@/lib/monitoring";
import { verifyCronAuth } from "@/lib/cron";

export const dynamic = "force-dynamic";

export async function GET(req) {
    if (!verifyCronAuth(req)) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const date = new Date();
        date.setDate(date.getDate() - 30); // 30 days ago

        let deletedCount = 0;
        const BATCH_SIZE = 1000;
        
        // Delete in batches to prevent locking the table
        while (true) {
            const batch = await db.processedWebhook.findMany({
                where: { createdAt: { lt: date } },
                take: BATCH_SIZE,
                select: { id: true }
            });

            if (batch.length === 0) break;

            const ids = batch.map(r => r.id);
            
            const result = await db.processedWebhook.deleteMany({
                where: { id: { in: ids } }
            });

            deletedCount += result.count;
            
            // Brief pause to release DB resources/locks between batches
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        const message = `Cleaned up ${deletedCount} processed webhooks older than 30 days.`;

        // --- SUCCESS ALERT ---
        await sendAlert(`✅ Cron Job Success: Webhook Cleanup`, {
            message: message,
            deletedCount: deletedCount,
            context: 'cron_webhook_cleanup',
            level: 'info'
        });

        return NextResponse.json({ 
            success: true, 
            message: message,
            deletedCount: deletedCount 
        });
    } catch (error) {
        console.error("Cron Error: Failed to cleanup webhooks", error);
        
        // --- FAILURE ALERT ---
        await sendAlert(`❌ Cron Job Failed: Webhook Cleanup`, {
            error: error.message,
            context: 'cron_webhook_cleanup'
        });

        return NextResponse.json(
            { error: "Internal Server Error", details: error.message },
            { status: 500 }
        );
    }
}
