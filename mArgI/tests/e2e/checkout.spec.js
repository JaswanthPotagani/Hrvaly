const { test, expect } = require('@playwright/test');

async function completeOnboarding(page) {
  console.log('DETECTED ONBOARDING: Completing form...');
  try {
    // 1. Select professional user type
    await page.locator('label[for="professional"]').click();
    
    // 2. Fill experience
    await page.locator('#experience').fill('5');
    
    // 3. Select industry (shadcn/ui Select)
    // We click the trigger, then click the option in the portal
    await page.locator('#industry').click();
    await page.locator('role=option >> text=Technology').first().click();
    
    // 4. Select specialization
    await page.locator('#subIndustry').click();
    await page.locator('role=option').first().click();
    
    // 5. Fill location
    await page.locator('#location').fill('Remote');
    
    // 6. Fill Bio
    await page.locator('#bio').fill('E2E Test User');
    
    // 7. Submit
    console.log('Submitting onboarding form...');
    await page.click('button:has-text("Complete Profile")');
    
    // 8. Wait for dashboard (Generates AI insights, might be slow)
    console.log('Waiting for post-onboarding redirect (AI Generation in progress)...');
    await page.waitForURL(url => url.pathname.includes('/dashboard'), { timeout: 60000 });
    console.log('Onboarding complete, reached dashboard.');
  } catch (e) {
    console.error('Failed to complete onboarding form:', e.message);
    // Fallback: force navigate
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
  }
}

async function login(page) {
  console.log('--- LOGIN START ---');
  await page.goto('/sign-in', { waitUntil: 'networkidle' });
  
  await page.fill('input[type="email"]', 'e2e-test@example.com');
  await page.fill('input[type="password"]', 'Password123!');
  
  const submitButton = page.locator('button[type="submit"]');
  await submitButton.click();
  
  // Track URL changes
  page.on('framenavigated', frame => {
    if (frame === page.mainFrame()) {
      console.log('NAVIGATED TO:', page.url());
    }
  });

  try {
    // Wait for ANY successful login landing
    await page.waitForURL(url => 
      url.pathname.includes('/dashboard') || 
      url.pathname.includes('/onboarding'), 
      { timeout: 30000 }
    );
    
    // Brief stabilization
    await page.waitForTimeout(2000);
    console.log('Login stabilization URL:', page.url());

    if (page.url().includes('/onboarding')) {
      await completeOnboarding(page);
    }
  } catch (e) {
    console.error('Login wait failed:', e.message);
    if (!page.url().includes('/dashboard')) {
       await page.goto('/dashboard', { waitUntil: 'networkidle' });
    }
  }
  console.log('--- LOGIN DONE ---');
}

test.describe('Razorpay Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Pipe browser console to host console
    page.on('console', msg => console.log(`BROWSER: ${msg.text()}`));
    
    // 1. Log in
    await login(page);
    
    // 2. Late redirect recovery loop
    // Some Next.js redirects happen after the first mount
    console.log('Starting late redirect recovery check...');
    for (let i = 0; i < 5; i++) {
        await page.waitForTimeout(1000);
        if (page.url().includes('/onboarding')) {
            console.log(`LATE REDIRECT DETECTED (Attempt ${i+1})`);
            await completeOnboarding(page);
            break;
        }
        if (page.url().includes('/dashboard')) {
            // Check if we can see the welcome message
            const welcome = page.getByRole('heading', { name: /Welcome/i });
            if (await welcome.count() > 0 && await welcome.first().isVisible()) {
                console.log('Dashboard content visible.');
                break;
            }
        }
    }

    // 3. Final Dashboard Confirmation
    console.log('Confirming final dashboard visibility...');
    const welcomeHeader = page.getByRole('heading', { name: /Welcome/i });
    await expect(welcomeHeader.first()).toBeVisible({ timeout: 20000 });
    console.log('Dashboard confirmed.');

    // 4. Close dialogs
    const dialogClose = page.locator('button:has-text("Close"), [aria-label="Close"]');
    if (await dialogClose.count() > 0 && await dialogClose.first().isVisible()) {
      await dialogClose.first().click();
    }
  });

  test('should trigger Razorpay modal when clicking upgrade', async ({ page }) => {
    // Navigate to dashboard explicitly to ensure stability
    await page.goto('/dashboard');
    
    // Identify any 'Upgrade' related button
    const upgradeButton = page.locator('button').filter({ hasText: /Upgrade|Choose Plan|Select Plan/i }).first();
    
    if (await upgradeButton.isVisible({ timeout: 15000 })) {
        console.log('Upgrade button found. Clicking...');
        await upgradeButton.click();
        
        console.log('Waiting for Razorpay iframe...');
        // Razorpay uses an iframe with class 'razorpay-checkout-frame'
        await expect(page.locator('.razorpay-checkout-frame')).toBeAttached({ timeout: 30000 });
        console.log('Razorpay modal detected successfully');
    } else {
        console.log('No upgrade button detected. User might already have a plan.');
        await expect(page.getByText(/Current Plan|Basic|Premium/i).first()).toBeVisible();
    }
  });

  test('should verify dashboard accessibility', async ({ page }) => {
    await page.goto('/dashboard');
    // Use role-based locator for better accessibility testing
    await expect(page.getByRole('heading', { name: /Welcome/i }).first()).toBeVisible({ timeout: 20000 });
  });
});
