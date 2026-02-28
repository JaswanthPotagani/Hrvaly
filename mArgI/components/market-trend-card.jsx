"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, DollarSign } from "lucide-react";

const MarketTrendCard = ({ trendingRoles = [], salaryData = null, insights = null }) => {
    // Use insights.salaryRanges if available, otherwise fall back to trendingRoles/salaryData
    const salaryRanges = insights?.salaryRanges || [];
    const hasMultipleRoles = salaryRanges.length > 0;
    
    // State for selected role
    const [selectedRole, setSelectedRole] = useState(
        hasMultipleRoles ? salaryRanges[0]?.role : (salaryData?.role || null)
    );
    
    // Get current salary data based on selection
    const currentSalaryData = hasMultipleRoles
        ? salaryRanges.find(r => r.role === selectedRole) || salaryRanges[0]
        : salaryData;
    
    // Get roles to display
    const rolesToDisplay = hasMultipleRoles
        ? salaryRanges.map(r => r.role)
        : trendingRoles;

    return (
        <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    Trending Roles in Your Industry
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
                {/* Trending Roles List */}
                <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Hot Job Titles
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {rolesToDisplay.length > 0 ? (
                            rolesToDisplay.map((role, index) => (
                                <Badge 
                                    key={index} 
                                    variant={role === selectedRole ? "default" : "outline"}
                                    className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm transition-all ${
                                        hasMultipleRoles 
                                            ? 'cursor-pointer hover:bg-primary/20' 
                                            : ''
                                    }`}
                                    onClick={() => hasMultipleRoles && setSelectedRole(role)}
                                >
                                    {role}
                                </Badge>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground">No trending roles available</p>
                        )}
                    </div>
                </div>

                {/* Salary Data for Selected Role */}
                {currentSalaryData && (
                    <div className="space-y-3 pt-4 border-t border-border/50">
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-primary" />
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                Salary Range - {currentSalaryData.role || selectedRole || "Top Role"}
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                            <div className="bg-muted/30 rounded-lg p-2 sm:p-3 text-center">
                                <p className="text-xs text-muted-foreground mb-1">Minimum</p>
                                <p className="text-base sm:text-lg font-bold text-foreground">
                                    {currentSalaryData.currency || insights?.salaryCurrency || "$"}
                                    {(currentSalaryData.min || currentSalaryData.minSalary)?.toLocaleString() || "N/A"}
                                    <span className="text-xs sm:text-sm font-normal text-muted-foreground ml-1">PA</span>
                                </p>
                            </div>
                            <div className="bg-primary/10 rounded-lg p-2 sm:p-3 text-center border border-primary/20">
                                <p className="text-xs text-muted-foreground mb-1">Median</p>
                                <p className="text-base sm:text-lg font-bold text-primary">
                                    {currentSalaryData.currency || insights?.salaryCurrency || "$"}
                                    {(currentSalaryData.median || currentSalaryData.medianSalary)?.toLocaleString() || "N/A"}
                                    <span className="text-xs sm:text-sm font-normal text-primary/70 ml-1">PA</span>
                                </p>
                            </div>
                            <div className="bg-muted/30 rounded-lg p-2 sm:p-3 text-center">
                                <p className="text-xs text-muted-foreground mb-1">Maximum</p>
                                <p className="text-base sm:text-lg font-bold text-foreground">
                                    {currentSalaryData.currency || insights?.salaryCurrency || "$"}
                                    {(currentSalaryData.max || currentSalaryData.maxSalary)?.toLocaleString() || "N/A"}
                                    <span className="text-xs sm:text-sm font-normal text-muted-foreground ml-1">PA</span>
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default MarketTrendCard;
