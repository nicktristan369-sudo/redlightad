import { chromium } from 'playwright';

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  
  const EMAIL = `q${Date.now()}@test.com`;
  const PWD = 'Test123!';
  
  try {
    await p.addInitScript(() => localStorage.setItem('age_verified', 'true'));
    
    // Signup
    await p.goto('https://redlightad.com/register/customer');
    await p.click('button:has-text("email")');
    await p.waitForTimeout(1500);
    
    await p.fill('input[type="email"]', EMAIL);
    (await p.locator('input[type="password"]').all())[0].fill(PWD);
    (await p.locator('input[type="password"]').all())[1].fill(PWD);
    
    (await p.locator('form').first()).evaluate(f => f.querySelector('button[type="submit"]')?.click());
    
    await p.waitForTimeout(6000);
    
    // Step 1
    (await p.locator('input[type="text"]').all())[0].fill('TestName');
    await p.click('button:has-text("Woman")');
    (await p.locator('select').all())[0].selectOption('Escort');
    (await p.locator('select').all())[1].selectOption('25');
    await p.click('button:has-text("Continue")');
    
    await p.waitForTimeout(3000);
    
    // Step 2
    await p.waitForSelector('textarea', { timeout: 10000 });
    (await p.locator('textarea').all())[0].fill('Test bio here');
    await p.click('button:has-text("Continue")');
    
    await p.waitForTimeout(3000);
    
    // Step 3
    (await p.locator('input[type="tel"]').all())[0].fill('+4540000000');
    (await p.locator('input[type="file"]').all())[0].setInputFiles('/Users/tristan/.openclaw/media/inbound/file_4---7f7e4118-7775-4e74-af13-987f664c08ab.jpg');
    
    await p.waitForTimeout(2000);
    
    // Submit
    const buttons = await p.locator('button[type="submit"]').all();
    if (buttons.length > 0) {
      buttons[buttons.length - 1].click();
      console.log('✅ SUBMITTED');
    }
    
    await p.waitForTimeout(5000);
    console.log(p.url());
    
  } catch (e) {
    console.error(e.message);
  }
  
  await b.close();
})();
