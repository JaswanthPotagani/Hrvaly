"use server";

import { db } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

/**
 * Fetches recommended jobs based on user's industry and location.
 * Uses JSearch API via RapidAPI.
 */
/**
 * Core job fetching logic, independent of session.
 * Used by UI (via getRecommendedJobs) and Agent (via Inngest).
 */
export async function fetchJobsFromAPI(industry, location) {
  const query = `${industry} jobs in ${location}`;
  
  try {
    // 1. Check for cached jobs
    const cachedJobs = await db.jobCache.findUnique({
      where: {
        industry_location: {
          industry,
          location,
        },
      },
    });

    // 2. If valid cache exists (less than 24h old), return it
    if (cachedJobs && Date.now() - new Date(cachedJobs.updatedAt).getTime() < 24 * 60 * 60 * 1000) {
      console.log("Returning cached jobs for:", query);
      return cachedJobs.data;
    }

    // 3. Otherwise fetch from API
    console.log("Fetching new jobs for:", query);
    const response = await fetch(`https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query)}&num_pages=1`, {
      method: "GET",
      headers: {
        "x-rapidapi-key": process.env.RAPIDAPI_KEY || "",
        "x-rapidapi-host": "jsearch.p.rapidapi.com",
      },
    });

    if (!response.ok) {
        console.error("Job fetch failed:", response.status, response.statusText);
        return cachedJobs?.data || []; // Return stale cache if API fails
    }

    const data = await response.json();
    const jobs = data.data || [];

    // 4. Update or create cache
    await db.jobCache.upsert({
      where: {
        industry_location: {
          industry,
          location,
        },
      },
      update: {
        data: jobs,
        updatedAt: new Date(),
      },
      create: {
        industry,
        location,
        data: jobs,
      },
    });

    return jobs;
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return []; 
  }
}

/**
 * Fetches recommended jobs based on user's industry and location.
 * Uses JSearch API via RapidAPI.
 */
export async function getRecommendedJobs() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { industry: true, location: true }
  });

  if (!user) redirect("/sign-in");

  const industry = user.industry || "Software Engineer";
  const location = user.location || "Remote";

  return await fetchJobsFromAPI(industry, location);
}

/**
 * Simulates applying to a job.
 * In a real app, this would send data to the job board or save to an Application table.
 */
/**
 * Apply to a job.
 * Saves the application to the database.
 */
export async function applyToJob({ 
  jobId, 
  jobTitle, 
  employerName, 
  employerLogo, 
  resumeId, 
  jobApplyLink 
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  try {
    // 1. Save the record to your database so it appears in the user's dashboard
    const application = await db.jobApplication.create({
      data: {
        userId: session.user.id,
        jobId,
        jobTitle,
        employerName,
        employerLogo,
        resumeId,
        jobApplyLink,
        status: "applied", // Initial status
      },
    });

    return { 
      success: true, 
      message: "Application tracked and redirecting...", 
      data: application 
    };
  } catch (error) {
    console.error("Database Error:", error);
    return { success: false, error: "Failed to record application." };
  }
}