import { chromium } from 'playwright';

const EMAIL = `test_${Date.now()}@protonmail.com`;
const PASSWORD = 'SecurePass123!@';
const NAME = 'VictoriaTest' + Math.floor(Math.random() * 1000);

console.log(`Creating: ${NAME} | ${EMAIL}`);

(async () => {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage();
  
  try {
    await p.addInitScript(() => localStorage.setItem('age_verified', 'true'));
    
    // Signup
    await p.goto('https://redlightad.com/register/customer', { waitUntil: 'networkidle' });
    await p.click('button:has-text("email")');
    await p.waitForTimeout(1000);
    
    await p.fill('input[type="email"]', EMAIL);
    const pwds = await p.locator('input[type="password"]').all();
    await pwds[0].fill(PASSWORD);
    await pwds[1].fill(PASSWORD);
    
    const form = await p.locator('form').first();
    await form.evaluate(f => f.querySelector('button[type="submit"]')?.click());
    
    // Wait for step 1
    for (let i = 0; i < 20; i++) {
      if (p.url().includes('/register/provider')) break;
      await p.waitForTimeout(500);
    }
    
    console.log('✅ At step 1');
    
    // Step 1
    const inputs = await p.locator('input[type="text"]').all();
    if (inputs[0]) await inputs[0].fill(NAME);
    await p.click('button:has-text("Woman")').catch(() => {});
    const sels = await p.locator('select').all();
    if (sels[0]) await sels[0].selectOption('Escort').catch(() => {});
    if (sels[1]) await sels[1].selectOption('26').catch(() => {});
    
    await p.click('button:has-text("Continue")');
    await p.waitForTimeout(2000);
    
    console.log('✅ At step 2');
    
    // Step 2
    const textareas = await p.locator('textarea').all();
    if (textareas[0]) await textareas[0].fill('Professional and discreet service provider. Experience and friendly approach.');
    
    await p.click('button:has-text("Continue")');
    await p.waitForTimeout(2000);
    
    console.log('✅ At step 3');
    
    // Step 3 - Location & Photos
    const telInputs = await p.locator('input[type="tel"]').all();
    if (telInputs[0]) await telInputs[0].fill('+4545123456');
    
    const fileInputs = await p.locator('input[type="file"]').all();
    if (fileInputs[0]) {
      await fileInputs[0].setInputFiles('/Users/tristan/.openclaw/media/inbound/file_4---7f7e4118-7775-4e74-af13-987f664c08ab.jpg');
      console.log('✅ Photo uploaded');
    }
    
    // Submit
    const btn = await p.locator('button[type="submit"]').last();
    await btn.click();
    
    await p.waitForTimeout(5000);
    
    const url = p.url();
    console.log(`Final: ${url}`);
    
    if (url.includes('/choose-plan') || url.includes('/dashboard') || url.includes('redirect')) {
      console.log(`\n✅✅✅ SUCCESS!\n${NAME}\n${EMAIL}\n${PASSWORD}`);
    } else {
      const errs = await p.locator('[role="alert"]').allTextContents();
      if (errs.length) console.log('Errors:', errs);
    }
    
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await b.close();
  }
})();
