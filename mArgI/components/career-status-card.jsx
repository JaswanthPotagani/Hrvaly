"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BriefcaseIcon, Zap } from "lucide-react";

const CareerStatusCard = ({ currentStatus = {}, upgradeSkills = [] }) => {
    return (
        <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <BriefcaseIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    Your Career Status
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
                {/* Current Status Summary */}
                <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Current Profile
                    </h3>
                    <div className="bg-muted/30 rounded-lg p-3 sm:p-4 space-y-2">
                        {currentStatus.role && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Role:</span>
                                <span className="text-sm font-medium">{currentStatus.role}</span>
                            </div>
                        )}
                        {currentStatus.experience !== undefined && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Experience:</span>
                                <span className="text-sm font-medium">
                                    {currentStatus.experience} {currentStatus.experience === 1 ? 'year' : 'years'}
                                </span>
                            </div>
                        )}
                        {currentStatus.primarySkill && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Primary Skill:</span>
                                <span className="text-sm font-medium">{currentStatus.primarySkill}</span>
                            </div>
                        )}
                        {currentStatus.summary && (
                            <p className="text-sm text-muted-foreground pt-2 border-t border-border/50">
                                {currentStatus.summary}
                            </p>
                        )}
                    </div>
                </div>

                {/* Skills Required to Upgrade */}
                <div className="space-y-3 pt-4 border-t border-border/50">
                    <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            Skills to Level Up
                        </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {upgradeSkills.length > 0 ? (
                            upgradeSkills.map((skill, index) => (
                                <Badge 
                                    key={index} 
                                    variant="outline"
                                    className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm border-primary/40 bg-primary/5 hover:bg-primary/10 transition-colors break-words whitespace-normal max-w-full"
                                >
                                    <Zap className="h-3 w-3 mr-1 inline flex-shrink-0" />
                                    <span className="break-words">{skill}</span>
                                </Badge>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground">Complete your profile to get recommendations</p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default CareerStatusCard;
