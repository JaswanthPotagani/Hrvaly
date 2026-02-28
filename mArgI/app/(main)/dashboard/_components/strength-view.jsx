"use client";

import { motion } from "framer-motion";
import { Brain, Sparkles, Zap, Lock, ScanLine, Share2, Quote } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function StrengthView({ strength }) {
  if (!strength) return null;

  return (
    <div className="space-y-8 animate-in fade-in zoom-in duration-500">
        
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-purple-950 to-background border border-indigo-500/30 p-8 sm:p-12 text-center shadow-2xl">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent animate-spin-slow" />
                <div className="absolute top-0 right-0 p-12 opacity-20">
                    <Brain className="w-64 h-64 text-indigo-500 blur-sm" />
                </div>
                <div className="absolute bottom-0 left-0 p-12 opacity-20">
                     <Sparkles className="w-48 h-48 text-purple-500 blur-sm" />
                </div>
            </div>

            <div className="relative z-10 flex flex-col items-center gap-6">
                <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className="p-4 bg-indigo-500/20 rounded-full ring-8 ring-indigo-500/10 backdrop-blur-md"
                >
                    <Sparkles className="w-12 h-12 text-indigo-400" />
                </motion.div>

                <div className="space-y-2 max-w-2xl mx-auto">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                        Secret Strength Detected
                    </h1>
                    <p className="text-indigo-200/80 text-lg sm:text-xl font-medium tracking-wide">
                        AI-Driven Behavioral Analysis • Privately Generated
                    </p>
                </div>
            </div>
        </div>

        {/* The Insight Card */}
        <div className="max-w-4xl mx-auto">
             <Card className="bg-card/50 backdrop-blur-xl border-indigo-500/20 overflow-hidden shadow-2xl shadow-indigo-500/10">
                <CardHeader className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-b border-indigo-500/10 p-6">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                             <ScanLine className="w-5 h-5 text-indigo-400" />
                             <span className="text-sm font-mono text-indigo-300 uppercase tracking-widest">
                                Analysis Output #A-7X9
                             </span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs font-bold text-indigo-200">High Confidence Match</span>
                        </div>
                     </div>
                </CardHeader>
                <CardContent className="p-8 sm:p-12 relative">
                     <Quote className="absolute top-8 left-8 w-12 h-12 text-indigo-500/10 rotate-180" />
                     <Quote className="absolute bottom-8 right-8 w-12 h-12 text-indigo-500/10" />
                     
                     <div className="relative z-10 text-center">
                         <p className="text-xl sm:text-2xl md:text-3xl leading-relaxed font-light text-indigo-50 italic">
                             &ldquo;{strength}&rdquo;
                         </p>
                     </div>
                </CardContent>
             </Card>
        </div>

        {/* How it Works / Context (The "More Informative" part) */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto pt-8">
            <Card className="bg-muted/30 border-muted-foreground/10 hover:border-indigo-500/30 transition-colors group">
                <CardContent className="p-6 space-y-4">
                    <div className="p-3 w-fit rounded-lg bg-indigo-500/10 group-hover:bg-indigo-500/20 transition-colors">
                        <Brain className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg mb-2">Pattern Recognition</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Our Agentic Memory observed your rapid improvement across quiz sessions, identifying a learning curve that exceeds the standard baseline.
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
                        <h3 className="font-bold text-lg mb-2">Adaptive Capability</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                             Technically known as &quot;Fast-Paced Iterative Learning&quot;, this trait is highly correlated with success in agile software development environments.
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-muted/30 border-muted-foreground/10 hover:border-pink-500/30 transition-colors group">
                <CardContent className="p-6 space-y-4">
                    <div className="p-3 w-fit rounded-lg bg-pink-500/10 group-hover:bg-pink-500/20 transition-colors">
                        <Lock className="w-6 h-6 text-pink-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg mb-2">Competitive Edge</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Less than 15% of candidates demonstrate this specific rapid-correction behavior. Use this narrative in your &quot;What is your greatest strength?&quot; answer.
                        </p>
                    </div>
                </CardContent>
            </Card>
         </div>
    
         <div className="flex justify-center pt-8">
            <Link href="/dashboard">
                <Button variant="outline" className="gap-2">
                    Back to Dashboard
                </Button>
            </Link>
         </div>
    </div>
  );
}
