/**
 * JWT Session Blacklist
 * 
 * This module provides functionality to blacklist JWT tokens for banned users
 * or forced logouts. Uses in-memory storage for MVP (can be upgraded to Redis).
 */

// In-memory blacklist (use Redis in production for distributed systems)
const blacklistedTokens = new Set();

/**
 * Blacklist a user's session token
 * @param {string} token - The JWT token to blacklist
 * @param {number} expiresIn - Time in milliseconds until token naturally expires
 */
export function blacklistToken(token, expiresIn = 24 * 60 * 60 * 1000) {
  blacklistedTokens.add(token);
  
  // Auto-remove from blacklist after token expiration
  setTimeout(() => {
    blacklistedTokens.delete(token);
  }, expiresIn);
}

/**
 * Check if a token is blacklisted
 * @param {string} token - The JWT token to check
 * @returns {boolean} - True if blacklisted
 */
export function isTokenBlacklisted(token) {
  return blacklistedTokens.has(token);
}

/**
 * Blacklist all tokens for a user (called when user is banned)
 * @param {string} userId - The user ID to blacklist
 */
export function blacklistUserTokens(userId) {
  // Note: This is a simplified implementation
  // In production, you'd want to store userId -> token mappings
  // For now, we'll rely on the JWT callback to check bannedAt
  console.log(`Blacklisting all tokens for user: ${userId}`);
}

/**
 * Remove a token from blacklist
 * @param {string} token - The JWT token to remove
 */
export function removeFromBlacklist(token) {
  blacklistedTokens.delete(token);
}

/**
 * Clear all blacklisted tokens (use with caution)
 */
export function clearBlacklist() {
  blacklistedTokens.clear();
}
