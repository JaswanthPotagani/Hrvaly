"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { updateApplicationStatus } from "@/actions/application";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function StatusUpdateDialog({ open, onOpenChange, application, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const router = useRouter();

  const handleUpdate = async (newStatus) => {
    setLoading(true);
    try {
        const result = await updateApplicationStatus(application.id, newStatus, feedback);
        if (result.success) {
            toast.success("Status Updated");
            if (newStatus === "rejected" && feedback) {
                toast.info("Feedback saved. Our AI will analyze this to improve your future prep.");
            }
            onSuccess();
            onOpenChange(false);
            router.refresh();
        } else {
            toast.error(result.error || "Update failed");
        }
    } catch (error) {
        toast.error("An error occurred");
    } finally {
        setLoading(false);
    }
  };

  if (!application) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Status</DialogTitle>
          <DialogDescription>
            For {application.jobTitle} at {application.employerName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
             <div className="flex flex-col gap-2">
                <Label>Did you get the job?</Label>
                <div className="flex gap-4">
                     <Button 
                        variant="outline" 
                        className="flex-1 bg-green-50 hover:bg-green-100 hover:text-green-700 border-green-200"
                        onClick={() => handleUpdate("hired")}
                        disabled={loading}
                     >
                        ✅ Hired
                     </Button>
                     <Button 
                        variant="outline" 
                        className="flex-1 bg-red-50 hover:bg-red-100 hover:text-red-700 border-red-200"
                        onClick={() => handleUpdate("rejected")} // For simple rejection without feedback
                        disabled={loading}
                     >
                        ❌ Rejected
                     </Button>
                </div>
             </div>
        
            {/* If user wants to provide rejection feedback, we can have a separate flow or valid input */}
            <div className="pt-4 border-t">
                <Label className="mb-2 block">Rejected? Tell us why (Optional)</Label>
                <Textarea 
                    placeholder="e.g. 'Struggled with system design', 'They wanted more React experience'..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="h-24"
                />
                 <p className="text-xs text-muted-foreground mt-1">
                    Providing feedback helps our AI generate better practice questions for you next time.
                 </p>
                 <Button 
                    className="w-full mt-4" 
                    variant="destructive"
                    onClick={() => handleUpdate("rejected")}
                    disabled={loading || !feedback}
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : null}
                    Submit Rejection & feedback
                </Button>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
