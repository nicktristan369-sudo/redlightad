#!/usr/bin/env node
import { chromium } from 'playwright';

const EMAIL = `test_${Date.now()}@protonmail.com`;
const PASSWORD = 'SecurePass123!@';
const NAME = 'Lisa' + Math.random().toString(36).slice(7).toUpperCase();

console.log(`🚀 Creating profile: ${NAME}\n📧 ${EMAIL}\n`);

(async () => {
  const b = await chromium.launch({ headless: false });
  const p = await b.newPage();
  
  try {
    // Age gate
    await p.addInitScript(() => localStorage.setItem('age_verified', 'true'));
    
    // === SIGNUP ===
    console.log('1️⃣ Signup...');
    await p.goto('https://redlightad.com/register/customer');
    await p.click('button:has-text("email")');
    await p.waitForTimeout(500);
    
    await p.fill('input[type="email"]', EMAIL);
    const pwds = await p.locator('input[type="password"]').all();
    await pwds[0].fill(PASSWORD);
    await pwds[1].fill(PASSWORD);
    
    const form = await p.locator('form').first();
    await form.evaluate(f => f.querySelector('button[type="submit"]')?.click());
    await p.waitForTimeout(5000);
    
    if (!p.url().includes('/register/provider')) {
      console.log('❌ Signup failed');
      await b.close();
      return;
    }
    console.log('✅ Signup done\n');
    
    // === STEP 1 ===
    console.log('2️⃣ Step 1: Basic Info...');
    const inputs1 = await p.locator('input[type="text"]').all();
    if (inputs1.length > 0) await inputs1[0].fill(NAME);
    
    await p.click('button:has-text("Woman")');
    const sels = await p.locator('select').all();
    if (sels[0]) await sels[0].selectOption('Escort');
    if (sels[1]) await sels[1].selectOption('25');
    
    await p.click('button:has-text("Continue")');
    await p.waitForTimeout(2000);
    console.log('✅ Step 1 done\n');
    
    // === STEP 2 ===
    console.log('3️⃣ Step 2: Details...');
    const textareas = await p.locator('textarea').all();
    if (textareas[0]) {
      await textareas[0].fill('Professional escort. Friendly, discreet, and experienced. Available for incall and outcall.');
    }
    
    await p.click('button:has-text("Continue")');
    await p.waitForTimeout(2000);
    console.log('✅ Step 2 done\n');
    
    // === STEP 3 ===
    console.log('4️⃣ Step 3: Location & Photos...');
    
    // Country - should be pre-selected (Denmark)
    // City - skip the problematic select, fill manually if possible
    
    // Phone
    const telInputs = await p.locator('input[type="tel"]').all();
    if (telInputs[0]) await telInputs[0].fill('+4540555123');
    
    // Photo upload - skip if problematic
    const fileInputs = await p.locator('input[type="file"]').all();
    if (fileInputs[0]) {
      try {
        await fileInputs[0].setInputFiles('/Users/tristan/.openclaw/media/inbound/file_4---7f7e4118-7775-4e74-af13-987f664c08ab.jpg');
        console.log('✅ Photo uploaded');
      } catch (e) {
        console.log('⚠️ Photo upload failed (will continue)');
      }
    }
    
    // Submit
    console.log('5️⃣ Submitting...');
    const submitBtn = await p.locator('button[type="submit"]').last();
    if (submitBtn) {
      await submitBtn.click();
    } else {
      // Try alternative selectors
      const btns = await p.locator('button').all();
      for (const btn of btns) {
        const txt = await btn.textContent();
        if (txt?.includes('Create') || txt?.includes('Submit')) {
          await btn.click();
          break;
        }
      }
    }
    
    await p.waitForTimeout(5000);
    
    const finalUrl = p.url();
    console.log(`\n📍 Final URL: ${finalUrl}`);
    
    if (finalUrl.includes('/choose-plan') || finalUrl.includes('/dashboard')) {
      console.log('✅ PROFILE CREATED!\n');
      console.log(`👤 Name: ${NAME}`);
      console.log(`📧 Email: ${EMAIL}`);
      console.log(`🔐 Password: ${PASSWORD}`);
      console.log('\n🔗 Check online: https://redlightad.com');
    } else {
      const errors = await p.locator('[role="alert"]').allTextContents();
      if (errors.length > 0) {
        console.log('❌ Errors:');
        errors.forEach(e => e && console.log(`  ${e}`));
      }
    }
    
    await p.waitForTimeout(15000);
  } catch (e) {
    console.error('❌', e.message);
  } finally {
    await b.close();
  }
})();
