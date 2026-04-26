#!/usr/bin/env node

/**
 * Restore profiles data to Supabase
 * Usage: node scripts/restore-profiles.js
 * 
 * This script populates the public.profiles table with test data
 * so the admin panel can display profiles correctly.
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function restoreProfiles() {
  console.log('🔄 Checking profiles table...\n');

  // Check current count
  const { count: profileCount, error: countError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('❌ Error querying profiles:', countError.message);
    process.exit(1);
  }

  console.log(`📊 Current profiles: ${profileCount}`);

  if (profileCount > 0) {
    console.log('✅ Profiles already exist. Skipping restore.');
    process.exit(0);
  }

  // Check if listings exist
  const { count: listingCount } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true });

  console.log(`📊 Current listings: ${listingCount}\n`);

  // If listings exist, create profiles from them
  if (listingCount > 0) {
    console.log('📥 Creating profiles from existing listings...');
    
    const { data: listings, error: listingsError } = await supabase
      .from('listings')
      .select('user_id, display_name, created_at')
      .limit(100);

    if (listingsError) {
      console.error('❌ Error fetching listings:', listingsError);
      process.exit(1);
    }

    // Get unique user IDs
    const userIds = [...new Set(listings.map(l => l.user_id))];

    // Create profiles for these users
    const profiles = [];
    for (const userId of userIds) {
      const listing = listings.find(l => l.user_id === userId);
      profiles.push({
        id: userId,
        email: `user_${userId.substring(0, 8)}@redlightad.local`,
        full_name: listing?.display_name || `User ${userId.substring(0, 8)}`,
        account_type: 'provider',
        created_at: listing?.created_at || new Date().toISOString(),
        is_admin: false,
        is_banned: false,
        is_verified: false,
      });
    }

    if (profiles.length > 0) {
      const { error: insertError } = await supabase
        .from('profiles')
        .upsert(profiles, { onConflict: 'id' });

      if (insertError) {
        console.error('❌ Error inserting profiles:', insertError);
        process.exit(1);
      }

      console.log(`✅ Created ${profiles.length} profiles from listings\n`);
    }
  } else {
    // Create test profiles
    console.log('🆕 Creating test profiles...\n');

    const testProfiles = [];
    const names = [
      'Venus Deluxe', 'Sophia', 'Luna', 'Clara', 'Ruby',
      'Amber', 'Jade', 'Rose', 'Bella', 'Natasha'
    ];

    for (let i = 0; i < names.length; i++) {
      testProfiles.push({
        id: require('crypto').randomUUID(),
        email: `${names[i].toLowerCase().replace(' ', '.')}@redlightad.local`,
        full_name: names[i],
        account_type: i % 2 === 0 ? 'provider' : 'customer',
        country: 'Denmark',
        is_admin: i === 0, // First one is admin
        is_banned: false,
        is_verified: i % 3 === 0,
        phone: `+45${String(40000000 + i * 111111).padStart(8, '0')}`,
        subscription_tier: i % 5 === 0 ? 'vip' : i % 3 === 0 ? 'featured' : null,
        created_at: new Date(Date.now() - i * 2 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    const { error: insertError } = await supabase
      .from('profiles')
      .insert(testProfiles);

    if (insertError) {
      console.error('❌ Error inserting test profiles:', insertError);
      process.exit(1);
    }

    console.log(`✅ Created ${testProfiles.length} test profiles\n`);
  }

  // Verify
  const { count: newCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  console.log(`\n✅ Final profile count: ${newCount}`);
  console.log('✨ Admin panel profiles should now be visible!\n');
}

restoreProfiles().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
