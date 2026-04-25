import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Set age verification in localStorage before navigating
  await page.addInitScript(() => {
    localStorage.setItem('age_verified', 'true');
  });
  
  await page.goto('https://redlightad.com/register/customer');
  
  // Wait for email button and click
  const emailBtn = await page.waitForSelector('button:has-text("Sign up with email and password")', { timeout: 5000 });
  await emailBtn.click();
  
  // Wait for form to appear
  await page.waitForSelector('input[type="email"]', { timeout: 5000 });
  
  // Fill form
  const email = `test_${Date.now()}@protonmail.com`;
  const password = 'TestPass@123!';
  
  await page.fill('input[type="email"]', email);
  await page.waitForTimeout(500);
  
  const passwordInputs = await page.locator('input[type="password"]').all();
  await passwordInputs[0].fill(password);
  await passwordInputs[1].fill(password);
  await page.waitForTimeout(500);
  

  
  // Submit
  const createBtn = await page.locator('button:has-text("Create account")');
  const isDisabled = await createBtn.isDisabled();
  const btnHTML = await createBtn.evaluate(el => el.outerHTML);
  console.log('Button disabled:', isDisabled);
  console.log('Button HTML:', btnHTML.substring(0, 200));
  
  console.log('📝 Clicking create button...');
  await createBtn.click();
  
  // Wait for result
  console.log('⏳ Waiting for response...');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  const finalUrl = page.url();
  
  // Check for errors
  const errorDiv = await page.locator('[role="alert"]').isVisible().catch(() => false);
  const errorText = errorDiv ? await page.locator('[role="alert"]').textContent() : null;
  
  if (errorText) {
    console.log('❌ Error message:', errorText);
  } else {
    console.log('✅ Signup completed. URL:', finalUrl);
  }
  
  // Log page content for debugging
  const content = await page.content();
  if (content.includes('password')) {
    console.log('⚠️  Still on signup form (password field still present)');
  } else {
    console.log('✓ Form submitted');
  }
  
  await browser.close();
}

test().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
