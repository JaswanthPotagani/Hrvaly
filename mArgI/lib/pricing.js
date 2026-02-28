export const PLAN_LIMITS = {
  FREE: { interview: 2, resume: 1, coverLetter: 1, resumeStorage: 1, voiceInterview: 0, rejectionAnalysis: 5 },
  BASIC: { interview: 5, resume: 5, coverLetter: 5, resumeStorage: 5, voiceInterview: 0, rejectionAnalysis: 20 },
  PREMIUM: { interview: 50, resume: 50, coverLetter: 50, resumeStorage: 50, voiceInterview: 4, rejectionAnalysis: 50 },
};

export const PLAN_CONFIG = {
  FREE: { ticketCount: 2, name: "Free" },
  BASIC: { ticketCount: 5, name: "Basic" },
  PREMIUM: { ticketCount: Infinity, name: "Premium" },
};

/**
 * Mapping of Razorpay Plan IDs to our internal plan names.
 * These are sourced from environment variables.
 */
// Filter out any undefined or empty plan IDs to prevent accidental matches
export const RAZORPAY_PLAN_MAP = Object.fromEntries(
  Object.entries({
    [process.env.RAZORPAY_PLAN_ID_BASIC]: "BASIC",
    [process.env.RAZORPAY_PLAN_ID_PREMIUM]: "PREMIUM",
    [process.env.RAZORPAY_PLAN_ID_BASIC_DISCOUNT]: "BASIC",
    [process.env.RAZORPAY_PLAN_ID_PREMIUM_DISCOUNT]: "PREMIUM",
  }).filter(([key]) => key && key !== "undefined" && key !== "null" && key.trim() !== "")
);

/**
 * Resolves a Razorpay Plan ID to a internal plan name.
 * @param {string} planId - The Razorpay Plan ID (e.g. plan_S0coGyMN72G1S4)
 * @returns {string|null} - The internal plan name ("BASIC", "PREMIUM") or null if unrecognized.
 */
export function getPlanNameFromId(planId) {
  if (!planId) return null;
  
  // Clean potential whitespace or quotes from env vars if they drifted
  return RAZORPAY_PLAN_MAP[planId] || null;
}
