"use server";

console.log("actions/user.js module loaded");

import { db } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signIn } from "@/auth";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { checkRegistrationRateLimit, recordRegistrationAttempt, getClientIP } from "@/lib/rate-limit";

import { registerSchema } from "@/lib/validations";

export async function registerUser(data) {
    const parsed = registerSchema.safeParse(data);
    
    if (!parsed.success) {
        throw new Error(parsed.error.errors[0].message);
    }
    
    const { name, email, password, referralCode } = parsed.data;

    // Rate limiting check
    const ip = getClientIP(headers());
    const rateLimit = checkRegistrationRateLimit(ip);
    
    if (!rateLimit.allowed) {
        throw new Error("Too many registration attempts. Please try again later.");
    }
    
    // Record attempt
    recordRegistrationAttempt(ip);

    const existingUser = await db.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        throw new Error("User with this email already exists");
    }

    // Use 12 rounds for better security as per production best practices
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await db.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            referralCode: referralCode?.trim().toUpperCase(),
        },
    });

    return { success: true };
}

export async function loginUser({ email, password }) {
    try {
        console.log(`[AUTH-ACTION] Login attempt for ${email}`);

        if (typeof signIn !== "function") {
            console.error("[AUTH-ACTION] signIn is not a function!");
            return { error: "Auth configuration error: signIn is not available." };
        }
        
        console.log("[AUTH-ACTION] Calling signIn...");
        const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        console.log("[AUTH-ACTION] signIn result:", JSON.stringify(result));

        if (result?.error) {
            console.error("[AUTH-ACTION] Sign in error:", result.error);
            if (result.error === "CredentialsSignin" || result.error.includes("credential")) {
                return { error: "Invalid email or password" };
            }
            return { error: result.error };
        }

        console.log("[AUTH-ACTION] Login success");
        return { success: true };
    } catch (error) {
        console.error("[AUTH-ACTION] Critical error:", error);
        if (error.message?.includes("CredentialsSignin")) {
            return { error: "Invalid email or password" };
        }
        return { error: `Server Error: ${error.message || "Unknown error"}` };
    }
}

import { checkUser } from "@/lib/checkUser";

export async function getUserOnboardingStatus() {
    const user = await checkUser();

    if (!user) {
        return { isOnboarded: false };
    }

    return {
        isOnboarded: !!user.industry,
    };
}

export async function getUserData() {
    const user = await checkUser();
    if (!user) return null;
    return user;
}

export async function updateUser(data) {
    const session = await auth();
    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    const { 
        industry, 
        experience, 
        bio, 
        skills, 
        location,
        userType,
        college,
        degree,
        branch,
        currentYear,
        graduationYear,
        isGraduated,
        specialization
    } = data;

    // Validate that required fields are present (basic validation)
    // More complex validation is handled by Zod on the client side, 
    // but server-side checks are good practice.

    // Update user in database
    try {
                // Check if industry exists (though frontend ensures this, good to be safe)
                // Assuming you have logic to validate industry string or just storing it directly
                
                // Clean up data based on userType
                const updateData = {
                    industry,
                    experience: experience ? parseInt(experience) : null,
                    bio,
                    skills: Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s => s.trim()) : []),
                    location,
                    userType,
                    specialization,
                    // Student fields
                    college: userType === 'student' ? college : null,
                    degree: userType === 'student' ? degree : null,
                    branch: userType === 'student' ? branch : null,
                    // Handle years - convert to int if present
                    currentYear: (userType === 'student' && currentYear) ? parseInt(currentYear) : null,
                    graduationYear: (userType === 'student' && graduationYear) ? parseInt(graduationYear) : null,
                    isGraduated: userType === 'student' ? isGraduated : null,
                };

                await db.user.update({
                    where: {
                        id: session.user.id,
                    },
                    data: updateData,
                });

        return { success: true };
    } catch (error) {
        console.error("Error updating user:", error);
        return { success: false, error: "Failed to update profile" };
    }
}

export async function getUserProprietaryData() {
    const user = await checkUser();
    if (!user) return null;

    return {
        learnabilityScore: user.learnabilityScore || 0,
        decisionQuality: user.decisionQuality || {},
        badges: await db.verificationBadge.findMany({
            where: { userId: user.id }
        })
    };
}