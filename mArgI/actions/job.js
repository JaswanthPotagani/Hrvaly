"use server";

import { db } from "@/lib/prisma";
import { checkUser } from "@/lib/checkUser";

/**
 * Upserts a job post into the local database.
 * Used to ensure we have a local copy of JSearch jobs for linking purposes.
 * @param {Object} job - The job object from JSearch API
 */
export async function saveJob(job) {
    if (!job?.job_id) return { success: false, error: "Invalid job data" };

    try {
        await checkUser(); // Ensure user is authenticated, though not strictly needed for just saving a public job

        const savedJob = await db.jobPost.upsert({
            where: { id: job.job_id },
            update: {
                // Update mutable fields if we re-encounter the job?
                // For now, keeping it simple or updating robustly
                updatedAt: new Date(),
            },
            create: {
                id: job.job_id,
                title: job.job_title,
                company: job.employer_name || "Unknown Company",
                description: job.job_description || "No description provided",
                location: `${job.job_city ? job.job_city + ", " : ""}${job.job_country || ""}`,
                logo: job.employer_logo || null,
                url: job.job_apply_link || null,
            }
        });

        return { success: true, data: savedJob };
    } catch (error) {
        console.error("Error saving job:", error);
        return { success: false, error: error.message };
    }
}
