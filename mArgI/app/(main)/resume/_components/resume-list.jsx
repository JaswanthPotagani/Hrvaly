"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { FileText, MoreVertical, Pen, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const ResumeList = ({ resumes }) => {
    const router = useRouter();

    if (!resumes || resumes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-10 space-y-8">
                {/* Visual Empty State */}
                <div className="flex flex-col items-center text-center">
                     <div className="bg-muted/20 p-4 rounded-full mb-4">
                        <FileText className="h-12 w-12 text-muted-foreground opacity-50" />
                     </div>
                     <h2 className="text-xl font-semibold">No resumes created yet</h2>
                     <p className="text-muted-foreground text-sm max-w-sm mt-2">
                        Create your first AI-optimized resume to unlock industry insights and get noticed by recruiters.
                     </p>
                </div>

                {/* Educational Content Section - only visible when empty */}
                <div className="w-full max-w-4xl grid gap-6 md:grid-cols-2">
                    
                    {/* How to Create */}
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Pen className="h-5 w-5 text-primary" />
                                How to Create a Resume in mArgI
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-3">
                            <div className="flex items-start gap-3">
                                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">1</span>
                                <p>Click the <strong>&quot;Create New Resume&quot;</strong> button at the top right.</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">2</span>
                                <p>Enter your basic details, or paste your existing resume content.</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">3</span>
                                <p>Let our AI optimize your content with industry keywords and formatting.</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* What is ATS */}
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <div className="h-5 w-5 rounded-full border-2 border-primary flex items-center justify-center text-[10px] font-bold">VS</div>
                                What is an ATS Resume?
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground space-y-2">
                           <p>
                                An <strong>Applicant Tracking System (ATS)</strong> is software used by 99% of Fortune 500 companies to filter resumes before a human ever sees them.
                           </p>
                           <p>
                                An ATS-friendly resume is formatted specifically to be readable by these bots, ensuring your application doesn&apos;t get rejected due to design errors.
                           </p>
                        </CardContent>
                    </Card>

                    {/* Benefits of mArgI */}
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <MoreVertical className="h-5 w-5 text-primary rotate-90" />
                                Why Build with mArgI?
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm">
                            <ul className="grid grid-cols-1 gap-2">
                                <li className="flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                                    Instant ATS Score & Feedback
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                                    AI-Powered Content Optimization
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                                    Industry-Specific Keyword Injection
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                                    One-Click Cover Letter Generation
                                </li>
                            </ul>
                        </CardContent>
                    </Card>

                    {/* SEO Keywords */}
                    <Card className="shadow-sm bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
                         <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Trash2 className="h-5 w-5 text-primary hidden" /> {/* Dummy icon for alignment if needed, or remove */}
                                Top 10 High-Impact Keywords
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {["Strategic Planning", "Cross-Functional Leadership", "Data Analysis", "Project Management", "Process Optimization", "Revenue Growth", "Stakeholder Management", "Agile Methodologies", "Cloud Computing", "Change Management"].map((keyword, i) => (
                                    <span key={i} className="px-2 py-1 bg-background border rounded text-xs font-medium text-muted-foreground hover:text-primary hover:border-primary transition-colors cursor-default">
                                        {keyword}
                                    </span>
                                ))}
                            </div>
                             <p className="text-xs text-muted-foreground mt-4 italic">
                                * Use these based on your specific industry for maximum impact.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resumes.map((resume) => (
                <Card key={resume.id} className="hover:shadow-lg transition-shadow duration-300 group cursor-pointer" onClick={()=> router.push(`/resume/${resume.id}`)}>
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                        <CardTitle className="text-lg font-semibold truncate group-hover:text-primary transition-colors">
                            {resume.title}
                        </CardTitle>
                        {/* 
                          TODO: Implement Delete functionality later if needed.
                          For now, just a placeholder or could add 'Edit' link.
                        */}
                    </CardHeader>
                    <CardContent>
                        <CardDescription>
                            Last updated: {format(new Date(resume.updatedAt), "MMM d, yyyy")}
                        </CardDescription>
                        {resume.atsScore ? (
                             <div className="mt-4 flex items-center gap-2">
                                <div className={`px-2 py-1 rounded text-xs font-medium ${resume.atsScore >= 70 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                    ATS Score: {resume.atsScore}
                                </div>
                             </div>
                        ) : (
                             <div className="mt-4 text-xs text-muted-foreground">No ATS Score yet</div>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

export default ResumeList;
