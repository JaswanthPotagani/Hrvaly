"use server";

import { db } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

// 1. Send OTP for Password Reset
export async function sendPasswordResetOTP(email) {
  try {
    // 1a. Check if user exists (User Requirement: Check first!)
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { error: "Invalid email" }; // User requirement: "show invaild email"
    }

    // 1b. Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    console.log("---- DEBUG OTP CODE ----");
    console.log(`Email: ${email}`);
    console.log(`Code: ${code}`);
    console.log("------------------------");

    // 1c. Save to DB (cleanup old codes first)
    await db.verificationCode.deleteMany({
      where: { email },
    });

    await db.verificationCode.create({
      data: {
        email,
        code,
        expiresAt,
      },
    });

    // 1d. Send Email
    const senderEmail = process.env.RESEND_SENDER_EMAIL || 'onboarding@resend.dev';
    
    const { data, error } = await resend.emails.send({
      from: `Margi AI <${senderEmail}>`,
      to: email,
      subject: "Your Password Reset Code",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>Your verification code is:</p>
          <h1 style="background: #f4f4f5; padding: 10px 20px; border-radius: 5px; display: inline-block; letter-spacing: 5px;">${code}</h1>
          <p>This code expires in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend API Error:", error);
      return { error: "Failed to send verification code. Please try again." };
    }

    return { success: "Verification code sent!" };
  } catch (error) {
    console.error("Send OTP error:", error);
    return { error: "Something went wrong!" };
  }
}

// 2. Verify OTP for Password Reset
export async function verifyPasswordResetOTP(email, code) {
  try {
    const record = await db.verificationCode.findFirst({
      where: {
        email,
        code,
      },
    });

    if (!record) {
      return { error: "Invalid verification code" };
    }

    if (record.expiresAt < new Date()) {
      return { error: "Verification code expired" };
    }

    // Success! 
    // Secure approach: Generate a temporary authorization token for the specific next step
    // Or simpler for this UX: Just return success and trust the client state transition 
    // IF we re-verify the code on the final step (safe path). 
    // We will clean up the code ONLY after password reset is effectively done or let it expire.
    // Actually, safest is to return a signed token but let's stick to re-verifying code at final step or keep code alive until used.

    return { success: true };
  } catch (error) {
    console.error("Verify OTP error:", error);
    return { error: "Something went wrong!" };
  }
}


// 3. Reset Password (Final Step)
// We require the CODE again to verify legitimate request before changing password
export async function resetPasswordWithOTP(email, code, newPassword) {
  try {
     // Re-verify code to prevent bypassing step 2
     const record = await db.verificationCode.findFirst({
        where: { email, code }
     });

     if (!record || record.expiresAt < new Date()) {
        return { error: "Invalid or expired session. Please try again." };
     }

     // Hash new password
     const hashedPassword = await bcrypt.hash(newPassword, 10);

     // Update User
     await db.user.update({
       where: { email },
       data: { password: hashedPassword },
     });

     // Cleanup used code
     await db.verificationCode.deleteMany({
       where: { email }
     });

     return { success: "Password reset successfully!" };

  } catch (error) {
     console.error("Reset password error:", error);
     return { error: "Something went wrong!" };
  }
}
