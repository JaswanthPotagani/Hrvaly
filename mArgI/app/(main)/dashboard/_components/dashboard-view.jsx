"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Brain, BriefcaseIcon, TrendingUp, Zap, ChevronRight, CheckCircle2, Circle, Sparkles, MessageSquare } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import MarketTrendCard from "@/components/market-trend-card";
import CareerStatusCard from "@/components/career-status-card";
import MembershipCard from "./membership-card";
import BehavioralIntelligence from "./behavioral-intelligence";
import CareerGrowthTeaser from "./career-growth-teaser";

import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const DashboardView = ({ userData, insights, marketTrends, careerStatus, standardPlanIds, defaultTab = "overview" }) => {
    const router = useRouter();
    const pathname = usePathname();
    const [activeTab, setActiveTab] = useState(defaultTab);

    // Sync activeTab with defaultTab prop when it changes (e.g. via navigation)
    useEffect(() => {
        setActiveTab(defaultTab);
    }, [defaultTab]);

    const handleTabChange = (value) => {
        setActiveTab(value);
        router.replace(`${pathname}?tab=${value}`, { scroll: false });
    };

    const navigateToUpgrade = () => {
        setActiveTab("overview");
        router.replace(`${pathname}?tab=overview#upgrade-section`, { scroll: false });
        // Small delay to ensure tab content is mounted before scrolling
        setTimeout(() => {
             const element = document.getElementById("upgrade-section");
             if (element) {
                 element.scrollIntoView({ behavior: "smooth" });
             }
        }, 100);
    };

    // Transform assessment data for the chart
    const assessmentData = (userData.assessment || [])
        .slice(0, 10) // Last 10 assessments
        .reverse()
        .map((a, i) => ({
            name: `Q${i + 1}`,
            score: a.quizScore,
            date: format(new Date(a.createdAt), "MM/dd"),
        }));

    const resumeScore = userData.resume?.atsScore || 0;
    const skillsCount = userData.skills?.length || 0;
    const totalQuestions = userData.assessment?.reduce((acc, curr) => acc + (curr.questions?.length || 0), 0) || 0;

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-1 sm:gap-2">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold gradient-title">
                    Welcome back, {userData.name?.split(' ')[0] || "User"}!
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                    Your career prep is on track.
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="growth">Career Growth</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4">
                    {/* Behavioral Data Pivot - The "Database of Record" */}
                    <BehavioralIntelligence 
                        learnability={userData.learnabilityScore || 0}
                        decisionQuality={userData.decisionQuality || {}}
                        badges={userData.badges || []}
                        userId={userData.id}
                        industry={userData.industry}
                        interviewHistory={userData.interviews || []}
                    />

                    {/* Proprietary Data Loop: Secret Insight */}
                    {userData.secretInsight && (
                        <Link href="/dashboard/strength" className="block mb-6">
                            <Card className="border-indigo-500/50 bg-indigo-500/5 shadow-indigo-500/20 shadow-lg hover:bg-indigo-500/10 transition-all cursor-pointer group">
                                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                                    <div className="p-2 bg-indigo-500/20 rounded-full group-hover:bg-indigo-500/30 transition-colors">
                                        <Sparkles className="h-5 w-5 text-indigo-400" />
                                    </div>
                                    <div className="flex-1">
                                        <CardTitle className="text-lg text-indigo-100 flex items-center gap-2">
                                            Secret Strength Detected
                                            <ChevronRight className="h-4 w-4 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0" />
                                        </CardTitle>
                                        <p className="text-xs text-indigo-300/70 font-mono">Agentic Memory Analysis Active • Click to View Analysis</p>
                                    </div>
                                </CardHeader>
                            </Card>
                        </Link>
                    )}

                    {/* Market Intelligence Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
                        {/* Market Trend Card */}
                        <MarketTrendCard 
                            trendingRoles={marketTrends?.trendingRoles || []}
                            salaryData={marketTrends?.salaryData}
                            insights={insights}
                        />
                        
                        {/* Career Status Card */}
                        <CareerStatusCard 
                            currentStatus={careerStatus?.currentStatus || {}}
                            upgradeSkills={careerStatus?.upgradeSkills || []}
                        />
                    </div>
        
                    {/* Industry Insights Summary */}
                    {insights && (
                        <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between text-base sm:text-lg">
                                    <span className="flex items-center gap-2">
                                        <BriefcaseIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                                        {userData.industry} Pulse
                                    </span>
                                    <Badge variant={insights.marketOutlook === 'POSITIVE' ? 'default' : 'secondary'} className={insights.marketOutlook === 'POSITIVE' ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' : ''}>
                                        {insights.marketOutlook} Outlook
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                    <div className="p-2 sm:p-3 bg-muted/20 rounded-lg">
                                        <p className="text-xs text-muted-foreground mb-1">Demand Level</p>
                                        <p className="text-sm sm:text-base font-semibold capitalize">{insights.demandLevel?.toLowerCase() || "N/A"}</p>
                                    </div>
                                    <div className="p-2 sm:p-3 bg-muted/20 rounded-lg">
                                        <p className="text-xs text-muted-foreground mb-1">Growth Rate</p>
                                        <p className="text-sm sm:text-base font-semibold">{insights.growthRate}%</p>
                                    </div>
                                     <div className="p-2 sm:p-3 bg-muted/20 rounded-lg">
                                        <p className="text-xs text-muted-foreground mb-1">Salary Median</p>
                                        <p className="text-sm sm:text-base font-semibold">{insights.salaryCurrency} {insights.salaryRanges?.[0]?.median || 'N/A'} {insights.salaryFrequency}</p>
                                    </div>
                                     <div className="p-2 sm:p-3 bg-muted/20 rounded-lg">
                                        <p className="text-xs text-muted-foreground mb-1">Next Update</p>
                                        <p className="text-sm sm:text-base font-semibold">{insights.nextUpdate ? formatDistanceToNow(new Date(insights.nextUpdate), { addSuffix: true }) : "N/A"}</p>
                                    </div>
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {insights.keyTrends?.slice(0, 3).map((trend, i) => (
                                        <Badge key={i} variant="outline" className="opacity-80">
                                            <Zap className="h-3 w-3 mr-1" />
                                            {trend}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
        
                    {/* Membership Plans */}
                    <div id="upgrade-section" className="scroll-mt-20">
                        <MembershipCard 
                            currentPlan={userData.plan || "FREE"} 
                            user={userData} 
                            standardPlanIds={standardPlanIds}
                        />
                    </div>
                </TabsContent>

                <TabsContent value="growth">
                    {userData.plan === "FREE" ? (
                        <CareerGrowthTeaser onUpgrade={navigateToUpgrade} />
                    ) : (
                        <Card>
                            <CardHeader>
                                <CardTitle>Onboarding Roadmap</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {!userData.milestones || userData.milestones.length === 0 ? (
                                    <div className="text-center py-10 text-muted-foreground">
                                        <p>No active coaching plan.</p>
                                        <p className="text-sm">Mark a job application as &quot;Hired&quot; to activate your 90-day coach!</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {userData.milestones.map((milestone) => (
                                            <div key={milestone.id} className="flex gap-4">
                                                <div className="flex flex-col items-center">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${milestone.status === 'COMPLETED' ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/30 text-muted-foreground'}`}>
                                                        {milestone.status === 'COMPLETED' ? <CheckCircle2 className="w-5 h-5" /> : <span>{milestone.week}</span>}
                                                    </div>
                                                    <div className="w-0.5 h-full bg-border my-2"></div>
                                                </div>
                                                <div className="flex-1 pb-8">
                                                    <h3 className="font-semibold text-lg flex items-center gap-2">
                                                        Week {milestone.week}: {milestone.title}
                                                        {milestone.status === 'PENDING' && <Badge variant="outline" className="text-xs">Current</Badge>}
                                                    </h3>
                                                    <p className="text-muted-foreground mt-1 mb-3">
                                                        {milestone.content}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Advice generated {formatDistanceToNow(new Date(milestone.createdAt), { addSuffix: true })}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default DashboardView;
