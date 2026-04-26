import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kkkqvhfgjofppimwxtub.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  console.log('❌ SUPABASE_SERVICE_ROLE_KEY not set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const EMAIL = `admin_${Date.now()}@test.com`;
const PWD = 'AdminTest123!';
const NAME = 'LisaAdmin' + Math.random().toString(36).slice(7).toUpperCase();

console.log(`\n🔧 Creating via Supabase Admin API\n`);

(async () => {
  try {
    // 1. Create auth user
    console.log('1️⃣ Creating auth user...');
    const { data: { user }, error: authErr } = await supabase.auth.admin.createUser({
      email: EMAIL,
      password: PWD,
      email_confirm: true,
    });
    
    if (authErr) {
      console.log('❌ Auth error:', authErr.message);
      return;
    }
    
    console.log(`✅ User created: ${user.id}\n`);
    
    // 2. Create listing
    console.log('2️⃣ Creating listing...');
    const { error: listErr } = await supabase
      .from('listings')
      .insert({
        user_id: user.id,
        title: NAME,
        display_name: NAME,
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
        languages: ['English', 'Danish', 'German'],
        about: 'Professional and discreet escort with 5+ years of experience. Passionate, friendly, and accommodating. Available for incall and outcall services.',
        country: 'Denmark',
        city: 'Copenhagen',
        location: 'Copenhagen, Denmark',
        available_for: 'Both',
        phone: '+4540555888',
        whatsapp: '+4540555888',
        status: 'active',
        premium_tier: null,
      });
    
    if (listErr) {
      console.log('❌ Listing error:', listErr.message);
      return;
    }
    
    console.log('✅ Listing created\n');
    
    console.log(`\n🎉🎉🎉 SUCCESS!\n`);
    console.log(`👤 ${NAME}`);
    console.log(`📧 ${EMAIL}`);
    console.log(`🔐 ${PWD}`);
    console.log(`\n🔗 https://redlightad.com\n`);
    
  } catch (e) {
    console.error('Error:', e.message);
  }
})();
