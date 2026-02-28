import { redirect } from "next/navigation";
import { getUserOnboardingStatus } from "@/actions/user";
import { getUserDashboardData, fetchMarketTrends, getUpgradeSkills } from "@/actions/dashboard";
import DashboardView from "./_components/dashboard-view";

import { auth } from "@/auth";

const IndustryInsightsPage = async({ searchParams }) => {
     const params = await searchParams;
     const currentTab = params?.tab || "overview"; // Default to overview
     const session = await auth();
     if (!session?.user) {
         redirect("/sign-in");
     }

     const {isOnboarded} = await getUserOnboardingStatus();
     
         if(!isOnboarded){
             redirect("/onboarding");
         }

     const { userData, insights } = await getUserDashboardData();
     
     // Fetch market intelligence data
     const marketTrends = await fetchMarketTrends(userData);
     const careerStatus = await getUpgradeSkills(userData);
    
    return (
        <div className="container mx-auto">
            <DashboardView 
                defaultTab={currentTab}
                userData={userData} 
                insights={insights}
                marketTrends={marketTrends}
                careerStatus={careerStatus}
                standardPlanIds={{
                    BASIC: process.env.RAZORPAY_PLAN_ID_BASIC,
                    PREMIUM: process.env.RAZORPAY_PLAN_ID_PREMIUM,
                    BASIC_DISCOUNT: process.env.RAZORPAY_PLAN_ID_BASIC_DISCOUNT,
                    PREMIUM_DISCOUNT: process.env.RAZORPAY_PLAN_ID_PREMIUM_DISCOUNT,
                }}
            />
        </div>
    );
};

export default IndustryInsightsPage;
