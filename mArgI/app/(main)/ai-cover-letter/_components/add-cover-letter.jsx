"use client";

import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { checkCoverLetterLimit } from "@/actions/cover-letter";
import useFetch from "@/app/hooks/use-fetch";
import UpgradeDialog from "@/components/upgrade-dialog";

const AddCoverLetter = ({ canCreate = true }) => {
    const router = useRouter();
    const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
    const [checkLimitFn, result, isChecking, error] = useFetch(checkCoverLetterLimit);

    const handleCreateClick = async () => {
        if (!canCreate) {
             setShowUpgradeDialog(true);
             return;
        }
       // If canCreate is true (from client side prop), we still double check via server action to be safe
       // OR we can trust the prop for speed. Let's do the check for consistency with other flows.
       await checkLimitFn();
    };

    useEffect(() => {
        if (result?.success) {
            router.push("/ai-cover-letter/new");
        }
    }, [result, router]);

    useEffect(() => {
        if (error) {
             if (error.message === "PLAN_LIMIT_EXCEEDED") {
                setShowUpgradeDialog(true);
             } else {
                 toast.error("Failed to verify plan limits.");
             }
        }
    }, [error]);

    return (
        <div className="md:flex hidden">
             <Button 
                onClick={handleCreateClick}
                disabled={isChecking}
                variant="outline" 
                className={`gap-2 border-primary/20 hover:border-primary/50 text-foreground bg-primary/10 hover:bg-primary/20 shadow-lg shadow-primary/10 ${!canCreate ? "opacity-75 cursor-not-allowed" : ""}`}
            >
                {isChecking ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Plus className="h-4 w-4" />
                )}
                Create New
            </Button>

            <UpgradeDialog 
                isOpen={showUpgradeDialog} 
                onOpenChange={setShowUpgradeDialog}
                title="Cover Letter Limit Reached"
                description="You've reached the maximum number of cover letters allowed in the Free Tier. Upgrade to Placement Pro for unlimited AI-powered cover letters tailored to every job."
            />
        </div>
    );
};

export const AddCoverLetterMobile = ({ canCreate = true }) => {
     const router = useRouter();
    const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
    const [checkLimitFn, result, isChecking, error] = useFetch(checkCoverLetterLimit);

    const handleCreateClick = async () => {
        if (!canCreate) {
             setShowUpgradeDialog(true);
             return;
        }
       await checkLimitFn();
    };

    useEffect(() => {
        if (result?.success) {
            router.push("/ai-cover-letter/new");
        }
    }, [result, router]);
    
    useEffect(() => {
        if (error) {
             if (error.message === "PLAN_LIMIT_EXCEEDED") {
                setShowUpgradeDialog(true);
             } else {
                toast.error("Error verifying limit.");
             }
        }
    }, [error]);

    return (
        <>
            <Button 
                size="icon" 
                className="md:hidden"
                onClick={handleCreateClick}
                disabled={isChecking}
            >
                 {isChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
            <UpgradeDialog 
                isOpen={showUpgradeDialog} 
                onOpenChange={setShowUpgradeDialog}
                title="Cover Letter Limit Reached"
                description="You've reached the maximum number of cover letters allowed in the Free Tier. Upgrade to Placement Pro for unlimited AI-powered cover letters tailored to every job."
            />
        </>
    );
};

export default AddCoverLetter;
