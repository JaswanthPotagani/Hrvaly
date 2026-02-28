"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { Trophy, TrendingUp, TrendingDown, Clock, Target } from "lucide-react";

const PerformanceChart = ({ assessments }) => {
    const [categoryStats, setCategoryStats] = useState({});
    const [recentGrowth, setRecentGrowth] = useState(null);

    useEffect(() => {
        if (assessments && assessments.length > 0) {
            // Calculate Category Averages
            const stats = {};
            assessments.forEach(assessment => {
                const cat = assessment.category || "General";
                if (!stats[cat]) {
                    stats[cat] = { total: 0, count: 0 };
                }
                stats[cat].total += assessment.quizScore;
                stats[cat].count += 1;
            });

            const computedStats = Object.keys(stats).map(cat => ({
                category: cat,
                average: Math.round(stats[cat].total / stats[cat].count)
            })).sort((a, b) => b.average - a.average); // Sort by highest score

            setCategoryStats(computedStats);

            // Calculate Recent Growth (Difference between latest and average of previous 3)
            if (assessments.length > 1) {
                const latest = assessments[0].quizScore;
                const previous = assessments[1].quizScore;
                setRecentGrowth(latest - previous);
            }
        }
    }, [assessments]);

    if (!assessments || assessments.length === 0) return null;

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="gradient-title text-3xl md:text-4xl">
                            Performance Analysis
                        </CardTitle>
                        <CardDescription>
                            Your improvement over time and category strengths
                        </CardDescription>
                    </div>
                   {recentGrowth !== null && (
                        <div className="self-start md:self-center">
                            <Badge variant={recentGrowth >= 0 ? "default" : "destructive"} className="px-4 py-2 text-sm">
                                {recentGrowth >= 0 ? <TrendingUp className="mr-2 h-4 w-4" /> : <TrendingDown className="mr-2 h-4 w-4" />}
                                {recentGrowth >= 0 ? "+" : ""}{recentGrowth.toFixed(1)}% vs last
                            </Badge>
                        </div>
                   )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid gap-8 md:grid-cols-2">
                    {/* Category Performance */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2">
                             <Target className="h-5 w-5 text-primary" />
                             <h3 className="text-lg font-semibold">Category Proficiency</h3>
                        </div>
                        
                        <div className="space-y-4">
                            {categoryStats.length > 0 ? (
                                categoryStats.map((stat) => (
                                    <div key={stat.category} className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium text-muted-foreground">{stat.category}</span>
                                            <span className="font-bold">{stat.average}%</span>
                                        </div>
                                        <Progress value={stat.average} className="h-2 bg-muted/50" />
                                    </div>
                                ))
                            ) : (
                                <p className="text-muted-foreground text-sm">No category data available</p>
                            )}
                        </div>
                    </div>

                    {/* Recent History Table / List */}
                    <div className="space-y-6">
                         <div className="flex items-center gap-2">
                             <Clock className="h-5 w-5 text-primary" />
                             <h3 className="text-lg font-semibold">Recent History</h3>
                        </div>

                        <div className="space-y-3">
                            {assessments.slice(0, 5).map((assessment, index) => (
                                <div key={assessment.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-lg border bg-muted/10 hover:bg-muted/20 transition-colors gap-3">
                                    <div className="flex flex-col space-y-0.5">
                                        <span className="font-medium text-base">{assessment.interviewType || assessment.category || "Assessment"}</span>
                                        <span className="text-xs text-muted-foreground">{format(new Date(assessment.createdAt), "MMM dd, yyyy • h:mm a")}</span>
                                    </div>
                                    <div className="flex items-center gap-2 self-start sm:self-center">
                                        <span className={`text-xl font-bold ${assessment.quizScore >= 80 ? "text-green-500" : assessment.quizScore >= 60 ? "text-yellow-500" : "text-red-500"}`}>
                                            {assessment.quizScore.toFixed(0)}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default PerformanceChart;