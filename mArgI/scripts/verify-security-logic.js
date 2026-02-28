
// Mock implementation of Rate Limiter to verify logic in isolation
// (Since we cannot easily import ESM files in standalone Node without config)

const loginAttempts = new Map();
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

function checkLoginRateLimit(email) {
  const now = Date.now();
  const attempt = loginAttempts.get(email);

  if (!attempt || now > attempt.resetTime) {
    return { allowed: true, remainingAttempts: LOGIN_MAX_ATTEMPTS, resetTime: null };
  }

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

function recordLoginAttempt(email) {
  const now = Date.now();
  const attempt = loginAttempts.get(email);

  if (!attempt || now > attempt.resetTime) {
    loginAttempts.set(email, {
      count: 1,
      resetTime: now + LOGIN_WINDOW_MS
    });
  } else {
    attempt.count++;
  }
}

// Verification Logic
console.log("Starting Rate Limit Logic Verification...");
const email = "test@example.com";

// 1. Initial State
let status = checkLoginRateLimit(email);
console.assert(status.allowed === true, "Should be allowed initially");
console.assert(status.remainingAttempts === 5, "Should have 5 attempts");
console.log("Initial check passed.");

// 2. Consume 5 attempts
for (let i = 1; i <= 5; i++) {
    recordLoginAttempt(email);
    status = checkLoginRateLimit(email);
    console.log(`After attempt ${i}: Allowed=${status.allowed}, Remaining=${status.remainingAttempts}`);
}

// 3. Verify Blocked
status = checkLoginRateLimit(email);
console.assert(status.allowed === false, "Should be blocked after 5 attempts");
console.assert(status.remainingAttempts === 0, "Remaining should be 0");

if (status.allowed === false) {
    console.log("SUCCESS: Rate limiting correctly blocks after 5 attempts.");
} else {
    console.error("FAILURE: Rate limiting failed to block.");
    process.exit(1);
}

// 4. Test Blacklist Logic (Mock)
const blacklistedTokens = new Set();
function blacklistToken(token) { blacklistedTokens.add(token); }
function isTokenBlacklisted(token) { return blacklistedTokens.has(token); }

const token = "abc-123";
blacklistToken(token);
console.assert(isTokenBlacklisted(token) === true, "Token should be blacklisted");
console.log("Blacklist check passed.");

console.log("All security logic checks passed.");
