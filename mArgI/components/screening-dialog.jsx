"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldCheck, MessageSquareText } from "lucide-react";
import { useRouter } from "next/navigation";

export function ScreeningDialog({ isOpen, onOpenChange, jobId, jobTitle }) {
  const router = useRouter();

  const handleStartScreening = () => {
    // Redirect to the mock interview page with the job title as a query param
    // We strictly use the dynamic route /mock-interview/[id]
    router.push(`/mock-interview/${encodeURIComponent(jobId)}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">Verified Applicant Badge Required</DialogTitle>
          <DialogDescription className="text-center pt-2">
            To ensure quality applications, this employer requires candidates to pass a quick AI screening.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 py-4">
            <div className="bg-muted p-4 rounded-lg flex items-start gap-3">
                <MessageSquareText className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div className="text-sm">
                    <p className="font-medium text-foreground">3-Question Chat Interview</p>
                    <p className="text-muted-foreground mt-1">Answer 3 simple questions about the <strong>{jobTitle}</strong> role via text chat.</p>
                </div>
            </div>
            
            <p className="text-xs text-center text-muted-foreground">
                Passing Score: 70/100 • Takes ~2 minutes
            </p>
        </div>

        <DialogFooter className="sm:justify-center">
          <Button onClick={handleStartScreening} className="w-full sm:w-auto min-w-[200px]" size="lg">
            Start Text Screening
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
