import { chromium } from 'playwright';

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  const E = `t${Date.now()}@t.com`, P = 'T123!', N = 'Profile' + Math.random().toString(36).slice(7).toUpperCase();
  
  try {
    await p.addInitScript(() => localStorage.setItem('age_verified', 'true'));
    
    console.log(`Creating: ${N}`);
    
    // Signup
    await p.goto('https://redlightad.com/register/customer');
    await p.click('button:has-text("email")');
    await p.waitForTimeout(800);
    
    await p.fill('input[type="email"]', E);
    const pwds = await p.locator('input[type="password"]').all();
    await pwds[0].fill(P);
    await pwds[1].fill(P);
    
    (await p.locator('form').first()).evaluate(f => f.querySelector('button')?.click());
    
    await p.waitForTimeout(5000);
    
    // Step 1
    (await p.locator('input[type="text"]').first()).fill(N);
    await p.click('button:has-text("Woman")').catch(() => null);
    const sels = await p.locator('select').all();
    if (sels[0]) await sels[0].selectOption('Escort');
    if (sels[1]) await sels[1].selectOption('23');
    await p.click('button:has-text("Continue")');
    
    await p.waitForTimeout(2000);
    
    // Step 2
    const ta = await p.locator('textarea').first();
    if (ta) {
      await ta.fill('Professional and experienced. Discreet service. Available incall and outcall.');
    }
    await p.click('button:has-text("Continue")');
    
    await p.waitForTimeout(2000);
    
    // Step 3
    const tel = await p.locator('input[type="tel"]').first();
    if (tel) await tel.fill('+4540111222');
    
    const file = await p.locator('input[type="file"]').first();
    if (file) await file.setInputFiles('/Users/tristan/.openclaw/media/inbound/file_4---7f7e4118-7775-4e74-af13-987f664c08ab.jpg');
    
    await p.waitForTimeout(2000);
    
    // Submit
    const btn = await p.locator('button[type="submit"]').last();
    if (btn) await btn.click();
    
    await p.waitForTimeout(5000);
    
    console.log(`✅ ${N}\n${E}\n${P}\n\nhttps://redlightad.com\n`);
    
  } catch (e) {
    console.error('E:', e.message);
  }
  
  await b.close();
})();
