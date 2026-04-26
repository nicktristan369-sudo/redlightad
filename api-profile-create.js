import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';

const EMAIL = `apicreate_${Date.now()}@test.com`;
const PWD = 'Test123456!';

console.log(`Creating profile for: ${EMAIL}\n`);

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  
  try {
    // === SIGNUP ONLY ===
    await p.addInitScript(() => localStorage.setItem('age_verified', 'true'));
    
    console.log('1️⃣ Signup...');
    await p.goto('https://redlightad.com/register/customer');
    await p.click('button:has-text("email")');
    await p.waitForTimeout(1000);
    
    await p.fill('input[type="email"]', EMAIL);
    (await p.locator('input[type="password"]').all())[0].fill(PWD);
    (await p.locator('input[type="password"]').all())[1].fill(PWD);
    
    (await p.locator('form').first()).evaluate(f => f.querySelector('button[type="submit"]')?.click());
    
    await p.waitForTimeout(6000);
    
    if (!p.url().includes('/register/provider')) {
      console.log('❌ Signup failed');
      await b.close();
      return;
    }
    
    console.log('✅ Signup complete\n');
    
    // Get auth user
    const cookies = await p.context().cookies();
    console.log(`2️⃣ Getting user ID from browser...`);
    
    // Get user from local storage
    const userId = await p.evaluate(() => {
      const auth = JSON.parse(localStorage.getItem('supabase.auth.v1') || '{}');
      return auth.user?.id;
    });
    
    console.log(`✅ User ID: ${userId}\n`);
    
    if (!userId) {
      console.log('❌ Could not get user ID');
      await b.close();
      return;
    }
    
    // === CREATE LISTING VIA API ===
    console.log('3️⃣ Creating profile via API...');
    
    const listingData = {
      userId,
      title: 'LisaOnline',
      display_name: 'LisaOnline',
      gender: 'Woman',
      category: 'Escort',
      age: 26,
      nationality: 'Danish',
      ethnicity: 'Caucasian',
      height_cm: 170,
      weight_kg: 60,
      hair_color: 'Blonde',
      eye_color: 'Blue',
      body_build: 'Slim',
      services: ['kissing', 'foreplay', 'gfe'],
      languages: ['English', 'Danish'],
      about: 'Professional escort with years of experience. Discreet, friendly, and passionate. Available for incall and outcall services.',
      country: 'Denmark',
      city: 'Copenhagen',
      location: 'Copenhagen, Denmark',
      phone: '+4540555333',
      profile_image: 'https://via.placeholder.com/500',
      images: [],
    };
    
    const res = await fetch('https://redlightad.com/api/listings/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(listingData),
    });
    
    const result = await res.json();
    
    if (res.ok) {
      console.log('✅ Profile created!\n');
      console.log(`\n🎉 SUCCESS!\n\n👤 LisaOnline\n📧 ${EMAIL}\n🔐 ${PWD}\n\n🔗 https://redlightad.com\n`);
    } else {
      console.log('❌ API error:', result.error);
    }
    
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await b.close();
  }
})();
