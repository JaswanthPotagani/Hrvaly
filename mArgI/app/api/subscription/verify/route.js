

import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }
        const userId = session.user.id;

        const {
            razorpay_payment_id,
            razorpay_subscription_id,
            razorpay_signature,
            planType,
        } = await req.json();

        // Verify all required fields
        if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature || !planType) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Verify signature
        const generatedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
            .digest("hex");

        if (generatedSignature !== razorpay_signature) {
            console.error("Signature verification failed");
            return NextResponse.json(
                { error: "Invalid signature" },
                { status: 400 }
            );
        }

        // Note: We DO NOT update the user record here. 
        // The Razorpay Webhook is the absolute source of truth for subscription status.
        // We've linked the userId via notes in the creation phase, so the webhook
        // will automatically link the razorpaySubscriptionId to the user.
        console.log(`Subscription verification requested for ${razorpay_subscription_id}. Activation pending webhook.`);

        return NextResponse.json({
            success: true,
            message: "Subscription verified. Activation pending webhook.",
            // plan: user.plan, // Don't return new plan yet
        });
    } catch (error) {
        console.error("Error verifying subscription:", error);
        return NextResponse.json(
            { error: "Failed to verify subscription", details: error.message },
            { status: 500 }
        );
    }
}
