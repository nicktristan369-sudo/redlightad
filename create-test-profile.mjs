#!/usr/bin/env node
/**
 * Full end-to-end profile creation test
 * Creates complete profile with photo upload
 */

import { chromium } from 'playwright';
import { readFileSync } from 'fs';

const EMAIL = `testprofile_${Date.now()}@protonmail.com`;
const PASSWORD = 'SecurePass123!@';
const DISPLAY_NAME = 'TestProfile' + Math.random().toString(36).slice(7);

console.log('🚀 Starting end-to-end profile creation test');
console.log(`📧 Email: ${EMAIL}`);
console.log(`👤 Display: ${DISPLAY_NAME}\n`);

async function test() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Age gate bypass
    await page.addInitScript(() => {
      localStorage.setItem('age_verified', 'true');
    });
    
    console.log('📍 Step 1: Navigate to signup');
    await page.goto('https://redlightad.com/register/customer');
    await page.waitForTimeout(1000);
    
    // Signup
    console.log('📍 Step 2: Fill signup form');
    await page.click('button:has-text("Sign up with email")');
    await page.waitForTimeout(500);
    
    await page.fill('input[type="email"]', EMAIL);
    const pwds = await page.locator('input[type="password"]').all();
    await pwds[0].fill(PASSWORD);
    await pwds[1].fill(PASSWORD);
    
    console.log('📍 Step 3: Submit signup');
    const form = await page.locator('form').first();
    await form.evaluate(f => f.querySelector('button[type="submit"]')?.click());
    
    // Wait for redirect to profile creation
    await page.waitForTimeout(5000);
    const url1 = page.url();
    console.log(`📍 Redirected to: ${url1}`);
    
    if (!url1.includes('/register/provider')) {
      console.error('❌ Not at profile creation page!');
      await browser.close();
      return;
    }
    
    console.log('📍 Step 4: Fill profile basic info (Step 1)');
    
    // Step 1 fields
    const inputs = await page.locator('input[type="text"]').all();
    if (inputs.length > 0) {
      await inputs[0].fill(DISPLAY_NAME);
      console.log(`  ✓ Display name: ${DISPLAY_NAME}`);
    }
    
    // Gender
    await page.click('button:has-text("Woman")');
    console.log('  ✓ Gender: Woman');
    
    // Category
    const categories = await page.locator('select').all();
    if (categories.length > 0) {
      await categories[0].selectOption('Escort');
      console.log('  ✓ Category: Escort');
    }
    
    // Age
    if (categories.length > 1) {
      await categories[1].selectOption('28');
      console.log('  ✓ Age: 28');
    }
    
    // Continue button
    console.log('📍 Step 5: Click Continue (Step 1 -> 2)');
    await page.click('button:has-text("Continue")');
    await page.waitForTimeout(2000);
    
    console.log('📍 Step 6: Fill details (Step 2)');
    
    // About me
    const textareas = await page.locator('textarea').all();
    if (textareas.length > 0) {
      await textareas[0].fill('Professional test profile for QA. Experienced and friendly. Available for incall and outcall services.');
      console.log('  ✓ About: Filled');
    }
    
    // Continue
    console.log('📍 Step 7: Click Continue (Step 2 -> 3)');
    await page.click('button:has-text("Continue")');
    await page.waitForTimeout(2000);
    
    console.log('📍 Step 8: Fill location & photos (Step 3)');
    
    // Country (should default to Denmark based on previous screenshot)
    const selects = await page.locator('select').all();
    console.log(`  Found ${selects.length} select fields`);
    
    // City - try to select Copenhagen
    if (selects.length > 1) {
      await selects[1].selectOption('Copenhagen');
      console.log('  ✓ City: Copenhagen');
    }
    
    // Phone
    const phoneInputs = await page.locator('input[type="tel"]').all();
    if (phoneInputs.length > 0) {
      await phoneInputs[0].fill('+4540123456');
      console.log('  ✓ Phone: +4540123456');
    }
    
    // Profile photo upload
    console.log('📍 Step 9: Upload profile photo');
    const fileInputs = await page.locator('input[type="file"]').all();
    if (fileInputs.length > 0) {
      // Create a simple test image (1x1 pixel PNG)
      const testImagePath = '/tmp/test_profile.jpg';
      console.log(`  Uploading to: ${testImagePath}`);
      
      // Actually upload the file from user's image
      try {
        await fileInputs[0].setInputFiles('/Users/tristan/.openclaw/media/inbound/file_4---7f7e4118-7775-4e74-af13-987f664c08ab.jpg');
        console.log('  ✓ Profile photo uploaded');
      } catch (e) {
        console.log(`  ⚠️ Photo upload failed: ${e.message}`);
      }
    }
    
    // Submit
    console.log('📍 Step 10: Submit profile');
    const submitBtn = await page.locator('button:has-text("Create"), button:has-text("Submit")').first();
    if (submitBtn) {
      await submitBtn.click();
      console.log('  ✓ Submit clicked');
    } else {
      console.log('  ⚠️ No submit button found');
    }
    
    // Wait for submission
    await page.waitForTimeout(5000);
    
    const finalUrl = page.url();
    console.log(`\n✅ Final URL: ${finalUrl}`);
    
    if (finalUrl.includes('/choose-plan') || finalUrl.includes('/dashboard')) {
      console.log('✅ SUCCESS: Profile created!');
      console.log(`\n📧 Login with: ${EMAIL}`);
      console.log(`🔐 Password: ${PASSWORD}`);
      console.log(`👤 Profile name: ${DISPLAY_NAME}`);
      console.log('\n🔗 View profile at: https://redlightad.com');
    } else {
      console.log('⚠️ Unexpected redirect');
      
      // Check for errors
      const errors = await page.locator('[role="alert"]').allTextContents();
      if (errors.length > 0) {
        console.log('Errors found:');
        errors.forEach(e => console.log(`  - ${e}`));
      }
    }
    
    // Keep browser open for 30 seconds
    console.log('\n⏳ Browser open for 30 seconds...');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

test();
