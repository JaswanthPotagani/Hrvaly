"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FileText, CheckCircle2, AlertTriangle } from "lucide-react";

const ResumeScore = ({ score }) => {
    // Placeholder score logic if prop not provided
    const displayScore = score || 0;
    
    return (
        <Card className="bg-gradient-to-br from-primary/10 via-background to-background border-primary/20 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-2 -mr-2 w-20 h-20 bg-primary/20 rounded-full blur-2xl"></div>
            
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-lg">
                    <span className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        ATS Score Analysis
                    </span>
                    <Badge variant={displayScore >= 80 ? 'default' : 'secondary'} className="text-xs">
                        {displayScore >= 80 ? 'High Match' : 'Optimization Needed'}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-end justify-between">
                    <div>
                        <div className="text-3xl font-bold text-primary">{displayScore}%</div>
                        <p className="text-xs text-muted-foreground">Match with job market standards</p>
                    </div>
                </div>
                
                <Progress value={displayScore} className="h-2" />
                
                <div className="space-y-2 pt-2">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                            Keyword Density
                        </span>
                        <span className="font-medium">92%</span>
                    </div>
                    <Progress value={92} className="h-1 bg-muted" />
                </div>
            </CardContent>
        </Card>
    );
};

export default ResumeScore;
