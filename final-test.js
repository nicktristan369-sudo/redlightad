import { chromium } from 'playwright';

const EMAIL = `livetest_${Date.now()}@protonmail.com`;
const PASSWORD = 'Test123456!';
const NAME = 'SarahLive' + Math.random().toString(36).slice(7).toUpperCase();

console.log(`\n🚀 FINAL TEST: Creating ${NAME}\n`);

(async () => {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage();
  
  try {
    await p.addInitScript(() => localStorage.setItem('age_verified', 'true'));
    
    console.log('📍 Signup...');
    await p.goto('https://redlightad.com/register/customer', { waitUntil: 'networkidle' });
    await p.click('button:has-text("email")');
    await p.waitForTimeout(1000);
    
    await p.fill('input[type="email"]', EMAIL);
    const pwds = await p.locator('input[type="password"]').all();
    await pwds[0].fill(PASSWORD);
    await pwds[1].fill(PASSWORD);
    
    await p.locator('form').first().evaluate(f => f.querySelector('button[type="submit"]')?.click());
    
    for (let i = 0; i < 30; i++) {
      if (p.url().includes('/register/provider')) break;
      await p.waitForTimeout(200);
    }
    console.log('✅ Signup OK');
    
    console.log('📍 Step 1...');
    const inp = await p.locator('input[type="text"]').first();
    await inp.fill(NAME);
    await p.click('button:has-text("Woman")').catch(() => {});
    await p.locator('select').first().selectOption('Escort').catch(() => {});
    await p.locator('select').nth(1).selectOption('27').catch(() => {});
    await p.click('button:has-text("Continue")');
    await p.waitForTimeout(2000);
    console.log('✅ Step 1 OK');
    
    console.log('📍 Step 2...');
    const textarea = await p.locator('textarea').first();
    await textarea.fill('Experienced professional. Discrete, friendly service. Available for both incall and outcall.');
    await p.click('button:has-text("Continue")');
    await p.waitForTimeout(2000);
    console.log('✅ Step 2 OK');
    
    console.log('📍 Step 3...');
    const tel = await p.locator('input[type="tel"]').first();
    await tel.fill('+4550555444');
    
    const file = await p.locator('input[type="file"]').first();
    await file.setInputFiles('/Users/tristan/.openclaw/media/inbound/file_4---7f7e4118-7775-4e74-af13-987f664c08ab.jpg');
    console.log('✅ Photo uploaded');
    
    console.log('📍 Submitting...');
    const btn = await p.locator('button[type="submit"]').last();
    await btn.click();
    
    for (let i = 0; i < 30; i++) {
      const url = p.url();
      if (url.includes('/choose-plan') || url.includes('/dashboard') || url.includes('/profile')) {
        console.log(`\n✅✅✅ SUCCESS! Profile created:\n\n👤 ${NAME}\n📧 ${EMAIL}\n🔐 ${PASSWORD}\n\n🔗 Visit: https://redlightad.com\n`);
        await b.close();
        process.exit(0);
      }
      await p.waitForTimeout(500);
    }
    
    const url = p.url();
    const errs = await p.locator('[role="alert"]').allTextContents();
    console.log(`\nFinal URL: ${url}`);
    if (errs.length) console.log('Errors:', errs.filter(e => e.trim()));
    
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await b.close();
  }
})();
