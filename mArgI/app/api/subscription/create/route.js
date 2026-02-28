

import { auth } from "@/auth";
import { razorpay } from "@/lib/razorpay";
import { NextResponse } from "next/server";

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

        const { planId } = await req.json();

        if (!planId) {
            return NextResponse.json(
                { error: "Plan ID is required" },
                { status: 400 }
            );
        }

        // Create subscription with Razorpay
        const subscription = await razorpay.subscriptions.create({
            plan_id: planId,
            customer_notify: 1,
            total_count: 120, // 10 years (effectively indefinite)
            quantity: 1,
            notes: {
                userId: userId, // Pass userId for webhook correlation
            },
        });

        return NextResponse.json({
            subscriptionId: subscription.id,
            success: true,
        });
    } catch (error) {
        console.error("Error creating subscription:", error);
        return NextResponse.json(
            { error: "Failed to create subscription", details: error.message },
            { status: 500 }
        );
    }
}
