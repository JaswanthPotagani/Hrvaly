"use client";

import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import useFetch from "@/app/hooks/use-fetch";
import { checkResumeCreationLimit } from "@/actions/resume";
import { useEffect } from "react";
import { toast } from "sonner";
import UpgradeDialog from "@/components/upgrade-dialog";
import { useState } from "react";
import { ResumeTemplateSelector } from "./resume-template-selector";

const AddResume = ({ canCreate = true }) => {
    const router = useRouter();
    const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const [checkLimitFn, result, isChecking, error] = useFetch(checkResumeCreationLimit);

    const handleCreateClick = async () => {
        if (!canCreate) {
             setShowUpgradeDialog(true);
             return;
        }
        await checkLimitFn();
    };

    const handleTemplateSelect = (templateId) => {
        router.push(`/resume/create?template=${templateId}`);
    };

    useEffect(() => {
        if (result?.success) {
            // Limit check passed, open template selector
            setIsSelectorOpen(true);
        }
    }, [result]);

    useEffect(() => {
        if (error) {
            if (error.message === "RESUME_CREATION_LIMIT_REACHED") {
                setShowUpgradeDialog(true);
            } else {
                 toast.error("Failed to verify plan limits.");
            }
        }
    }, [error]);

    return (
        <div className="relative group">
            <Button 
                onClick={handleCreateClick} 
                className={`gap-2 mt-4 md:mt-0 ${!canCreate ? "opacity-75 cursor-not-allowed bg-muted-foreground hover:bg-muted-foreground" : ""}`}
                disabled={isChecking} 
            >
                {isChecking ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Checking...
                    </>
                ) : (
                    <>
                        <Plus className="h-4 w-4" />
                        Create New Resume
                    </>
                )}
            </Button>
            
            <ResumeTemplateSelector 
                isOpen={isSelectorOpen}
                onOpenChange={setIsSelectorOpen}
                onSelect={handleTemplateSelect}
                isCreating={false} // We are just redirecting, not creating async yet (page does that)
            />

            <UpgradeDialog 
                isOpen={showUpgradeDialog} 
                onOpenChange={setShowUpgradeDialog}
                title="Resume Limit Reached"
                description="You've reached the maximum number of resumes allowed in the Free Tier. Upgrade to Placement Pro for unlimited resume versions and advanced AI optimization."
            />
        </div>
    );
};

export default AddResume;
