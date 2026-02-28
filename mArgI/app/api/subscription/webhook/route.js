import { NextResponse } from "next/server";
import { headers } from "next/headers";
import crypto from "crypto";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { logError, logUnhandledWebhookEvent, sendAlert } from "@/lib/monitoring";
import { getPlanNameFromId } from "@/lib/pricing";

const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

// Schema validation for monthlyUsage
function validateMonthlyUsage(usage) {
  if (typeof usage !== 'object' || usage === null) {
    throw new Error('monthlyUsage must be an object');
  }
  
  const requiredFields = ['interview', 'resume', 'coverLetter', 'voiceInterview', 'rejectionAnalysis'];
  for (const field of requiredFields) {
    if (typeof usage[field] !== 'number' || usage[field] < 0) {
      throw new Error(`monthlyUsage.${field} must be a non-negative number`);
    }
  }
  
  return true;
}

// Helper to update the user's plan status with database locking
// We now pass the transaction client 'tx' to ensure this happens atomically with marking the event as processed
async function updateSubscriptionStatus(tx, subscriptionId, newPlan, currentPeriodEnd = null, metadataUserId = null) {
    // We no longer wrap the internal logic in its own transaction here, 
    // instead it's called within the main transaction in the POST handler.
    
    // Find the user associated with the subscription
    let user = await tx.user.findFirst({
        where: { razorpaySubscriptionId: subscriptionId },
    });

    if (!user && metadataUserId) {
    user = await tx.user.findUnique({
        where: { id: metadataUserId },
    });
    }

    if (!user) {
    throw new Error(`User not found for subscription ID: ${subscriptionId} or userId: ${metadataUserId}`);
    }

    // Update the user's plan and usage with locking
    await tx.user.update({
    where: { id: user.id },
    data: {
        plan: newPlan,
        currentPeriodEnd: currentPeriodEnd,
        razorpaySubscriptionId: subscriptionId,
        // Reset usage counters when plan changes/renews
        monthlyUsage: {
        interview: 0,
        resume: 0,
        coverLetter: 0,
        voiceInterview: 0,
        rejectionAnalysis: 0,
        },
    },
    });

    console.log(`Webhook: User ${user.id} plan updated to ${newPlan}`);
}

export async function POST(req) {
  let rawBody;
  let event;

  try {
    // 1. Get the raw body for signature verification
    rawBody = await req.text();
    const signature = headers().get("x-razorpay-signature");

    if (!signature || !webhookSecret) {
      return new NextResponse("Webhook secret or signature missing.", { status: 401 });
    }

    // 2. Verify the signature BEFORE parsing
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      logError(new Error("Invalid webhook signature"), {
        context: 'webhook_verification',
        receivedSignature: signature,
      });
      return new NextResponse("Invalid signature.", { status: 403 });
    }

    // 3. Parse the verified body (inside try-catch)
    event = JSON.parse(rawBody);

    // Validate event structure
    if (!event.event || !event.payload?.subscription?.entity) {
      throw new Error("Invalid webhook payload structure");
    }

    const data = event.payload.subscription.entity;
    const subscriptionId = data.id;
    const planId = data.plan_id;

    // Resolve the internal plan name using the centralized library
    const planName = getPlanNameFromId(planId);

    if (!planName) {
      // CRITICAL FALLBACK: If the plan ID is unknown (likely an unsynced env var),
      // we MUST return a 4xx error. This signals Razorpay that delivery failed,
      // triggering an automatic RETRY. This prevents the "Paid but not upgraded" scenario.
      const errorMsg = "CRITICAL: Unrecognized Razorpay Plan ID";
      
      const context = {
        context: 'webhook_id_mismatch',
        level: 'critical',
        planId,
        subscriptionId,
        suggestedFix: "Check Vercel env variables and sync with Razorpay dashboard."
      };

      logError(new Error(errorMsg), context);
      
      // Send immediate alert
      await sendAlert(errorMsg, context);
      
      return new NextResponse(
        `Plan ID ${planId} mismatch. Retrying...`, 
        { status: 422 }
      );
    }

    // 4. Handle all Razorpay events with switch-case INSIDE an atomic transaction
    const MAX_RETRIES = 3;
    let attempt = 0;

    while (attempt < MAX_RETRIES) {
        try {
            attempt++;
            await prisma.$transaction(async (tx) => {
                // --- IDEMPOTENCY CHECK (Optimistic Lock) ---
                // Try to create the record first. If it fails, it means it's already processed.
                try {
                    await tx.processedWebhook.create({ data: { id: event.id } });
                } catch (err) {
                    // Check for unique constraint violation (P2002) - Absolute Idempotency
                    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
                        console.log(`Webhook event ${event.id} already processed (race condition caught). Skipping.`);
                        return; 
                    }
                    throw err; // Re-throw other errors
                }

                switch (event.event) {
                    case "subscription.activated":
                    case "subscription.charged":
                        const currentPeriodEnd = new Date(data.current_end * 1000);
                        await updateSubscriptionStatus(tx, subscriptionId, planName, currentPeriodEnd, data.notes?.userId);
                        break;

                    case "subscription.cancelled":
                    case "subscription.expired":
                    case "subscription.halted":
                        await updateSubscriptionStatus(tx, subscriptionId, "FREE", null, data.notes?.userId);
                        break;

                    case "subscription.paused":
                        await updateSubscriptionStatus(tx, subscriptionId, "FREE", null, data.notes?.userId);
                        break;

                    case "subscription.resumed":
                        const resumedPeriodEnd = new Date(data.current_end * 1000);
                        await updateSubscriptionStatus(tx, subscriptionId, planName, resumedPeriodEnd, data.notes?.userId);
                        break;

                    default:
                        logUnhandledWebhookEvent(event.event, data);
                        console.log(`Unhandled Razorpay event: ${event.event}`);
                }
            }, {
                isolationLevel: 'Serializable',
                timeout: 15000, // Increased timeout for combined transaction
            });
            
            // If successful, break the loop
            break;
        } catch (error) {
             if (attempt === MAX_RETRIES) {
                 throw error; // Propagate error on last attempt
             }
             
             console.warn(`Transaction attempt ${attempt} failed. Retrying...`, error.message);
             // Add a small delay with jitter
             await new Promise(resolve => setTimeout(resolve, 200 * attempt));
        }
    }

    return new NextResponse("Webhook received.", { status: 200 });

  } catch (error) {
    logError(error, {
      context: 'webhook_processing',
      event: event?.event,
      rawBody: rawBody?.substring(0, 500), // Log first 500 chars only
    });
    
    console.error("Error processing webhook:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
