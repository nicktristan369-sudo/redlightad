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
  await page.waitForTimeout(1000);
  

  
  // Find and submit form
  const form = await page.locator('form').first();
  console.log('📝 Submitting form...');
  await form.evaluate(f => f.submit());
  
  // Wait for result
  console.log('⏳ Waiting for response...');
  try {
    await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 5000 }).catch(() => {});
  } catch {}
  await page.waitForTimeout(1000);
  const finalUrl = page.url();
  
  // Check for errors
  const errorAlert = await page.locator('[role="alert"]').first().isVisible().catch(() => false);
  if (errorAlert) {
    const errorText = await page.locator('[role="alert"]').first().textContent();
    console.log('❌ Error message:', errorText);
  } else {
    console.log('✅ Signup response received');
  }
  
  console.log('Final URL:', finalUrl);
  
  // Log page content for debugging
  const content = await page.content();
  if (content.includes('Confirm Password')) {
    console.log('⚠️  Still on signup form');
  } else if (content.includes('profile') || content.includes('Profile')) {
    console.log('✓ Redirected to profile creation');
  } else if (content.includes('kunde') || content.includes('dashboard')) {
    console.log('✓ Redirected to dashboard');
  }
  

  
  await browser.close();
}

test().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
