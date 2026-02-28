import crypto from "crypto";
import { sendAlert } from "@/lib/monitoring";

/**
 * Rate Limiting Utilities
 * 
 * Provides in-memory rate limiting for authentication endpoints
 * to prevent brute-force attacks and credential stuffing.
 */

// Store for tracking login attempts: email -> { count, resetTime }
const loginAttempts = new Map();

/**
 * Stable hash for emails to avoid storing PII in memory or logs.
 */
function hashEmail(email) {
  if (!email) return "";
  return crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
}

// Store for tracking registration attempts: ip -> { count, resetTime }
const registrationAttempts = new Map();

// Configuration
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const REGISTER_MAX_ATTEMPTS = 3;
const REGISTER_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// Strict limits for users without IP headers (Global Guest Bucket)
const FALLBACK_IP_LIMIT = 5; // Shared limit for ALL unknown IPs combined
const FALLBACK_IP_WINDOW_MS = 60 * 60 * 1000; // 1 hour

/**
 * Check if login is rate limited for an email
 * @param {string} email - User email
 * @returns {{allowed: boolean, remainingAttempts: number, resetTime: Date|null}}
 */
export function checkLoginRateLimit(email) {
  const now = Date.now();
  const emailHash = hashEmail(email);
  const attempt = loginAttempts.get(emailHash);

  // No previous attempts or window expired
  if (!attempt || now > attempt.resetTime) {
    return { allowed: true, remainingAttempts: LOGIN_MAX_ATTEMPTS, resetTime: null };
  }

  // Check if limit exceeded
  if (attempt.count >= LOGIN_MAX_ATTEMPTS) {
    return {
      allowed: false,
      remainingAttempts: 0,
      resetTime: new Date(attempt.resetTime)
    };
  }

  return {
    allowed: true,
    remainingAttempts: LOGIN_MAX_ATTEMPTS - attempt.count,
    resetTime: new Date(attempt.resetTime)
  };
}

/**
 * Record a failed login attempt
 * @param {string} email - User email
 */
export function recordLoginAttempt(email) {
  const now = Date.now();
  const emailHash = hashEmail(email);
  const attempt = loginAttempts.get(emailHash);

  if (!attempt || now > attempt.resetTime) {
    // Start new window
    loginAttempts.set(emailHash, {
      count: 1,
      resetTime: now + LOGIN_WINDOW_MS
    });
  } else {
    // Increment count
    attempt.count++;
    
    // Check if we just hit the limit - TRIGGER ALERT
    if (attempt.count === LOGIN_MAX_ATTEMPTS) {
      // Fire and forget alert to avoid blocking
      sendAlert(`Crypto-Alert: Brute-force/Credential Stuffing detected for ${email}`, {
         emailHash: hashEmail(email),
         attemptCount: attempt.count, 
         context: 'login_rate_limit'
      }).catch(err => console.error("Failed to send rate limit alert", err));
    }
  }

  // Clean up old entries periodically
  if (loginAttempts.size > 1000) {
    cleanupLoginAttempts();
  }
}

/**
 * Reset login attempts for an email (called on successful login)
 * @param {string} email - User email
 */
export function resetLoginAttempts(email) {
  loginAttempts.delete(hashEmail(email));
}

/**
 * Check if registration is rate limited for an IP
 * @param {string} ip - Client IP address
 * @returns {{allowed: boolean, remainingAttempts: number, resetTime: Date|null}}
 */
export function checkRegistrationRateLimit(ip) {
  const now = Date.now();
  const attempt = registrationAttempts.get(ip);

  // No previous attempts or window expired
  if (!attempt || now > attempt.resetTime) {
    return { allowed: true, remainingAttempts: REGISTER_MAX_ATTEMPTS, resetTime: null };
  }

  // Check if limit exceeded
  const limit = ip === "unknown" ? FALLBACK_IP_LIMIT : REGISTER_MAX_ATTEMPTS;
  
  if (attempt.count >= limit) {
    return {
      allowed: false,
      remainingAttempts: 0,
      resetTime: new Date(attempt.resetTime)
    };
  }

  return {
    allowed: true,
    remainingAttempts: limit - attempt.count,
    resetTime: new Date(attempt.resetTime)
  };
}

/**
 * Record a registration attempt
 * @param {string} ip - Client IP address
 */
export function recordRegistrationAttempt(ip) {
  const now = Date.now();
  const attempt = registrationAttempts.get(ip);

  if (!attempt || now > attempt.resetTime) {
    // Start new window
    const windowMs = ip === "unknown" ? FALLBACK_IP_WINDOW_MS : REGISTER_WINDOW_MS;
    registrationAttempts.set(ip, {
      count: 1,
      resetTime: now + windowMs
    });
  } else {
    // Increment count
    attempt.count++;

    // Alert if unknown bucket hit limit
    if (ip === "unknown" && attempt.count === FALLBACK_IP_LIMIT) {
       sendAlert(`Security-Alert: Rate limit hit for shared 'unknown' IP bucket`, {
          attemptCount: attempt.count,
          context: 'registration_rate_limit_fallback'
       }).catch(err => console.error("Failed to send unknown IP alert", err));
    }
  }

  // Clean up old entries periodically
  if (registrationAttempts.size > 1000) {
    cleanupRegistrationAttempts();
  }
}

/**
 * Clean up expired login attempts
 */
function cleanupLoginAttempts() {
  const now = Date.now();
  for (const [email, attempt] of loginAttempts.entries()) {
    if (now > attempt.resetTime) {
      loginAttempts.delete(email);
    }
  }
}

/**
 * Clean up expired registration attempts
 */
function cleanupRegistrationAttempts() {
  const now = Date.now();
  for (const [ip, attempt] of registrationAttempts.entries()) {
    if (now > attempt.resetTime) {
      registrationAttempts.delete(ip);
    }
  }
}

/**
 * Get client IP from headers (for use in server actions)
 * @param {Headers} headers - Request headers
 * @returns {string} - Client IP address
 */
export function getClientIP(headers) {
  // Try various headers in order of preference
  // 1. Vercel specific header (most accurate on Vercel)
  const vercelForwardedFor = headers.get('x-vercel-forwarded-for');
  if (vercelForwardedFor) {
    return vercelForwardedFor.split(',')[0].trim();
  }

  // 2. Cloudflare
  const cfIP = headers.get('cf-connecting-ip');
  if (cfIP) return cfIP;

  // Standard proxy headers
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // CRITICAL: Avoid a shared 'unknown' bucket which can cause DoS for multiple users 
  // if they all fallback to the same string. 
  // UPDATE: We ARE using a shared 'unknown' bucket, but with a very strict limit.
  // This prevents attackers from bypassing rate limits by stripping headers.
  return "unknown";
}
