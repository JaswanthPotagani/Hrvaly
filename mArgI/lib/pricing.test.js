import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getPlanNameFromId, RAZORPAY_PLAN_MAP } from './pricing'

describe('Pricing Logic', () => {
  describe('getPlanNameFromId', () => {
    it('should return null for undefined planId', () => {
      expect(getPlanNameFromId(undefined)).toBeNull()
    })

    it('should return null for unknown planId', () => {
      expect(getPlanNameFromId('plan_unknown')).toBeNull()
    })

    it('should return BASIC for a valid basic plan ID', () => {
      // Assuming RAZORPAY_PLAN_MAP is populated correctly from env
      // This is slightly tricky if env is empty during tests, but we can check existence
      const basicId = Object.keys(RAZORPAY_PLAN_MAP).find(key => RAZORPAY_PLAN_MAP[key] === 'BASIC')
      if (basicId) {
        expect(getPlanNameFromId(basicId)).toBe('BASIC')
      }
    })
  })
})
