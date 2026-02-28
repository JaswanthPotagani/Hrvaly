import { getResumeById, getUserResumeStats } from "@/actions/resume";
import ResumeBuilder from "../_components/resume-builder";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import { checkUser } from "@/lib/checkUser";

const ResumeEditorPage = async ({ params, searchParams }) => {
    // Await params and searchParams as required in Next.js 15+ 
    // (treating as async is safer for future compatibility)
    const { id } = await params; 
    const { initialTitle, template } = await searchParams;

    // Fetch in parallel for better performance
    // Also fetch user for the builder context
    const [resume, stats, user] = await Promise.all([
        getResumeById(id),
        getUserResumeStats(),
        checkUser()
    ]);

    if (!resume && !initialTitle) {
        notFound();
    }

    // Lock Only if it's a New Draft AND user cannot create more
    // OR if it's an existing draft but user is OVER the limit (e.g. downgraded)
    const isReadOnly = !resume 
        ? !stats.canCreate 
        : stats.resumeCount >= stats.storageLimit;

    return (
        <div className="container mx-auto py-6">
            <div className="flex flex-col space-y-2 mb-2">
                <Link href="/resume">
                    <Button variant="link" className="gap-2 pl-0">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Resumes
                    </Button>
                </Link>
            </div>
            
            <ResumeBuilder 
                 initialContent={resume?.content || ""} 
                 initialTitle={initialTitle || resume?.title || "My Resume"}
                 resumeId={id}
                 isReadOnly={isReadOnly}
                 user={user}
                 selectedTemplate={template}
            />
        </div>
    );
};

export default ResumeEditorPage;
