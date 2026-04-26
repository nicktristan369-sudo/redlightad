import { chromium } from 'playwright';

const EMAIL = `testlive_${Date.now()}@protonmail.com`;
const PWD = 'TestPass123!';
const NAME = 'JessicaTest' + Math.floor(Math.random() * 10000);

console.log(`\n✨ CREATING PROFILE ✨\n${NAME}\n${EMAIL}\n`);

(async () => {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage();
  
  try {
    await p.addInitScript(() => localStorage.setItem('age_verified', 'true'));
    
    // Signup
    await p.goto('https://redlightad.com/register/customer');
    await p.click('button:has-text("email")');
    await p.waitForTimeout(1000);
    
    await p.fill('input[type="email"]', EMAIL);
    (await p.locator('input[type="password"]').all()).forEach(async (el, i) => {
      await el.fill(PWD);
    });
    
    (await p.locator('form').first()).evaluate(f => f.querySelector('button[type="submit"]')?.click());
    
    for (let i = 0; i < 30; i++) {
      if (p.url().includes('/register/provider')) break;
      await p.waitForTimeout(200);
    }
    console.log('✅ Step 0: Signup done');
    
    // Step 1
    (await p.locator('input[type="text"]').all())[0].fill(NAME);
    await p.click('button:has-text("Woman")').catch(() => {});
    (await p.locator('select').all())[0].selectOption('Escort').catch(() => {});
    (await p.locator('select').all())[1].selectOption('24').catch(() => {});
    await p.click('button:has-text("Continue")');
    await p.waitForTimeout(2000);
    console.log('✅ Step 1: Basic info done');
    
    // Step 2 - NOW TEXTAREA SHOULD BE VISIBLE
    await p.waitForSelector('textarea', { timeout: 5000 });
    (await p.locator('textarea').all())[0].fill('Sexy, fun, and adventurous. Professional service provider with years of experience. Discreet and reliable. Available incall and outcall.');
    await p.click('button:has-text("Continue")');
    await p.waitForTimeout(2000);
    console.log('✅ Step 2: Details done');
    
    // Step 3
    (await p.locator('input[type="tel"]').all())[0].fill('+4540123789');
    (await p.locator('input[type="file"]').all())[0].setInputFiles('/Users/tristan/.openclaw/media/inbound/file_4---7f7e4118-7775-4e74-af13-987f664c08ab.jpg');
    console.log('✅ Step 3: Photo uploaded');
    
    // Submit
    await p.waitForTimeout(2000);
    const btns = await p.locator('button[type="submit"]').all();
    if (btns.length > 0) {
      await btns[btns.length - 1].click();
      console.log('✅ Step 3: Submitted');
    }
    
    // Wait for redirect
    for (let i = 0; i < 30; i++) {
      const url = p.url();
      if (url.includes('/choose-plan') || url.includes('/dashboard')) {
        console.log('\n🎉🎉🎉 SUCCESS 🎉🎉🎉\n');
        console.log(`👤 ${NAME}`);
        console.log(`📧 ${EMAIL}`);
        console.log(`🔐 ${PWD}`);
        console.log('\n🔗 https://redlightad.com\n');
        await b.close();
        process.exit(0);
      }
      await p.waitForTimeout(500);
    }
    
    console.log('⚠️ Timeout waiting for redirect');
    console.log('URL:', p.url());
    
  } catch (e) {
    console.error('❌', e.message);
  } finally {
    await b.close();
  }
})();
