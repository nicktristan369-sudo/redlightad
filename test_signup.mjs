import { chromium } from 'playwright';

async function testSignup() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Set age verification
  await page.addInitScript(() => {
    localStorage.setItem('age_verified', 'true');
  });
  
  console.log('🚀 Navigating to signup...');
  await page.goto('https://redlightad.com/register/customer', { waitUntil: 'networkidle' });
  
  // Click email signup
  console.log('📝 Clicking email signup button...');
  await page.click('button:has-text("Sign up with email and password")');
  await page.waitForTimeout(1000);
  
  // Fill form
  const email = `test_${Date.now()}@protonmail.com`;
  const password = 'SecurePass123!@';
  
  console.log(`📧 Filling email: ${email}`);
  await page.fill('input[type="email"]', email);
  
  const passwordFields = await page.locator('input[type="password"]').all();
  console.log(`🔒 Found ${passwordFields.length} password fields`);
  
  if (passwordFields.length >= 2) {
    await passwordFields[0].fill(password);
    await passwordFields[1].fill(password);
  }
  
  // Submit
  console.log('✍️  Submitting form...');
  const form = await page.locator('form').first();
  await form.evaluate(f => {
    const btn = f.querySelector('button[type="submit"]');
    if (btn) btn.click();
  });
  
  // Wait for navigation
  console.log('⏳ Waiting for response...');
  await Promise.race([
    page.waitForNavigation({ waitUntil: 'networkidle', timeout: 8000 }).catch(() => {}),
    page.waitForTimeout(8000)
  ]);
  
  // Check result
  const finalURL = page.url();
  const content = await page.content();
  const hasError = await page.locator('[role="alert"]').isVisible().catch(() => false);
  
  console.log('\n=== RESULT ===');
  console.log('Final URL:', finalURL);
  console.log('Error visible:', hasError);
  
  if (content.includes('Create your profile') || content.includes('provider')) {
    console.log('✅ SUCCESS: Signup complete, redirected to profile creation');
  } else if (finalURL.includes('/register')) {
    console.log('❌ FAILED: Still on signup page');
    if (hasError) {
      const errorText = await page.locator('[role="alert"]').textContent();
      console.log('Error:', errorText);
    }
  } else {
    console.log('🤔 Redirected to:', finalURL);
  }
  
  await browser.close();
}

testSignup().catch(err => {
  console.error('❌ Test failed:', err.message);
  process.exit(1);
});
