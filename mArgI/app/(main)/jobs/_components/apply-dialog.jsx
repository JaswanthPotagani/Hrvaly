"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { applyToJob } from "@/actions/jobs";
import { toast } from "sonner";
import { saveResumeFile } from "@/actions/resume";
import { Upload, FileText, CheckCircle2, AlertTriangle } from "lucide-react";
import { PLAN_LIMITS } from "@/lib/pricing";

export function ApplyDialog({ open, onOpenChange, job, userResumes = [], user }) {
  const [resumeType, setResumeType] = useState("existing");
  const [selectedResumeId, setSelectedResumeId] = useState(
    userResumes.length > 0 ? userResumes[0].id : ""
  );
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const userPlan = user?.plan || "FREE";
  const resumeLimit = PLAN_LIMITS[userPlan]?.resumeStorage || 1;
  const isAtLimit = userResumes.length >= resumeLimit;

  const handleSubmit = async () => {
  if (!job) return;
  setLoading(true);

  try {
    let resumeId = selectedResumeId;

    // Handle optional file upload if 'upload' was selected
    if (resumeType === "upload" && file) {
      if (isAtLimit) {
         toast.error("Resume Limit Reached", {
             description: `Your ${userPlan} plan allows up to ${resumeLimit} resume${resumeLimit > 1 ? 's' : ''}. Please use an existing one or upgrade.`
         });
         setLoading(false);
         return;
      }
      const formData = new FormData();
      formData.append("resume", file);
      const newResume = await saveResumeFile(formData);
      resumeId = newResume.id;
    }

    if (!resumeId && resumeType === "existing") {
        toast.error("Please select a resume");
        setLoading(false);
        return;
    }

    // 1. Record the application in Margi's database
    const result = await applyToJob({
      jobId: job.job_id,
      jobTitle: job.job_title,
      employerName: job.employer_name,
      employerLogo: job.employer_logo,
      jobApplyLink: job.job_apply_link,
      resumeId: resumeId,
    });

    if (result.success) {
      toast.success("Redirecting to Employer Site...", {
        description: `We've saved this application to your Margi dashboard.`
      });
      
      // 2. THE ACTUAL "SUBMIT": Move the user to the real application portal
      if (job.job_apply_link) {
        window.location.href = job.job_apply_link;
      }
      
      onOpenChange(false);
    }
  } catch (error) {
    if (error.message === "RESUME_CREATION_LIMIT_REACHED") {
        toast.error("Resume Limit Reached", {
            description: `Your ${userPlan} plan allows up to ${resumeLimit} resume${resumeLimit > 1 ? 's' : ''}. Please use an existing one or upgrade.`
        });
    } else {
        toast.error("Application failed. Please try again.");
    }
  } finally {
    setLoading(false);
  }
};

  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Apply to {job.employer_name}</DialogTitle>
          <DialogDescription>
            Applying for {job.job_title} role.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <RadioGroup defaultValue="existing" value={resumeType} onValueChange={setResumeType}>
            {/* Existing Resume Option */}
            <div className={`flex items-center space-x-3 space-y-0 rounded-md border p-4 ${resumeType === 'existing' ? 'border-primary bg-primary/5' : ''}`}>
              <RadioGroupItem value="existing" id="existing" disabled={userResumes.length === 0} />
              <Label htmlFor="existing" className="flex-1 cursor-pointer">
                Select from your resumes
                {userResumes.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">No resumes found. Create one or upload below.</p>
                )}
              </Label>
              <FileText className={`h-5 w-5 ${resumeType === 'existing' ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>

            {resumeType === "existing" && userResumes.length > 0 && (
                <div className="pl-9">
                    <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a resume" />
                        </SelectTrigger>
                        <SelectContent>
                            {userResumes.map((resume) => (
                                <SelectItem key={resume.id} value={resume.id}>
                                    {resume.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {/* Upload Option */}
            <div className={`flex items-center space-x-3 space-y-0 rounded-md border p-4 ${resumeType === 'upload' ? 'border-primary bg-primary/5' : ''}`}>
              <RadioGroupItem value="upload" id="upload" />
              <Label htmlFor="upload" className="flex-1 cursor-pointer">
                Upload a new resume
                <p className="text-xs text-muted-foreground mt-1">Accepts PDF, DOCX</p>
              </Label>
              <Upload className={`h-5 w-5 ${resumeType === 'upload' ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>

            {resumeType === "upload" && (
                <div className="pl-9 space-y-3">
                    <Input 
                        type="file" 
                        accept=".pdf,.docx,.doc" 
                        onChange={(e) => setFile(e.target.files[0])} 
                        className="cursor-pointer"
                    />
                    {isAtLimit && (
                        <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded-md border border-amber-200">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            <p>
                                You have reached your limit of {resumeLimit} resume{resumeLimit > 1 ? 's' : ''} on the {userPlan} plan. 
                                Please use an existing resume or upgrade your plan.
                            </p>
                        </div>
                    )}
                    {file && (
                        <p className="text-xs text-green-600 flex items-center">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            {file.name} selected
                        </p>
                    )}
                </div>
            )}
          </RadioGroup>
        </div>

        <DialogFooter className="sm:justify-end">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={loading || (resumeType === "upload" && isAtLimit)}>
            {loading ? "Applying..." : "Submit Application"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
