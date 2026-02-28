"use client";

import { useState, useEffect } from "react";
import JobCard from "@/components/job-card";
import { ApplyDialog } from "./apply-dialog";

export default function JobListing({ jobs, resumes, user }) {
    const [selectedJob, setSelectedJob] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleApply = (job) => {
        setSelectedJob(job);
        setIsDialogOpen(true);
    };

    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jobs.map((job) => (
                    <JobCard 
                        key={job.job_id} 
                        job={job} 
                        onApply={handleApply} 
                    />
                ))}
            </div>

            {jobs.length === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                    No jobs found. Try adjusting your profile location or industry.
                </div>
            )}

            <ApplyDialog 
                open={isDialogOpen} 
                onOpenChange={setIsDialogOpen} 
                job={selectedJob} 
                userResumes={resumes} 
                user={user}
            />
        </div>
    );
}
