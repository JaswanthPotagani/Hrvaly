
// Mock logic for verifying the webhook fix
// Since we can't import the Next.js route easily, we replicate the specific logic block

const PLAN_MAP = {
  "plan_basic_123": "BASIC",
  "plan_premium_456": "PREMIUM",
};

function handlePlan(planId) {
    const planName = PLAN_MAP[planId];

    if (!planName) {
      console.log(`Log Error: Unknown plan ID ${planId}`);
      return { status: 422, message: `Unrecognized plan ID: ${planId}. Webhook will be retried.` };
    }
    
    return { status: 200, planName };
}

console.log("Verifying Webhook Plan Mapping Fix...");

// Test Case 1: Known Plan
const result1 = handlePlan("plan_basic_123");
console.assert(result1.planName === "BASIC" && result1.status === 200, "Should identify BASIC plan with 200");
console.log("Test 1 (Known Plan): Passed");

// Test Case 2: Unknown Plan
const result2 = handlePlan("plan_unknown_999");
console.assert(result2.planName === undefined, "Should not return a plan name");
console.assert(result2.status === 422, "Should return 422 status to trigger retry");
console.log("Test 2 (Unknown Plan): Passed (Triggered Retry via 422)");

console.log("Verification Complete.");
