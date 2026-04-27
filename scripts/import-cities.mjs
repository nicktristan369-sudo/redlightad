#!/usr/bin/env node
/**
 * Import GeoNames cities to Supabase
 * 
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/import-cities.mjs
 * 
 * Or with .env.local:
 *   node --env-file=.env.local scripts/import-cities.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kkkqvhfgjofppimwxtub.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY required');
  console.log('\nRun with:');
  console.log('  SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/import-cities.mjs');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  console.log('🌍 GeoNames Import Script\n');

  // Load data
  const dataPath = join(__dirname, '../data/geonames/cities_ready.json');
  console.log('Loading data from:', dataPath);
  
  const cities = JSON.parse(readFileSync(dataPath, 'utf8'));
  console.log(`Loaded ${cities.length} cities\n`);

  // Import in batches
  const BATCH_SIZE = 500;
  let imported = 0;
  let errors = 0;

  console.log('Importing...');
  
  for (let i = 0; i < cities.length; i += BATCH_SIZE) {
    const batch = cities.slice(i, i + BATCH_SIZE);
    
    const { error } = await supabase
      .from('geonames_cities')
      .upsert(batch, { onConflict: 'geoname_id' });

    if (error) {
      console.error(`  Batch ${Math.floor(i / BATCH_SIZE) + 1} error:`, error.message);
      errors++;
      
      // If table doesn't exist, show SQL
      if (error.message.includes('does not exist')) {
        console.error('\n❌ Table does not exist! Run this SQL first:\n');
        console.log(readFileSync(join(__dirname, '../data/geonames/create_table.sql'), 'utf8'));
        process.exit(1);
      }
    } else {
      imported += batch.length;
    }

    // Progress
    if (imported % 5000 === 0 || i + BATCH_SIZE >= cities.length) {
      const pct = Math.round((imported / cities.length) * 100);
      process.stdout.write(`\r  Progress: ${imported.toLocaleString()} / ${cities.length.toLocaleString()} (${pct}%)`);
    }
  }

  console.log('\n');

  // Stats
  const { count: totalCount } = await supabase
    .from('geonames_cities')
    .select('*', { count: 'exact', head: true });

  const { count: majorCount } = await supabase
    .from('geonames_cities')
    .select('*', { count: 'exact', head: true })
    .eq('is_major_city', true);

  console.log('✅ Import complete!\n');
  console.log('Stats:');
  console.log(`  Total cities:  ${totalCount?.toLocaleString()}`);
  console.log(`  Major cities:  ${majorCount?.toLocaleString()}`);
  console.log(`  Errors:        ${errors}`);

  // Sample data
  console.log('\nSample major cities:');
  const { data: sample } = await supabase
    .from('geonames_cities')
    .select('name, country_code, admin1_name, population')
    .eq('is_major_city', true)
    .order('population', { ascending: false })
    .limit(10);

  if (sample) {
    for (const city of sample) {
      console.log(`  ${city.name}, ${city.country_code} (${city.admin1_name}) - pop: ${city.population.toLocaleString()}`);
    }
  }
}

main().catch(console.error);
