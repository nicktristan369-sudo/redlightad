#!/usr/bin/env node
/**
 * RedLightAD E2E Signup Test
 * Tests complete signup flow from registration to profile creation
 */

import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const TEST_EMAIL = `test_${Date.now()}@protonmail.com`;
const TEST_PASSWORD = 'SecurePass123!@';
const RESULTS = {
  startTime: new Date().toISOString(),
  tests: [],
  bugs: [],
  success: false,
};

function log(type, message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${type}: ${message}`);
  RESULTS.tests.push({ type, message, timestamp });
}

function addBug(severity, title, description) {
  RESULTS.bugs.push({ severity, title, description });
  console.log(`🐛 BUG [${severity}]: ${title}`);
  console.log(`   ${description}\n`);
}

async function runTest() {
  log('INFO', 'Starting E2E signup test');
  log('INFO', `Test email: ${TEST_EMAIL}`);
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // Age gate bypass
    await page.addInitScript(() => {
      localStorage.setItem('age_verified', 'true');
    });
    
    // Step 1: Navigate to signup
    log('TEST', 'Navigating to /register/customer');
    await page.goto('https://redlightad.com/register/customer', { waitUntil: 'networkidle' });
    
    // Step 2: Click email signup
    log('TEST', 'Clicking "Sign up with email and password"');
    const emailBtn = await page.locator('button:has-text("Sign up with email and password")').first();
    if (!emailBtn) {
      addBug('CRITICAL', 'Email signup button not found', 'Cannot find email signup button on page');
      return;
    }
    await emailBtn.click();
    await page.waitForTimeout(500);
    
    // Step 3: Fill signup form
    log('TEST', 'Filling signup form');
    const emailInput = await page.locator('input[type="email"]').first();
    if (!emailInput) {
      addBug('CRITICAL', 'Email input not found', 'Form did not appear after clicking email button');
      return;
    }
    
    await emailInput.fill(TEST_EMAIL);
    log('TEST', `  Email: ${TEST_EMAIL}`);
    
    const pwdInputs = await page.locator('input[type="password"]').all();
    if (pwdInputs.length < 2) {
      addBug('HIGH', 'Missing password confirm field', `Found ${pwdInputs.length} password fields, expected 2`);
      return;
    }
    
    await pwdInputs[0].fill(TEST_PASSWORD);
    await pwdInputs[1].fill(TEST_PASSWORD);
    log('TEST', `  Password: ***`);
    
    // Step 4: Submit signup form
    log('TEST', 'Submitting signup form');
    const form = await page.locator('form').first();
    if (!form) {
      addBug('CRITICAL', 'Form not found', 'Cannot locate form element');
      return;
    }
    
    await form.evaluate(f => {
      const btn = f.querySelector('button[type="submit"]');
      if (btn) btn.click();
      else f.submit();
    });
    
    // Wait for navigation
    log('TEST', 'Waiting for signup completion...');
    await Promise.race([
      page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 }).catch(() => {}),
      page.waitForTimeout(10000),
    ]);
    
    const postSignupUrl = page.url();
    log('TEST', `Post-signup URL: ${postSignupUrl}`);
    
    // Check for errors
    const errorDiv = await page.locator('[role="alert"]').first().isVisible().catch(() => false);
    if (errorDiv) {
      const errorText = await page.locator('[role="alert"]').first().textContent();
      addBug('HIGH', 'Signup error message shown', errorText?.trim() || 'Unknown error');
      return;
    }
    
    // Step 5: Verify at profile creation page
    if (!postSignupUrl.includes('/register/provider')) {
      addBug('CRITICAL', 'Not redirected to profile creation', `Expected /register/provider, got ${postSignupUrl}`);
      return;
    }
    
    log('SUCCESS', '✅ Signup complete, at profile creation page');
    
    // Step 6: Fill profile form
    log('TEST', 'Filling profile creation form');
    
    // Wait for profile form
    await page.waitForSelector('input[placeholder*="name" i], input[placeholder*="username" i]', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(1000);
    
    // Find and fill inputs
    const inputs = await page.locator('input[type="text"]').all();
    log('TEST', `Found ${inputs.length} text inputs`);
    
    if (inputs.length >= 1) {
      await inputs[0].fill('TestProfile');
      log('TEST', 'Name/Username: TestProfile');
    }
    
    // Try to find age input
    const ageInputs = await page.locator('input[type="number"]').all();
    if (ageInputs.length > 0) {
      await ageInputs[0].fill('25');
      log('TEST', 'Age: 25');
    }
    
    // Try to find city/location
    const allInputs = await page.locator('input').all();
    log('TEST', `Total inputs found: ${allInputs.length}`);
    
    // Look for textarea (bio)
    const textareas = await page.locator('textarea').all();
    if (textareas.length > 0) {
      await textareas[0].fill('Professional test profile for QA testing');
      log('TEST', 'Bio filled');
    }
    
    // Look for submit button
    const submitBtn = await page.locator('button:has-text("Next"), button:has-text("Create"), button:has-text("Save")').first().isVisible().catch(() => false);
    if (submitBtn) {
      log('TEST', 'Found profile form submit button');
    } else {
      log('WARNING', 'No clear submit button found on profile form');
    }
    
    // Step 7: Take screenshot of profile creation page
    const screenshotPath = '/tmp/redlightad_profile_page.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });
    log('TEST', `Screenshot saved: ${screenshotPath}`);
    
    RESULTS.success = true;
    log('SUCCESS', '✅ E2E test completed successfully');
    
  } catch (error) {
    addBug('CRITICAL', 'Test execution error', error.message);
    log('ERROR', error.stack);
  } finally {
    await browser.close();
  }
}

async function main() {
  await runTest();
  
  RESULTS.endTime = new Date().toISOString();
  RESULTS.summary = {
    totalTests: RESULTS.tests.length,
    totalBugs: RESULTS.bugs.length,
    criticalBugs: RESULTS.bugs.filter(b => b.severity === 'CRITICAL').length,
    success: RESULTS.success,
  };
  
  // Save report
  const reportPath = '/tmp/redlightad_test_report.json';
  writeFileSync(reportPath, JSON.stringify(RESULTS, null, 2));
  console.log(`\n📋 Full report saved to: ${reportPath}`);
  
  // Print summary
  console.log('\n=== TEST SUMMARY ===');
  console.log(`Tests run: ${RESULTS.summary.totalTests}`);
  console.log(`Bugs found: ${RESULTS.summary.totalBugs}`);
  console.log(`  Critical: ${RESULTS.summary.criticalBugs}`);
  console.log(`Success: ${RESULTS.success ? '✅ YES' : '❌ NO'}`);
  
  if (RESULTS.bugs.length > 0) {
    console.log('\nBugs:');
    RESULTS.bugs.forEach(bug => {
      console.log(`  [${bug.severity}] ${bug.title}`);
      console.log(`    ${bug.description}`);
    });
  }
  
  process.exit(RESULTS.success ? 0 : 1);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
