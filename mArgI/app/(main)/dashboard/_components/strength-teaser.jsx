"use client";

import { motion } from "framer-motion";
import { Sparkles, Lock, ArrowRight, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function StrengthTeaser() {
  return (
    <div className="space-y-8 animate-in fade-in zoom-in duration-500 max-w-4xl mx-auto py-12">
        
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-background border border-gray-700/50 p-8 sm:p-12 text-center shadow-2xl">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-500/10 via-transparent to-transparent animate-spin-slow" />
                <div className="absolute top-0 right-0 p-12 opacity-10">
                    <Lock className="w-64 h-64 text-gray-500 blur-sm" />
                </div>
            </div>

            <div className="relative z-10 flex flex-col items-center gap-6">
                <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className="p-4 bg-gray-500/20 rounded-full ring-8 ring-gray-500/10 backdrop-blur-md"
                >
                    <Lock className="w-12 h-12 text-gray-400" />
                </motion.div>

                <div className="space-y-4 max-w-2xl mx-auto">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
                        Unlock Your Secret Strength
                    </h1>
                    <p className="text-gray-300 text-lg sm:text-xl font-medium tracking-wide leading-relaxed">
                        Our Agentic Memory analyzes your learning curve across multiple sessions to identify unique cognitive advantages that resumes miss.
                    </p>
                </div>

                <div className="pt-8">
                    <Link href="/dashboard#upgrade-section">
                        <Button size="lg" className="text-lg px-8 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 border-0 shadow-lg shadow-indigo-500/25">
                            Upgrade to Reveal
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </Link>
                </div>
            </div>
        </div>

        {/* Value Props */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-muted/30 border-muted-foreground/10 hover:border-indigo-500/30 transition-colors group">
                <CardContent className="p-6 space-y-4">
                    <div className="p-3 w-fit rounded-lg bg-indigo-500/10 group-hover:bg-indigo-500/20 transition-colors">
                        <Sparkles className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg mb-2">Hidden Talent Discovery</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Discover subconscious strengths like &quot;Rapid Iterative Learning&quot; or &quot;Critical Pattern Matching&quot; that differentiate you from other candidates.
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-muted/30 border-muted-foreground/10 hover:border-purple-500/30 transition-colors group">
                <CardContent className="p-6 space-y-4">
                    <div className="p-3 w-fit rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                        <Zap className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg mb-2">Interview Narrative</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                             Get a scientifically-backed narrative to answer &quot;What is your greatest strength?&quot; with evidence from your actual performance data.
                        </p>
                    </div>
                </CardContent>
            </Card>
         </div>
    </div>
  );
}
