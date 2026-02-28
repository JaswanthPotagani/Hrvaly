import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  // Supports both NEXTAUTH_SECRET (legacy/v4) and AUTH_SECRET (v5)
  AUTH_SECRET: z.string().min(1).optional(),
  NEXTAUTH_SECRET: z.string().min(1).optional(),
  AUTH_TRUST_HOST: z.string().optional(),
  RAZORPAY_KEY_ID: z.string().min(1),
  RAZORPAY_KEY_SECRET: z.string().min(1),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1),
  RAZORPAY_PLAN_ID_BASIC: z.string().min(1, "Basic Plan ID is missing"),
  RAZORPAY_PLAN_ID_PREMIUM: z.string().min(1, "Premium Plan ID is missing"),
  RAZORPAY_PLAN_ID_BASIC_DISCOUNT: z.string().min(1, "Discounted Basic Plan ID is missing"),
  RAZORPAY_PLAN_ID_PREMIUM_DISCOUNT: z.string().min(1, "Discounted Premium Plan ID is missing"),
  GEMINI_API_KEY: z.string().min(1, "Gemini API Key is missing"),
  RESEND_API_KEY: z.string().min(1, "Resend API Key is missing"),
  // Optional but recommended
  RESEND_SENDER_EMAIL: z.string().email().optional(),
}).refine(data => data.AUTH_SECRET || data.NEXTAUTH_SECRET, {
  message: "Either AUTH_SECRET or NEXTAUTH_SECRET must be provided",
  path: ["AUTH_SECRET"],
});

// Validate process.env
const env = envSchema.safeParse(process.env);

if (!env.success) {
  const errors = env.error.flatten().fieldErrors;
  console.error("❌ Invalid environment variables:", JSON.stringify(errors, null, 2));
  
  // Do NOT throw in production anymore, as it crashes the entire app/server actions
  // instead, we'll log clearly and let the app try to run
  if (process.env.NODE_ENV === 'production') {
      console.warn("⚠️ Production environment variables validation failed. The app may be unstable.");
  }
} else {
  console.log("✅ Environment variables validated successfully");
}

export const validatedEnv = env.data || process.env; // Fallback to process.env if validation failed
