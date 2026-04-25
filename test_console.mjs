import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Log all console messages
  page.on('console', async msg => {
    console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
  });
  
  // Log uncaught errors
  page.on('pageerror', error => {
    console.log('[UNCAUGHT ERROR]', error.message);
  });
  
  await page.addInitScript(() => {
    localStorage.setItem('age_verified', 'true');
  });
  
  console.log('Going to signup...');
  await page.goto('https://redlightad.com/register/customer');
  
  await page.click('button:has-text("Sign up with email and password")');
  await page.waitForTimeout(500);
  
  const email = `test_${Date.now()}@test.com`;
  const pass = 'Test123456!';
  
  await page.fill('input[type="email"]', email);
  const pwds = await page.locator('input[type="password"]').all();
  if (pwds.length >= 2) {
    await pwds[0].fill(pass);
    await pwds[1].fill(pass);
  }
  
  console.log('\nSubmitting form...\n');
  
  const form = await page.locator('form').first();
  await form.evaluate(f => {
    // Log and then submit
    const btn = f.querySelector('button[type="submit"]');
    if (btn) {
      console.log('Button found, clicking...');
      btn.click();
    } else {
      console.log('No submit button found!');
      f.submit();
    }
  });
  
  console.log('Submitted, waiting...\n');
  await page.waitForTimeout(3000);
  
  const url = page.url();
  console.log('Final URL:', url);
  
  await browser.close();
}

test().catch(console.error);
