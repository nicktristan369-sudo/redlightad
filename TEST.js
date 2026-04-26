import { chromium } from 'playwright';

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  const E = `live_${Date.now()}@test.com`, P = 'Test123!', N = 'Venus' + Math.floor(Math.random()*1000);
  
  try {
    console.log(`\n🌟 Creating ${N}\n`);
    await p.addInitScript(() => localStorage.setItem('age_verified', 'true'));
    
    // Go to signup
    await p.goto('https://redlightad.com/register/customer');
    
    // Click age gate button - now with autoFocus
    const ageBtn = await p.locator('#age-verify-btn, button:has-text("I am 18")').first();
    if (ageBtn) {
      await ageBtn.click();
      console.log('✓ Age gate clicked');
    }
    
    await p.waitForTimeout(1000);
    
    // Fill email signup
    const emailInput = await p.locator('input[type="email"]').first();
    if (emailInput) {
      await emailInput.fill(E);
      console.log('✓ Email filled');
    }
    
    const pwds = await p.locator('input[type="password"]').all();
    await pwds[0].fill(P);
    await pwds[1].fill(P);
    console.log('✓ Passwords filled');
    
    // Submit
    const submitBtn = await p.locator('form button[type="submit"]').first();
    if (submitBtn) {
      await submitBtn.click();
      console.log('✓ Signup submitted');
    }
    
    // Wait for step 1
    await p.waitForTimeout(5000);
    
    if (p.url().includes('/register/provider')) {
      console.log('✅ At step 1 - signup success!\n');
      console.log(`${N}\n${E}\n${P}\n\nhttps://redlightad.com`);
    } else {
      console.log('URL:', p.url());
    }
    
  } catch (e) {
    console.error('E:', e.message);
  }
  
  await b.close();
})();
