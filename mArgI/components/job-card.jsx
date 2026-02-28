"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Briefcase, Building2 } from "lucide-react";

import { useState } from "react";
import { checkVettingStatus } from "@/actions/screening";
import { saveJob } from "@/actions/job";
import { ScreeningDialog } from "./screening-dialog";
import { Loader2 } from "lucide-react";

export default function JobCard({ job, onApply }) {
  const [isChecking, setIsChecking] = useState(false);
  const [showScreeningDialog, setShowScreeningDialog] = useState(false);

  const handleApply = async () => {
    setIsChecking(true);
    try {
        // 1. Save Job to DB (ensures we have record for screening)
        await saveJob(job);

        // 2. Check if already vetted
        const isVetted = await checkVettingStatus(job.job_id);

        if (isVetted) {
            onApply(job);
        } else {
            setShowScreeningDialog(true);
        }
    } catch (error) {
        console.error("Apply flow error:", error);
        // Fallback or show toast
    } finally {
        setIsChecking(false);
    }
  };

  return (
    <>
        <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
            <CardTitle className="flex justify-between items-start w-full">
                <div className="flex flex-col gap-1 w-full min-w-0">
                    <h2 className="text-xl font-bold line-clamp-2 break-words" title={job.job_title}>
                        {job.job_title}
                    </h2>
                    <div className="flex items-center text-muted-foreground text-sm">
                        <Building2 className="h-3 w-3 mr-1" />
                        <span className="truncate">{job.employer_name}</span>
                    </div>
                </div>
            </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
            <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mr-2" />
                {job.job_city ? `${job.job_city}, ` : ""}{job.job_country}
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
                <Briefcase className="h-4 w-4 mr-2" />
                {job.job_employment_type || "Full-time"}
            </div>
            
            {job.job_description && (
                <p className="text-sm text-muted-foreground line-clamp-3 mt-2">
                    {job.job_description.length > 150 
                        ? job.job_description.substring(0, 150) + "..." 
                        : job.job_description}
                </p>
            )}
        </CardContent>
        <CardFooter>
            <Button onClick={handleApply} className="w-full" disabled={isChecking}>
            {isChecking ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                </>
            ) : (
                "Apply Now"
            )}
            </Button>
        </CardFooter>
        </Card>

        <ScreeningDialog 
            isOpen={showScreeningDialog} 
            onOpenChange={setShowScreeningDialog}
            jobId={job.job_id}
            jobTitle={job.job_title}
        />
    </>
  );
}
