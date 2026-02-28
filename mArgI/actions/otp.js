'use server';

import { db } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import { registerUser } from "./user";

export async function sendOTP(email) {
  // 1. Check if user already exists
  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error("User already exists. Please sign in.");
  }

  // 2. Generate 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // 3. Save to DB (delete old codes for this email first)
  await db.verificationCode.deleteMany({ where: { email } });
  await db.verificationCode.create({
    data: {
      email,
      code,
      expiresAt,
    },
  });

  // 4. Send Email
  try {
    const sender = process.env.RESEND_SENDER_EMAIL || 'onboarding@resend.dev';
    console.log(`Sending OTP ${code} to ${email} via ${sender}`);
    
    const response = await resend.emails.send({
      from: sender,
      to: email,
      subject: 'Your Verification Code',
      html: `<p>Your verification code is: <strong>${code}</strong></p><p>It expires in 10 minutes.</p>`,
    });

    console.log("Resend API Response:", response);
    
    if (response.error) {
       console.error("Resend API Error details:", response.error);
       // We don't throw here to see if the user can still proceed if they see the code in logs
    }
  } catch (error) {
    console.error("Resend Exception:", error);
    throw new Error("Failed to send verification email. Please try again.");
  }

  return { success: true };
}

export async function verifyOTPAndRegister(data, code) {
    const { email } = data;

    // 1. Find Code
    const record = await db.verificationCode.findFirst({
        where: {
            email,
            code,
        }
    });

    if (!record) {
        throw new Error("Invalid verification code");
    }

    if (record.expiresAt < new Date()) {
        throw new Error("Verification code expired");
    }

    // 2. Register User (using existing action)
    // We assume registerUser repeats checks, which is fine.
    const user = await registerUser(data);

    // 3. Cleanup Code
    await db.verificationCode.delete({ where: { id: record.id } });

    return user;
}
