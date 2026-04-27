/**
 * GeoNames Import Script
 * 
 * Imports cities15000.txt into Supabase for the location system
 * Run with: npx tsx scripts/import-geonames.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kkkqvhfgjofppimwxtub.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY environment variable required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Country population thresholds for major cities
const COUNTRY_THRESHOLDS: Record<string, { maxCities: number; minPop: number }> = {
  // Tiny countries (< 1M population) - top 5-10 cities
  AD: { maxCities: 5, minPop: 5000 },
  LI: { maxCities: 5, minPop: 5000 },
  MC: { maxCities: 3, minPop: 5000 },
  SM: { maxCities: 3, minPop: 5000 },
  VA: { maxCities: 1, minPop: 0 },
  MT: { maxCities: 10, minPop: 10000 },
  LU: { maxCities: 10, minPop: 10000 },
  IS: { maxCities: 10, minPop: 10000 },
  
  // Small countries (1-5M) - top 15 cities
  DK: { maxCities: 15, minPop: 30000 },
  NO: { maxCities: 15, minPop: 25000 },
  FI: { maxCities: 15, minPop: 30000 },
  IE: { maxCities: 15, minPop: 25000 },
  NZ: { maxCities: 15, minPop: 30000 },
  HR: { maxCities: 15, minPop: 25000 },
  SI: { maxCities: 10, minPop: 20000 },
  SK: { maxCities: 15, minPop: 30000 },
  LT: { maxCities: 15, minPop: 25000 },
  LV: { maxCities: 15, minPop: 25000 },
  EE: { maxCities: 10, minPop: 20000 },
  
  // Medium-small countries (5-15M) - top 25-30 cities
  NL: { maxCities: 30, minPop: 50000 },
  BE: { maxCities: 25, minPop: 40000 },
  PT: { maxCities: 25, minPop: 40000 },
  GR: { maxCities: 25, minPop: 40000 },
  CZ: { maxCities: 25, minPop: 40000 },
  HU: { maxCities: 25, minPop: 40000 },
  SE: { maxCities: 25, minPop: 40000 },
  AT: { maxCities: 20, minPop: 40000 },
  CH: { maxCities: 25, minPop: 30000 },
  BG: { maxCities: 20, minPop: 40000 },
  RS: { maxCities: 20, minPop: 40000 },
  
  // Medium countries (15-50M) - top 40-60 cities
  ES: { maxCities: 60, minPop: 60000 },
  PL: { maxCities: 50, minPop: 60000 },
  RO: { maxCities: 40, minPop: 50000 },
  UA: { maxCities: 50, minPop: 60000 },
  CA: { maxCities: 50, minPop: 70000 },
  AU: { maxCities: 40, minPop: 60000 },
  
  // Large countries (50-100M) - top 80-100 cities
  GB: { maxCities: 80, minPop: 80000 },
  FR: { maxCities: 80, minPop: 80000 },
  IT: { maxCities: 80, minPop: 70000 },
  DE: { maxCities: 100, minPop: 80000 },
  TR: { maxCities: 80, minPop: 100000 },
  TH: { maxCities: 60, minPop: 80000 },
  
  // Very large countries (100M+) - top 150-200 cities
  US: { maxCities: 200, minPop: 100000 },
  RU: { maxCities: 150, minPop: 100000 },
  JP: { maxCities: 150, minPop: 100000 },
  MX: { maxCities: 100, minPop: 100000 },
  BR: { maxCities: 150, minPop: 100000 },
  
  // Mega countries - top 200+ cities
  CN: { maxCities: 250, minPop: 200000 },
  IN: { maxCities: 250, minPop: 200000 },
  ID: { maxCities: 150, minPop: 150000 },
  PK: { maxCities: 100, minPop: 150000 },
  NG: { maxCities: 100, minPop: 150000 },
};

// Default threshold for countries not listed
const DEFAULT_THRESHOLD = { maxCities: 30, minPop: 50000 };

interface GeoCity {
  geoname_id: number;
  name: string;
  ascii_name: string;
  country_code: string;
  admin1_code: string;
  latitude: number;
  longitude: number;
  population: number;
  timezone: string;
}

interface Admin1 {
  code: string; // e.g., "ES.51"
  name: string;
  ascii_name: string;
  geoname_id: number;
}

async function loadAdmin1Codes(): Promise<Map<string, string>> {
  const admin1Map = new Map<string, string>();
  const filePath = path.join(__dirname, '../data/geonames/admin1CodesASCII.txt');
  
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
  
  for await (const line of rl) {
    const parts = line.split('\t');
    if (parts.length >= 2) {
      admin1Map.set(parts[0], parts[1]); // e.g., "ES.51" -> "Andalusia"
    }
  }
  
  console.log(`Loaded ${admin1Map.size} admin1 codes`);
  return admin1Map;
}

async function parseCities(admin1Map: Map<string, string>): Promise<GeoCity[]> {
  const cities: GeoCity[] = [];
  const filePath = path.join(__dirname, '../data/geonames/cities15000.txt');
  
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
  
  for await (const line of rl) {
    const parts = line.split('\t');
    if (parts.length < 15) continue;
    
    const city: GeoCity = {
      geoname_id: parseInt(parts[0]),
      name: parts[1],
      ascii_name: parts[2],
      country_code: parts[8],
      admin1_code: parts[10],
      latitude: parseFloat(parts[4]),
      longitude: parseFloat(parts[5]),
      population: parseInt(parts[14]) || 0,
      timezone: parts[17] || '',
    };
    
    cities.push(city);
  }
  
  console.log(`Parsed ${cities.length} cities`);
  return cities;
}

function determineMajorCities(cities: GeoCity[]): Set<number> {
  const majorCityIds = new Set<number>();
  
  // Group cities by country
  const citiesByCountry = new Map<string, GeoCity[]>();
  for (const city of cities) {
    const existing = citiesByCountry.get(city.country_code) || [];
    existing.push(city);
    citiesByCountry.set(city.country_code, existing);
  }
  
  // For each country, select top N cities by population
  for (const [countryCode, countryCities] of citiesByCountry) {
    const threshold = COUNTRY_THRESHOLDS[countryCode] || DEFAULT_THRESHOLD;
    
    // Sort by population descending
    const sorted = [...countryCities].sort((a, b) => b.population - a.population);
    
    // Take top N cities with minimum population
    let count = 0;
    for (const city of sorted) {
      if (count >= threshold.maxCities) break;
      if (city.population >= threshold.minPop) {
        majorCityIds.add(city.geoname_id);
        count++;
      }
    }
    
    // Always include at least the largest city
    if (count === 0 && sorted.length > 0) {
      majorCityIds.add(sorted[0].geoname_id);
    }
  }
  
  console.log(`Marked ${majorCityIds.size} major cities`);
  return majorCityIds;
}

async function createTable() {
  console.log('Creating geonames_cities table...');
  
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      -- Drop existing table if exists
      DROP TABLE IF EXISTS geonames_cities CASCADE;
      
      -- Create table
      CREATE TABLE geonames_cities (
        geoname_id INT PRIMARY KEY,
        name TEXT NOT NULL,
        ascii_name TEXT,
        country_code CHAR(2) NOT NULL,
        admin1_code TEXT,
        admin1_name TEXT,
        latitude DOUBLE PRECISION NOT NULL,
        longitude DOUBLE PRECISION NOT NULL,
        population INT NOT NULL DEFAULT 0,
        timezone TEXT,
        is_major_city BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      -- Create indexes
      CREATE INDEX idx_geonames_country ON geonames_cities(country_code);
      CREATE INDEX idx_geonames_ascii ON geonames_cities(ascii_name);
      CREATE INDEX idx_geonames_major ON geonames_cities(country_code, is_major_city) WHERE is_major_city = true;
      CREATE INDEX idx_geonames_search ON geonames_cities USING gin(to_tsvector('simple', ascii_name));
      CREATE INDEX idx_geonames_pop ON geonames_cities(country_code, population DESC);
    `
  });
  
  if (error) {
    console.error('Error creating table via RPC, trying direct SQL...');
    // The RPC might not exist, we'll handle this differently
    return false;
  }
  
  return true;
}

async function insertCities(cities: GeoCity[], majorCityIds: Set<number>, admin1Map: Map<string, string>) {
  console.log('Inserting cities in batches...');
  
  const BATCH_SIZE = 500;
  let inserted = 0;
  
  for (let i = 0; i < cities.length; i += BATCH_SIZE) {
    const batch = cities.slice(i, i + BATCH_SIZE);
    
    const records = batch.map(city => ({
      geoname_id: city.geoname_id,
      name: city.name,
      ascii_name: city.ascii_name,
      country_code: city.country_code,
      admin1_code: city.admin1_code,
      admin1_name: admin1Map.get(`${city.country_code}.${city.admin1_code}`) || null,
      latitude: city.latitude,
      longitude: city.longitude,
      population: city.population,
      timezone: city.timezone,
      is_major_city: majorCityIds.has(city.geoname_id),
    }));
    
    const { error } = await supabase
      .from('geonames_cities')
      .upsert(records, { onConflict: 'geoname_id' });
    
    if (error) {
      console.error(`Error inserting batch ${i / BATCH_SIZE + 1}:`, error.message);
    } else {
      inserted += batch.length;
      if (inserted % 5000 === 0 || inserted === cities.length) {
        console.log(`  Inserted ${inserted} / ${cities.length} cities`);
      }
    }
  }
  
  return inserted;
}

async function printStats() {
  const { data: total } = await supabase
    .from('geonames_cities')
    .select('*', { count: 'exact', head: true });
  
  const { data: majorCount } = await supabase
    .from('geonames_cities')
    .select('*', { count: 'exact', head: true })
    .eq('is_major_city', true);
  
  const { data: topCountries } = await supabase
    .from('geonames_cities')
    .select('country_code')
    .eq('is_major_city', true);
  
  console.log('\n=== IMPORT COMPLETE ===');
  console.log(`Total cities: ${total}`);
  console.log(`Major cities: ${majorCount}`);
  
  // Count by country
  if (topCountries) {
    const countryCount = new Map<string, number>();
    for (const row of topCountries) {
      countryCount.set(row.country_code, (countryCount.get(row.country_code) || 0) + 1);
    }
    console.log('\nMajor cities by country (sample):');
    const sorted = [...countryCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
    for (const [code, count] of sorted) {
      console.log(`  ${code}: ${count} major cities`);
    }
  }
}

async function main() {
  console.log('=== GeoNames Import Script ===\n');
  
  // 1. Load admin1 codes for region names
  const admin1Map = await loadAdmin1Codes();
  
  // 2. Parse cities file
  const cities = await parseCities(admin1Map);
  
  // 3. Determine which are major cities
  const majorCityIds = determineMajorCities(cities);
  
  // 4. Create table (this will need to be done manually via SQL editor)
  console.log('\n--- TABLE CREATION ---');
  console.log('Run this SQL in Supabase SQL Editor first:\n');
  console.log(`
DROP TABLE IF EXISTS geonames_cities CASCADE;

CREATE TABLE geonames_cities (
  geoname_id INT PRIMARY KEY,
  name TEXT NOT NULL,
  ascii_name TEXT,
  country_code CHAR(2) NOT NULL,
  admin1_code TEXT,
  admin1_name TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  population INT NOT NULL DEFAULT 0,
  timezone TEXT,
  is_major_city BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_geonames_country ON geonames_cities(country_code);
CREATE INDEX idx_geonames_ascii ON geonames_cities(ascii_name);
CREATE INDEX idx_geonames_major ON geonames_cities(country_code, is_major_city) WHERE is_major_city = true;
CREATE INDEX idx_geonames_pop ON geonames_cities(country_code, population DESC);

-- Enable RLS but allow all for now
ALTER TABLE geonames_cities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access" ON geonames_cities FOR SELECT USING (true);
  `);
  
  console.log('\nPress Enter after running the SQL to continue with import...');
  
  // For now, export to JSON for import
  console.log('\n--- GENERATING IMPORT DATA ---');
  
  const records = cities.map(city => ({
    geoname_id: city.geoname_id,
    name: city.name,
    ascii_name: city.ascii_name,
    country_code: city.country_code,
    admin1_code: city.admin1_code,
    admin1_name: admin1Map.get(`${city.country_code}.${city.admin1_code}`) || null,
    latitude: city.latitude,
    longitude: city.longitude,
    population: city.population,
    timezone: city.timezone,
    is_major_city: majorCityIds.has(city.geoname_id),
  }));
  
  // Save to JSON file for manual import if needed
  const outputPath = path.join(__dirname, '../data/geonames/cities_processed.json');
  fs.writeFileSync(outputPath, JSON.stringify(records, null, 2));
  console.log(`Saved processed data to ${outputPath}`);
  
  // 5. Insert into database
  console.log('\n--- INSERTING DATA ---');
  const inserted = await insertCities(cities, majorCityIds, admin1Map);
  
  // 6. Print stats
  if (inserted > 0) {
    await printStats();
  }
}

main().catch(console.error);
