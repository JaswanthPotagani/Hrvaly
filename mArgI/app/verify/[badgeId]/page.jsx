"use client";

import React from 'react';
import { getPublicBadge } from "@/actions/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Award, ShieldCheck, Target, Globe, CheckCircle2 } from "lucide-react";
import { ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, LabelList } from 'recharts';
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import Image from "next/image";

export default function VerificationPage({ params }) {
    const [badge, setBadge] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const badgeId = React.use(params).badgeId;

    React.useEffect(() => {
        async function fetchBadge() {
            const data = await getPublicBadge(badgeId);
            setBadge(data);
            setLoading(false);
        }
        fetchBadge();
    }, [badgeId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-white">
                <div className="w-full max-w-4xl space-y-8 text-center animate-pulse">
                    <Skeleton className="h-12 w-48 mx-auto bg-white/5" />
                    <Skeleton className="h-[500px] w-full bg-white/5 rounded-3xl" />
                </div>
            </div>
        );
    }

    if (!badge) {
        return (
            <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-white text-center">
                <ShieldCheck className="h-16 w-16 text-white/5 mb-4" />
                <h1 className="text-2xl font-bold mb-2">Invalid Credential</h1>
                <p className="text-white/40 max-w-xs">This verification ID does not exist or has been revoked.</p>
            </div>
        );
    }

    const { user, roleNiche, percentileRank, createdAt, uniqueShareableId } = badge;
    const radarData = [
        { subject: 'Technical', A: user.decisionQuality?.technical || 0 },
        { subject: 'Aptitude', A: user.decisionQuality?.aptitude || 0 },
        { subject: 'HR', A: user.decisionQuality?.hr || 0 },
        { subject: 'Voice', A: user.decisionQuality?.voice || 0 },
    ];

    return (
        <div className="min-h-screen bg-[#050505] text-white p-4 pt-24 md:p-8 md:pt-32 selection:bg-primary selection:text-primary-foreground overflow-x-hidden">
            {/* Background Glow */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-[10%] left-[20%] w-[40vw] h-[40vw] bg-primary/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[10%] right-[20%] w-[30vw] h-[30vw] bg-primary/5 blur-[100px] rounded-full" />
            </div>

            <div className="max-w-4xl mx-auto space-y-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-white/10 w-full">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="p-3 bg-primary rounded-2xl shadow-[0_0_20px_rgba(249,115,22,0.4)] shrink-0">
                            <ShieldCheck className="h-8 w-8 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase italic break-words leading-tight">
                                mArgI<span className="text-primary">.verified</span>
                            </h1>
                            <p className="text-white/40 text-[10px] uppercase tracking-widest font-mono break-words leading-relaxed">
                                Blockchain-Signed Verification Engine
                            </p>
                        </div>
                    </div>
                    <div className="text-right md:text-right text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-white/60 font-medium">
                            <Globe className="h-3 w-3" />
                            Public Verification Document
                        </div>
                    </div>
                </div>

                {/* Main Certificate Card */}
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-orange-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                    
                    <Card className="relative bg-[#0a0a0a] border-white/10 rounded-[2.5rem] overflow-hidden">
                        <CardContent className="p-8 md:p-16 space-y-12">
                            {/* User Signature */}
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="p-1 rounded-full bg-gradient-to-tr from-primary to-orange-500">
                                    <div className="w-24 h-24 rounded-full bg-black flex items-center justify-center overflow-hidden border-4 border-black">
                                        {user.imageUrl ? (
                                            <Image 
                                                src={user.imageUrl} 
                                                alt={user.name} 
                                                width={96}
                                                height={96}
                                                className="w-full h-full object-cover" 
                                            />
                                        ) : (
                                            <div className="text-4xl font-black text-white/20 uppercase">{user.name?.charAt(0)}</div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">{user.name}</h2>
                                    <p className="text-primary font-bold text-lg uppercase tracking-tighter">{roleNiche} Professional</p>
                                </div>
                            </div>

                            {/* Main Metrics Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                                {/* Percentile Standing */}
                                <div className="space-y-6">
                                    <div className="text-center md:text-left space-y-1">
                                        <h3 className="text-white/40 uppercase text-xs font-black tracking-widest">Global Ranking</h3>
                                        <div className="flex items-baseline gap-2 justify-center md:justify-start">
                                            <span className="text-7xl font-black italic text-white leading-none">TOP {100 - percentileRank}%</span>
                                        </div>
                                        <p className="text-white/30 text-xs italic">Statistically verified against {user.industry} industry mean.</p>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-green-400">
                                            <CheckCircle2 className="h-5 w-5" />
                                            <span className="text-sm font-bold">Behavioral Analysis Validated</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-green-400">
                                            <CheckCircle2 className="h-5 w-5" />
                                            <span className="text-sm font-bold">Industry Compliance Verified</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-green-400">
                                            <CheckCircle2 className="h-5 w-5" />
                                            <span className="text-sm font-bold">Generative AI Audit Complete</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Radar Chart (Behavioral Signature) */}
                                <div className="relative h-[300px] bg-white/[0.02] rounded-3xl border border-white/5 overflow-hidden group/chart">
                                    <div className="absolute top-4 left-4 z-10">
                                        <div className="bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[10px] font-black uppercase text-white/60">
                                            Execution Signature
                                        </div>
                                    </div>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="55%" outerRadius="65%" data={radarData}>
                                            <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                            <PolarAngleAxis 
                                                dataKey="subject" 
                                                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 700 }} 
                                            />
                                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                            <Radar
                                                name="User"
                                                dataKey="A"
                                                stroke="#f97316"
                                                fill="url(#verifyGradient)"
                                                fillOpacity={0.8}
                                                strokeWidth={3}
                                            >
                                                <LabelList 
                                                    dataKey="A" 
                                                    position="top" 
                                                    fill="#fff" 
                                                    fontSize={10} 
                                                    fontWeight="bold"
                                                    style={{ filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.5))' }}
                                                />
                                            </Radar>
                                            <defs>
                                                <linearGradient id="verifyGradient" x1="0" y1="0" x2="1" y2="1">
                                                    <stop offset="0%" stopColor="#f97316" stopOpacity={1}/>
                                                    <stop offset="100%" stopColor="#ea580c" stopOpacity={0.6}/>
                                                </linearGradient>
                                            </defs>
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Footer / Footer ID */}
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-12 border-t border-white/5">
                                <div className="space-y-1">
                                    <p className="text-white/20 text-[10px] uppercase font-black tracking-widest">Verification Hash</p>
                                    <p className="text-primary font-mono text-xs break-all">{uniqueShareableId}</p>
                                </div>
                                <div className="text-center md:text-right">
                                    <p className="text-white/20 text-[10px] uppercase font-black tracking-widest">Issued On</p>
                                    <p className="text-white font-bold text-sm">{format(new Date(createdAt), "MMMM dd, yyyy")}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="text-center space-y-4 pb-12">
                    <p className="text-white/40 text-sm">Want to verify your own employability standing?</p>
                    <Link href="/" className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-black text-sm hover:bg-primary hover:text-white transition-all transform hover:scale-105">
                        Start Your mArgI Audit
                        <Target className="h-4 w-4" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
