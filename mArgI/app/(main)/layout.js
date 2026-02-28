import React from "react";
import { checkUser } from "@/lib/checkUser";
import { redirect } from "next/navigation";
import BeamsBackground from "@/components/beams-background-wrapper";

const MainLayout = async ({ children }) => {
    const user = await checkUser();

    if (!user) {
        redirect("/sign-in");
    }

    return (
        <BeamsBackground>
            <div className="container mx-auto mt-24 mb-20 px-4">
                {children}
            </div>
        </BeamsBackground>
    );
};

export default MainLayout;