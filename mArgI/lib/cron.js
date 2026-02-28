/**
 * Securely verifies that a request is authorized to trigger a cron job.
 * 
 * Recommends:
 * 1. A high-entropy CRON_SECRET set in environment variables.
 * 2. Vercel automatically sends this secret in the Authorization header.
 * 
 * @param {Request} req - The incoming request object
 * @returns {boolean} - True if authorized, false otherwise
 */
export function verifyCronAuth(req) {
  const authHeader = req.headers.get("authorization");
  
  // 1. Ensure CRON_SECRET is configured
  if (!process.env.CRON_SECRET) {
    console.error("CRON_SECRET is not configured in environment variables.");
    return false;
  }

  // 2. Validate Authorization header matches the secret
  // Note: Vercel sends "Bearer <SECRET>"
  const expectedHeader = `Bearer ${process.env.CRON_SECRET}`;
  
  if (authHeader !== expectedHeader) {
    // We do NOT log the headers here to prevent secret leakage in logs
    return false;
  }

  return true;
}
