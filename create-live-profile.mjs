/**
 * Direct Supabase admin API call to create test profile
 * Bypasses all browser/WAF issues
 */

const SUPABASE_URL = 'https://kkkqvhfgjofppimwxtub.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not set');
  process.exit(1);
}

async function createProfile() {
  const timestamp = Date.now();
  const email = `liveprofile_${timestamp}@protonmail.com`;
  const password = 'LiveTest123!@';
  const name = 'VenusLive' + Math.floor(Math.random() * 10000);

  try {
    // 1. Create auth user via admin API
    console.log('Creating auth user...');
    const authRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { account_type: 'provider' },
      }),
    });

    const authData = await authRes.json();
    if (!authRes.ok || !authData.user) {
      console.error('Auth error:', authData);
      process.exit(1);
    }

    const userId = authData.user.id;
    console.log(`✅ Auth user created: ${userId}`);

    // 2. Create listing via listings insert
    console.log('Creating listing...');
    const listRes = await fetch(`${SUPABASE_URL}/rest/v1/listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        user_id: userId,
        title: name,
        display_name: name,
        gender: 'Woman',
        category: 'Escort',
        age: 26,
        nationality: 'Danish',
        ethnicity: 'Caucasian',
        height_cm: 170,
        weight_kg: 60,
        hair_color: 'Blonde',
        hair_length: 'Long',
        eye_color: 'Blue',
        body_build: 'Slim',
        bust_size: 'C',
        bust_type: 'Natural',
        tattoos: 'Some',
        piercings: 'Some',
        smoker: 'No',
        services: ['kissing', 'foreplay', 'gfe', 'bdsm'],
        languages: ['English', 'Danish'],
        about: 'Professional and discreet escort with years of experience. Passionate, friendly, and accommodating. Available for both incall and outcall services.',
        country: 'Denmark',
        city: 'Copenhagen',
        location: 'Copenhagen, Denmark',
        available_for: 'Both',
        phone: '+4540555123',
        whatsapp: '+4540555123',
        profile_image: 'https://via.placeholder.com/500x600?text=' + name,
        images: [],
        status: 'active',
        premium_tier: null,
      }),
    });

    if (!listRes.ok) {
      const err = await listRes.text();
      console.error('Listing error:', err);
      process.exit(1);
    }

    console.log('✅ Listing created');

    console.log(`\n🎉 PROFILE LIVE!\n`);
    console.log(`👤 ${name}`);
    console.log(`📧 ${email}`);
    console.log(`🔐 ${password}`);
    console.log(`\n🔗 https://redlightad.com\n`);

  } catch (error) {
    console.error('Fatal:', error.message);
    process.exit(1);
  }
}

createProfile();
