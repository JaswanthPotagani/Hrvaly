import { describe, it, expect, beforeEach, vi } from 'vitest'
import { checkLoginRateLimit, recordLoginAttempt, resetLoginAttempts } from './rate-limit'

// Mock monitoring to prevent real alerts
vi.mock('@/lib/monitoring', () => ({
  sendAlert: vi.fn(() => Promise.resolve()),
}))

describe('Rate Limiting Logic', () => {
  const testEmail = 'test@example.com'

  beforeEach(() => {
    // Reset internal store between tests if possible
    // Note: Since Map is internal and not exported, we simulate reset via logout/time
    resetLoginAttempts(testEmail)
  })

  it('should allow initial attempts', () => {
    const status = checkLoginRateLimit(testEmail)
    expect(status.allowed).toBe(true)
    expect(status.remainingAttempts).toBe(5)
  })

  it('should decrement attempts after failure', () => {
    recordLoginAttempt(testEmail)
    const status = checkLoginRateLimit(testEmail)
    expect(status.allowed).toBe(true)
    expect(status.remainingAttempts).toBe(4)
  })

  it('should block after 5 attempts', () => {
    for (let i = 0; i < 5; i++) {
      recordLoginAttempt(testEmail)
    }
    const status = checkLoginRateLimit(testEmail)
    expect(status.allowed).toBe(false)
    expect(status.remainingAttempts).toBe(0)
  })

  it('should reset after successful login', () => {
    recordLoginAttempt(testEmail)
    resetLoginAttempts(testEmail)
    const status = checkLoginRateLimit(testEmail)
    expect(status.allowed).toBe(true)
    expect(status.remainingAttempts).toBe(5)
  })
})
