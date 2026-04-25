import { chromium } from 'playwright';

async function testSignup() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const apiErrors = [];
  
  // Listen for API responses
  page.on('response', resp => {
    if (!resp.ok()) {
      console.log(`[${resp.status()}] ${resp.url()}`);
      if (resp.url().includes('auth')) {
        apiErrors.push({status: resp.status(), url: resp.url()});
      }
    }
  });
  
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
  
  console.log(`📧 Email: ${email}`);
  await page.fill('input[type="email"]', email);
  
  const passwordFields = await page.locator('input[type="password"]').all();
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
  
  // Wait
  console.log('⏳ Waiting...');
  await Promise.race([
    page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 }).catch(() => {}),
    page.waitForTimeout(10000)
  ]);
  
  // Result
  const finalURL = page.url();
  const hasError = await page.locator('[role="alert"]').isVisible().catch(() => false);
  const errorText = hasError ? await page.locator('[role="alert"]').textContent() : null;
  
  console.log('\n=== RESULT ===');
  console.log('Final URL:', finalURL);
  console.log('Has error:', hasError);
  if (errorText) console.log('Error text:', errorText.trim());
  if (apiErrors.length > 0) {
    console.log('API errors:', apiErrors);
  }
  
  await browser.close();
}

testSignup().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
