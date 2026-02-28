import ApplicationList from "./_components/application-list";
import { db } from "@/lib/prisma";
import { auth } from "@/auth"; // Assuming auth is available here
import { redirect } from "next/navigation";

export default async function ApplicationsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const applications = await db.jobApplication.findMany({
    where: { userId: session.user.id },
    orderBy: { appliedAt: "desc" },
  });

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold gradient-title">My Applications</h1>
        <p className="text-muted-foreground mt-2">
            Track your job applications and interview status.
        </p>
      </div>
      
      <ApplicationList applications={applications} />
    </div>
  );
}
