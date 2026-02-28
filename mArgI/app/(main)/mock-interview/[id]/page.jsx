import { redirect } from "next/navigation";
import { db } from "@/lib/prisma";
import { checkUser } from "@/lib/checkUser";
import { generateScreeningQuestions, submitScreening } from "@/actions/screening";
import MockInterviewParamsClient from "./_components/params-client";

export default async function MockInterviewPage({ params }) {
    const user = await checkUser();
    if (!user) redirect("/sign-in");

    const resolvedParams = await params;
    const jobId = decodeURIComponent(resolvedParams.id); // Decode just in case, though Next.js usually handles it. Explicit is safer if we double encoded or if client behavior varies.
    
    console.log("MockInterviewPage - JobID:", jobId);

    // Fetch Job Data
    const job = await db.jobPost.findUnique({
        where: { id: jobId }
    });

    if (!job) {
        console.error("MockInterviewPage - Job not found in DB:", jobId);
        return <div className="p-8 text-center text-muted-foreground">Job not found. Please try applying again from the jobs list.</div>;
    }

    // Check if already vetted
    const existingScreening = await db.jobScreening.findFirst({
        where: {
            userId: user.id,
            jobId: jobId,
            passed: true
        }
    });

    if (existingScreening) {
        // If already passed, redirect back to jobs or show success
        redirect("/jobs"); 
    }

    // Pre-fetch questions server-side
    const initialQuestions = await generateScreeningQuestions(job.description, job.title);

    return (
        <div className="container mx-auto py-8 max-w-2xl">
            <div className="mb-6">
                 <h1 className="text-2xl font-bold">AI Screening Interview</h1>
                 <p className="text-muted-foreground">for {job.title} at {job.company}</p>
            </div>
            
            <div className="bg-card border rounded-lg shadow-sm">
                <MockInterviewParamsClient 
                    questions={initialQuestions} 
                    jobId={jobId}
                />
            </div>
        </div>
    );
}
