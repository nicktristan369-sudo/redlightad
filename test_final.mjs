import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Age gate
  await page.addInitScript(() => {
    localStorage.setItem('age_verified', 'true');
  });
  
  await page.goto('https://redlightad.com/register/customer');
  await page.click('button:has-text("Sign up with email and password")');
  await page.waitForTimeout(1000);
  
  // Fill
  const email = `test_${Date.now()}@test.com`;
  const pass = 'Test123456!';
  
  console.log('Email:', email);
  console.log('Pass:', pass);
  
  await page.fill('input[type="email"]', email);
  const pwds = await page.locator('input[type="password"]').all();
  if (pwds.length >= 2) {
    await pwds[0].fill(pass);
    await pwds[1].fill(pass);
  }
  
  // Submit and check for error immediately  
  const form = await page.locator('form').first();
  await form.click('button[type="submit"]');
  
  // Wait a bit and check if error appears on signup form
  await page.waitForTimeout(3000);
  
  const errorDiv = await page.locator('[role="alert"]');
  const hasError = await errorDiv.isVisible().catch(() => false);
  
  if (hasError) {
    const errorMsg = await errorDiv.textContent();
    console.log('ERROR:', errorMsg);
  }
  
  const currentURL = page.url();
  console.log('URL after submit:', currentURL);
  
  if (currentURL.includes('/login')) {
    console.log('Redirected to login - signup failed');
  } else if (currentURL.includes('/register/provider')) {
    console.log('SUCCESS - at profile creation');
  } else {
    console.log('URL changed to:', currentURL);
  }
  
  // Keep open 10 seconds for inspection
  await page.waitForTimeout(10000);
  await browser.close();
}

test().catch(console.error);
