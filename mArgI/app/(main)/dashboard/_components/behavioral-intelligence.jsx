"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Brain, TrendingUp, Award, Target, ShieldCheck, Share2, Globe, Link } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, LabelList } from 'recharts';
import { Button } from "@/components/ui/button";
import { issueVerificationBadge } from "@/actions/badge";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

const BehavioralIntelligence = ({ learnability, decisionQuality, badges, userId, industry, interviewHistory }) => {
    const [isIssuing, setIsIssuing] = React.useState(false);

    // Transform interviewHistory for Trajectory
    const trajectoryData = (interviewHistory || [])
        .map((item, index) => ({
            name: `I${index + 1}`,
            score: item.learnabilityScore || 50,
            date: format(new Date(item.createdAt), "MM/dd"),
        }));

    const radarData = [
        { subject: 'Technical', A: decisionQuality?.technical || 0 },
        { subject: 'Aptitude', A: decisionQuality?.aptitude || 0 },
        { subject: 'HR', A: decisionQuality?.hr || 0 },
        { subject: 'Voice', A: decisionQuality?.voice || 0 },
    ];

    const handleIssueBadge = async () => {
        setIsIssuing(true);
        try {
            await issueVerificationBadge(userId, industry);
            toast.success("Verification badge issued successfully!");
        } catch (error) {
            toast.error(error.message || "Failed to issue badge.");
        } finally {
            setIsIssuing(false);
        }
    };

    const handleShare = (badgeId) => {
        const url = `${window.location.origin}/verify/${badgeId}`;
        navigator.clipboard.writeText(url);
        toast.success("Verification link copied to clipboard!");
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Career Trajectory - Glassmorphism Card */}
            <Card className="relative overflow-hidden bg-black/40 backdrop-blur-md border-white/10 hover:border-primary/30 transition-all duration-500 group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg font-bold tracking-tight text-white/90">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                            <TrendingUp className="h-4 w-4" />
                        </div>
                        Career Trajectory
                    </CardTitle>
                    <CardDescription className="text-white/40 text-xs">
                        Growth index analyzed over time.
                    </CardDescription>
                </CardHeader>
                <CardContent className="h-[200px] -mt-2">
                    {trajectoryData.length > 1 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trajectoryData} margin={{ top: 35, right: 35, left: 35, bottom: 10 }}>
                                <defs>
                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" hide />
                                <YAxis domain={[0, 100]} hide />
                                <Tooltip
                                    cursor={{ stroke: '#f97316', strokeWidth: 1, strokeDasharray: '5 5' }}
                                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)', borderRadius: '8px' }}
                                    itemStyle={{ color: '#f97316', fontWeight: 'bold' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="score"
                                    stroke="#f97316"
                                    strokeWidth={4}
                                    dot={{ fill: '#f97316', r: 6, strokeWidth: 2, stroke: '#000' }}
                                    activeDot={{ r: 8, strokeWidth: 0, fill: '#fff' }}
                                    isAnimationActive={true}
                                    animationDuration={1500}
                                    style={{ filter: 'drop-shadow(0 0 8px rgba(249, 115, 22, 0.4))' }}
                                >
                                    <LabelList 
                                        dataKey="score" 
                                        position="top" 
                                        fill="#f97316" 
                                        fontSize={12} 
                                        fontWeight="bold"
                                        offset={10}
                                        formatter={(val) => `${val.toFixed(0)}%`} 
                                    />
                                </Line>
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
                            <div className="relative">
                                <TrendingUp className="h-12 w-12 text-white/5" />
                                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-50" />
                            </div>
                            <div className="space-y-1 px-4">
                                <p className="text-sm font-medium text-white/70">Data Engine Initializing</p>
                                <p className="text-[10px] text-white/30 uppercase tracking-widest">Complete 2 more rounds</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Decision Quality Signature - Radar Card */}
            <Card className="relative overflow-hidden bg-black/40 backdrop-blur-md border-white/10 hover:border-primary/30 transition-all duration-500 group lg:scale-105 z-10 lg:shadow-2xl lg:shadow-primary/10">
                <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/20 blur-[60px] rounded-full" />
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg font-bold tracking-tight text-white/90">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <Brain className="h-4 w-4 animate-pulse" />
                        </div>
                        Behavioral Signature
                    </CardTitle>
                    <CardDescription className="text-white/40 text-xs">
                        Multidimensional performance map.
                    </CardDescription>
                </CardHeader>
                <CardContent className="h-[220px] -mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                            <PolarGrid stroke="rgba(255,255,255,0.1)" />
                            <PolarAngleAxis 
                                dataKey="subject" 
                                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 500 }} 
                            />
                            <PolarRadiusAxis 
                                angle={30} 
                                domain={[0, 100]} 
                                tick={false} 
                                axisLine={false} 
                            />
                            <Radar
                                name="User"
                                dataKey="A"
                                stroke="#f97316"
                                fill="url(#radarGradient)"
                                fillOpacity={0.7}
                                strokeWidth={3}
                                isAnimationActive={true}
                                animationDuration={2000}
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
                                <linearGradient id="radarGradient" x1="0" y1="0" x2="1" y2="1">
                                    <stop offset="0%" stopColor="#f97316" stopOpacity={0.9}/>
                                    <stop offset="100%" stopColor="#ea580c" stopOpacity={0.4}/>
                                </linearGradient>
                            </defs>
                            <Tooltip 
                                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)', borderRadius: '8px' }}
                                itemStyle={{ color: '#f97316' }}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Industry Credentials - Glass Card */}
            <Card className="relative overflow-hidden bg-black/40 backdrop-blur-md border-white/10 hover:border-primary/30 transition-all duration-500 group">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg font-bold tracking-tight text-white/90">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <Award className="h-4 w-4" />
                        </div>
                        Industry Credentials
                    </CardTitle>
                    <CardDescription className="text-white/40 text-xs text-balance">
                        Cryptographically signed verification badges.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!badges || badges.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
                            <div className="relative">
                                <ShieldCheck className="h-10 w-10 text-white/5" />
                                <div className="absolute inset-0 bg-primary/10 blur-xl rounded-full" />
                            </div>
                            <p className="text-[11px] text-white/40 uppercase tracking-widest px-8">Complete 5 sessions to unlock verified standing</p>
                            <Button 
                                onClick={handleIssueBadge} 
                                disabled={isIssuing || learnability === 0}
                                size="sm"
                                className="w-full bg-primary/20 hover:bg-primary text-primary hover:text-primary-foreground border-primary/20 transition-all duration-300 font-bold"
                            >
                                {isIssuing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                                Request Audit
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {badges.map((badge) => (
                                <div key={badge.id} className="relative group/badge overflow-hidden p-3 rounded-xl bg-white/5 border border-white/10 hover:border-primary/50 transition-all duration-300">
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 blur-xl group-hover/badge:bg-primary/20 transition-all" />
                                    <div className="flex items-center justify-between relative z-10 px-0.5">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-xs text-white/90 uppercase tracking-tighter">{badge.roleNiche}</span>
                                                <div className="px-1.5 py-0.5 rounded text-[9px] font-black bg-primary text-primary-foreground shadow-glow">
                                                    TOP {100 - badge.percentileRank}%
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <p className="text-[9px] text-white/30 font-mono flex items-center gap-1">
                                                    <Target className="h-2 w-2" /> {badge.uniqueShareableId.slice(0, 16)}...
                                                </p>
                                                <button 
                                                    onClick={() => handleShare(badge.uniqueShareableId)}
                                                    className="flex items-center gap-1 text-[9px] font-black text-primary hover:text-white transition-colors group/share"
                                                >
                                                    <Share2 className="h-3 w-3 group-hover/share:scale-110 transition-transform" />
                                                    SHARE
                                                </button>
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <ShieldCheck className="h-8 w-8 text-primary drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
                                            <div className="absolute inset-0 bg-primary/20 blur-md rounded-full -z-10" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <Button 
                                onClick={handleIssueBadge} 
                                disabled={isIssuing}
                                variant="ghost"
                                className="w-full text-[10px] text-white/30 hover:text-primary h-8 transition-colors"
                            >
                                {isIssuing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <TrendingUp className="h-3 w-3 mr-1" />}
                                Recalculate Verified Percentile
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default BehavioralIntelligence;
