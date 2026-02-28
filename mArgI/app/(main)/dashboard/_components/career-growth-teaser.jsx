"use client";

import { motion } from "framer-motion";
import { Lock, TrendingUp, Target, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function CareerGrowthTeaser({ onUpgrade }) {
  return (
    <div className="border border-border/50 rounded-xl bg-muted/20 p-8 sm:p-12 text-center space-y-8 relative overflow-hidden">
        
        {/* Blurry Background */}
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center">
             {/* This actually overlays everything if I make it absolute. 
                 Better approach: Render the "locked" UI explicitly.
             */}
        </div>

        <div className="relative z-20 flex flex-col items-center gap-6">
            <div className="p-4 bg-primary/10 rounded-full">
                <Lock className="w-10 h-10 text-primary" />
            </div>

            <div className="max-w-2xl mx-auto space-y-3">
                <h2 className="text-2xl sm:text-3xl font-bold">
                    Unlock Your AI Career Coach
                </h2>
                <p className="text-muted-foreground text-lg">
                    Upgrade to Premium to access your personalized 90-day onboarding roadmap, smart milestones, and real-time intervention strategies.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl pt-4">
                 <div className="bg-card p-4 rounded-lg border border-border/50 shadow-sm flex flex-col items-center gap-2">
                     <TrendingUp className="w-6 h-6 text-green-500" />
                     <span className="font-semibold text-sm">Growth Tracking</span>
                 </div>
                 <div className="bg-card p-4 rounded-lg border border-border/50 shadow-sm flex flex-col items-center gap-2">
                     <Target className="w-6 h-6 text-blue-500" />
                     <span className="font-semibold text-sm">Smart Milestones</span>
                 </div>
                 <div className="bg-card p-4 rounded-lg border border-border/50 shadow-sm flex flex-col items-center gap-2">
                     <ArrowRight className="w-6 h-6 text-purple-500" />
                     <span className="font-semibold text-sm">Actionable Steps</span>
                 </div>
            </div>

            <div className="pt-6">
                <Button size="lg" className="px-8 font-semibold" onClick={onUpgrade}>
                    View Upgrade Plans
                </Button>
            </div>
        </div>
    </div>
  );
}
