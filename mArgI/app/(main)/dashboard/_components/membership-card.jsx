"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Crown, Sparkles } from "lucide-react";

import { toast } from "sonner";


const REFERRAL_CODE = "MARGI25";

const BASE_PLANS = {
    FREE: {
        name: "Free Tier",
        price: 0,
        features: [
            "Basic Resume Analysis",
            "2 Mock Interviews/month",
            "1 Resume Generator/month",
            "1 Cover Letter Generator/month",
            "Limited Industry Insights"
        ],
        icon: Sparkles,
        color: "text-gray-500"
    },
    BASIC: {
        name: "Student Starter",
        price: 199,
        discountedPrice: 149,
        features: [
            "AI-Powered Resume Analysis",
            "5 Mock Interviews",
            "5 Resume Generator",
            "5 Cover Letter Generator",
            "Full Industry Insights"
        ],
        icon: Zap,
        color: "text-orange-500",
        popular: false
    },
    PREMIUM: {
        name: "Placement Pro",
        price: 499,
        discountedPrice: 349,
        features: [
            "Everything in Student Starter",
            "50 Mock Interviews/month",
            "AI Voice Interview (4 rounds/month)",
            "50 Resume Generator/month",
            "50 Cover Letter Generator/month"
        ],
        icon: Crown,
        color: "text-purple-500",
        popular: true
    }
};

const MembershipCard = ({ currentPlan = "FREE", user, standardPlanIds }) => {
    const isReferred = user?.referralCode?.toUpperCase() === REFERRAL_CODE;

    // Derived PLANS with correct pricing and IDs
    const PLANS = {
        ...BASE_PLANS,
        BASIC: {
            ...BASE_PLANS.BASIC,
            price: isReferred ? BASE_PLANS.BASIC.discountedPrice : BASE_PLANS.BASIC.price,
            id: isReferred ? (standardPlanIds?.BASIC_DISCOUNT || "plan_default_basic_discount") : (standardPlanIds?.BASIC || "plan_default_basic"),
        },
        PREMIUM: {
            ...BASE_PLANS.PREMIUM,
            price: isReferred ? BASE_PLANS.PREMIUM.discountedPrice : BASE_PLANS.PREMIUM.price,
            id: isReferred ? (standardPlanIds?.PREMIUM_DISCOUNT || "plan_default_premium_discount") : (standardPlanIds?.PREMIUM || "plan_default_premium"),
        },
    };
    // const { user } = useUser(); // Removed hook
    const [loading, setLoading] = useState(false);
    const [scriptLoaded, setScriptLoaded] = useState(false);

    // Load Razorpay script
    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.onload = () => setScriptLoaded(true);
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const handleUpgrade = async (planKey) => {
        if (!scriptLoaded) {
            toast.error("Payment system is loading. Please try again.");
            return;
        }

        const plan = PLANS[planKey];
        setLoading(true);

        try {
            // Step 1: Create subscription
            const createResponse = await fetch("/api/subscription/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    planId: plan.id,
                }),
            });

            const createData = await createResponse.json();

            if (!createData.success) {
                throw new Error(createData.error || "Failed to create subscription");
            }

            // Step 2: Open Razorpay checkout
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                subscription_id: createData.subscriptionId,
                name: "Margi AI",
                description: `${plan.name} - Monthly Subscription`,
                image: "/logo.png",
                
                // User prefill (Critical for UPI)
                prefill: {
                    name: user?.name || "",
                    email: user?.email || "",
                    contact: "", // Required key for UPI
                },
                
                // Explicit UPI display configuration
                config: {
                    display: {
                        blocks: {
                            upi: {
                                name: "Pay using UPI",
                                instruments: [
                                    {
                                        method: "upi"
                                    }
                                ]
                            },
                            other: {
                                name: "Other Payment Methods",
                                instruments: [
                                    {
                                        method: "card"
                                    },
                                    {
                                        method: "netbanking"
                                    }
                                ]
                            }
                        },
                        sequence: ["block.upi", "block.other"],
                        preferences: {
                            show_default_blocks: true
                        }
                    }
                },
                
                theme: {
                    color: "#F97316",
                },
                
                retry: {
                    enabled: true,
                },
                
                handler: async (response) => {
                    // Step 3: Verify payment
                    try {
                        const verifyResponse = await fetch("/api/subscription/verify", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_subscription_id: response.razorpay_subscription_id,
                                razorpay_signature: response.razorpay_signature,
                                planType: planKey,
                            }),
                        });

                        const verifyData = await verifyResponse.json();

                        if (verifyData.success) {
                            toast.success("Subscription activated successfully! 🎉");
                            // Reload page to update UI
                            setTimeout(() => window.location.reload(), 1500);
                        } else {
                            throw new Error(verifyData.error || "Payment verification failed");
                        }
                    } catch (error) {
                        console.error("Verification error:", error);
                        toast.error("Payment verification failed. Please contact support.");
                    }
                },
                
                modal: {
                    ondismiss: () => {
                        setLoading(false);
                        toast.info("Payment cancelled");
                    },
                },
            };

            const razorpay = new window.Razorpay(options);
            razorpay.open();
        } catch (error) {
            console.error("Upgrade error:", error);
            toast.error(error.message || "Failed to initiate payment");
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            <div className="mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">Choose Your Plan</h2>
                <p className="text-sm sm:text-base text-muted-foreground">
                    Unlock your full potential with our premium features
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                {Object.entries(PLANS).map(([key, plan]) => {
                    const Icon = plan.icon;
                    const isCurrentPlan = currentPlan === key;
                    const isPremiumPlan = key !== "FREE";

                    return (
                        <Card
                            key={key}
                            className={`relative ${
                                plan.popular
                                    ? "border-primary shadow-lg scale-105"
                                    : "border-border/50"
                            }`}
                        >
                            {plan.popular && (
                                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                                    Most Popular
                                </Badge>
                            )}

                            <CardHeader>
                                <div className="flex items-center justify-between mb-2">
                                    <Icon className={`h-6 w-6 sm:h-8 sm:w-8 ${plan.color}`} />
                                    {isCurrentPlan && (
                                        <Badge variant="outline" className="text-xs">
                                            Current Plan
                                        </Badge>
                                    )}
                                </div>
                                <CardTitle className="text-xl sm:text-2xl">{plan.name}</CardTitle>
                                <CardDescription className="mt-2">
                                    <div className="flex items-baseline gap-2">
                                        {isReferred && isPremiumPlan && (
                                            <span className="text-lg sm:text-xl font-medium text-muted-foreground line-through">
                                                ₹{BASE_PLANS[key].price}
                                            </span>
                                        )}
                                        <div className="text-2xl sm:text-3xl font-bold">
                                            ₹{plan.price}
                                            {isPremiumPlan && (
                                                <span className="text-sm font-normal text-muted-foreground">
                                                    /month
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {isReferred && isPremiumPlan && (
                                        <Badge variant="default" className="text-[10px] mt-2 bg-green-500/10 text-green-500 hover:bg-green-500/20 border-none">
                                            Referral Discount Applied (25% Off)
                                        </Badge>
                                    )}
                                    {!isReferred && user?.referralCode && isPremiumPlan && (
                                        <Badge variant="destructive" className="text-[10px] mt-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 border-none">
                                            Invalid Referral Code: {user.referralCode}
                                        </Badge>
                                    )}
                                </CardDescription>
                            </CardHeader>

                            <CardContent>
                                <ul className="space-y-2 sm:space-y-3">
                                    {plan.features.map((feature, index) => (
                                        <li key={index} className="flex items-start gap-2">
                                            <Check className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
                                            <span className="text-xs sm:text-sm text-muted-foreground">
                                                {feature}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>

                            <CardFooter>
                                {isPremiumPlan ? (
                                    <Button
                                        className="w-full"
                                        size="lg"
                                        disabled={isCurrentPlan || loading}
                                        onClick={() => handleUpgrade(key)}
                                        variant={plan.popular ? "default" : "outline"}
                                    >
                                        {isCurrentPlan ? "Current Plan" : "Upgrade Now"}
                                    </Button>
                                ) : (
                                    <Button className="w-full" size="lg" variant="outline" disabled>
                                        Free Forever
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>

            {/* Additional Info */}
            <div className="mt-6 sm:mt-8 p-4 bg-muted/50 rounded-lg space-y-2">
                <p className="text-xs sm:text-sm text-muted-foreground text-center">
                    ✓ Supports UPI Autopay, Credit & Debit Cards
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground text-center">
                    All plans include secure payment processing. Cancel anytime. No hidden fees.
                </p>
            </div>
        </div>
    );
};

export default MembershipCard;
