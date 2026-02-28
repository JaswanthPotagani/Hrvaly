import { getRecommendedJobs } from "@/actions/jobs";
import { getAllResumes } from "@/actions/resume";
import { checkUser } from "@/lib/checkUser";
import JobListing from "./_components/job-listing";
import { redirect } from "next/navigation";

export default async function JobsPage() {
  const user = await checkUser();

  if (!user) {
    redirect("/sign-in");
  }
  
  const [jobs, resumes] = await Promise.all([
    getRecommendedJobs(),
    getAllResumes()
  ]);

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold gradient-title pb-2">
            Recommended Jobs
        </h1>
        <p className="text-muted-foreground mt-2">
            Curated opportunities based on your profile: <span className="font-medium text-foreground">{user?.industry || "Software Engineering"}</span> in <span className="font-medium text-foreground">{user?.location || "Remote"}</span>
        </p>
      </div>

      <JobListing jobs={jobs} resumes={resumes} user={user} />
    </div>
  );
}
