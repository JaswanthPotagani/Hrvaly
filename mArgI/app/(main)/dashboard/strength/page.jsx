import { redirect } from "next/navigation";
import { getUserDashboardData } from "@/actions/dashboard";
import { auth } from "@/auth";
import StrengthView from "../_components/strength-view";
import StrengthTeaser from "../_components/strength-teaser";

const SecretStrengthPage = async () => {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }

  const { userData } = await getUserDashboardData();

  if (!userData?.secretInsight) {
    // If no secret insight, redirect back to dashboard
    redirect("/dashboard");
  }

  const isFreePlan = !userData.plan || userData.plan === "FREE";

  return (
    <div className="container mx-auto py-8">
      {isFreePlan ? (
        <StrengthTeaser />
      ) : (
        <StrengthView strength={userData.secretInsight} />
      )}
    </div>
  );
};

export default SecretStrengthPage;
