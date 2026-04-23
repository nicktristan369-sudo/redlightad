/**
 * GeoNames Import Script for RedLightAD
 * 
 * Downloads and imports city data from GeoNames into Supabase.
 * Supports both full import and country-specific imports.
 * 
 * Usage:
 *   npx ts-node scripts/import-geonames.ts --countries DK,DE,NL,GB,US
 *   npx ts-node scripts/import-geonames.ts --all
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { execSync } from 'child_process';

// ============================================================================
// Configuration
// ============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const GEONAMES_BASE_URL = 'https://download.geonames.org/export/dump';
const DATA_DIR = path.join(process.cwd(), 'data', 'geonames');

// Feature codes for populated places
const VALID_FEATURE_CODES = [
  'PPLC',   // Capital
  'PPLA',   // Capital of admin1 (regional capital)
  'PPLA2',  // Capital of admin2 (county seat)
  'PPLA3',  // Capital of admin3
  'PPLA4',  // Capital of admin4
  'PPL',    // Populated place
  'PPLX',   // Section of populated place (neighborhood)
  'PPLS',   // Populated places
  'PPLG',   // Seat of government
  'PPLF',   // Farm village
  'PPLL',   // Populated locality
  'PPLQ',   // Abandoned populated place (for historical data)
  'PPLR',   // Religious populated place
  'PPLU',   // Unsurveyed area
  'PPLW',   // Destroyed populated place
];

// Minimum population to include (0 = all)
const MIN_POPULATION = 0;

// ============================================================================
// Supabase Client
// ============================================================================

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ============================================================================
// Download Functions
// ============================================================================

async function ensureDataDir(): Promise<void> {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

async function downloadFile(url: string, filename: string): Promise<string> {
  const filepath = path.join(DATA_DIR, filename);
  
  if (fs.existsSync(filepath)) {
    console.log(`  ✓ ${filename} already exists, skipping download`);
    return filepath;
  }
  
  console.log(`  ↓ Downloading ${filename}...`);
  execSync(`wget -q -O "${filepath}" "${url}"`, { stdio: 'inherit' });
  
  // Unzip if it's a zip file
  if (filename.endsWith('.zip')) {
    const unzippedPath = filepath.replace('.zip', '.txt');
    console.log(`  ↓ Extracting ${filename}...`);
    execSync(`unzip -o -q "${filepath}" -d "${DATA_DIR}"`, { stdio: 'inherit' });
    return unzippedPath;
  }
  
  return filepath;
}

async function downloadGeoNamesData(countries: string[]): Promise<void> {
  await ensureDataDir();
  
  console.log('\n📥 Downloading GeoNames data...\n');
  
  // Download admin codes
  await downloadFile(`${GEONAMES_BASE_URL}/admin1CodesASCII.txt`, 'admin1CodesASCII.txt');
  await downloadFile(`${GEONAMES_BASE_URL}/admin2Codes.txt`, 'admin2Codes.txt');
  
  // Download country-specific files
  for (const country of countries) {
    await downloadFile(`${GEONAMES_BASE_URL}/${country}.zip`, `${country}.zip`);
  }
  
  // Download alternate names for better search
  await downloadFile(`${GEONAMES_BASE_URL}/alternateNamesV2.zip`, 'alternateNamesV2.zip');
  
  console.log('\n✓ All downloads complete!\n');
}

// ============================================================================
// Import Functions
// ============================================================================

interface GeoNameRecord {
  geoname_id: number;
  name: string;
  ascii_name: string;
  alternate_names: string;
  latitude: number;
  longitude: number;
  feature_class: string;
  feature_code: string;
  country_code: string;
  admin1_code: string;
  admin2_code: string;
  admin3_code: string;
  admin4_code: string;
  population: number;
  elevation: number | null;
  timezone: string;
}

interface Admin1Record {
  code: string;
  name: string;
  ascii_name: string;
  geoname_id: number;
}

async function importAdmin1Codes(): Promise<Map<string, Admin1Record>> {
  console.log('📍 Importing admin1 codes (regions/states)...');
  
  const filepath = path.join(DATA_DIR, 'admin1CodesASCII.txt');
  const admin1Map = new Map<string, Admin1Record>();
  
  if (!fs.existsSync(filepath)) {
    console.log('  ⚠ admin1CodesASCII.txt not found, skipping');
    return admin1Map;
  }
  
  const fileStream = fs.createReadStream(filepath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
  
  const regions: any[] = [];
  
  for await (const line of rl) {
    const parts = line.split('\t');
    if (parts.length < 4) continue;
    
    const [code, name, ascii_name, geoname_id] = parts;
    const [country_code, admin1_code] = code.split('.');
    
    admin1Map.set(code, {
      code,
      name,
      ascii_name,
      geoname_id: parseInt(geoname_id),
    });
    
    // Get country_id
    const { data: country } = await supabase
      .from('geo_countries')
      .select('id')
      .eq('iso_code', country_code)
      .single();
    
    if (country) {
      regions.push({
        geoname_id: parseInt(geoname_id),
        country_id: country.id,
        name,
        ascii_name,
        admin1_code,
      });
    }
  }
  
  // Batch insert regions
  if (regions.length > 0) {
    const { error } = await supabase
      .from('geo_regions')
      .upsert(regions, { onConflict: 'geoname_id' });
    
    if (error) {
      console.error('  ✗ Error inserting regions:', error.message);
    } else {
      console.log(`  ✓ Imported ${regions.length} regions`);
    }
  }
  
  return admin1Map;
}

async function importCitiesForCountry(
  countryCode: string,
  admin1Map: Map<string, Admin1Record>
): Promise<number> {
  const filepath = path.join(DATA_DIR, `${countryCode}.txt`);
  
  if (!fs.existsSync(filepath)) {
    console.log(`  ⚠ ${countryCode}.txt not found, skipping`);
    return 0;
  }
  
  console.log(`\n📍 Importing cities for ${countryCode}...`);
  
  // Get country_id
  const { data: country } = await supabase
    .from('geo_countries')
    .select('id')
    .eq('iso_code', countryCode)
    .single();
  
  if (!country) {
    console.log(`  ⚠ Country ${countryCode} not found in database`);
    return 0;
  }
  
  // Get regions for this country
  const { data: regions } = await supabase
    .from('geo_regions')
    .select('id, admin1_code')
    .eq('country_id', country.id);
  
  const regionMap = new Map(regions?.map(r => [r.admin1_code, r.id]) || []);
  
  const fileStream = fs.createReadStream(filepath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
  
  let batch: any[] = [];
  let totalImported = 0;
  const BATCH_SIZE = 500;
  
  for await (const line of rl) {
    const parts = line.split('\t');
    if (parts.length < 19) continue;
    
    const record: GeoNameRecord = {
      geoname_id: parseInt(parts[0]),
      name: parts[1],
      ascii_name: parts[2],
      alternate_names: parts[3],
      latitude: parseFloat(parts[4]),
      longitude: parseFloat(parts[5]),
      feature_class: parts[6],
      feature_code: parts[7],
      country_code: parts[8],
      admin1_code: parts[10],
      admin2_code: parts[11],
      admin3_code: parts[12],
      admin4_code: parts[13],
      population: parseInt(parts[14]) || 0,
      elevation: parts[15] ? parseInt(parts[15]) : null,
      timezone: parts[17],
    };
    
    // Only import populated places
    if (record.feature_class !== 'P') continue;
    if (!VALID_FEATURE_CODES.includes(record.feature_code)) continue;
    if (record.population < MIN_POPULATION) continue;
    
    // Skip if coordinates are invalid
    if (isNaN(record.latitude) || isNaN(record.longitude)) continue;
    
    const region_id = regionMap.get(record.admin1_code) || null;
    
    const city = {
      geoname_id: record.geoname_id,
      country_id: country.id,
      region_id,
      name: record.name,
      ascii_name: record.ascii_name,
      latitude: record.latitude,
      longitude: record.longitude,
      population: record.population,
      elevation: record.elevation,
      feature_code: record.feature_code,
      timezone: record.timezone,
      admin1_code: record.admin1_code,
      admin2_code: record.admin2_code,
      admin3_code: record.admin3_code,
      admin4_code: record.admin4_code,
      is_capital: record.feature_code === 'PPLC',
      is_regional_capital: ['PPLA', 'PPLA2'].includes(record.feature_code),
      is_major_city: record.population >= 100000,
      search_rank: calculateSearchRank(record),
    };
    
    batch.push(city);
    
    if (batch.length >= BATCH_SIZE) {
      await insertCityBatch(batch);
      totalImported += batch.length;
      process.stdout.write(`\r  → Imported ${totalImported} cities...`);
      batch = [];
    }
  }
  
  // Insert remaining batch
  if (batch.length > 0) {
    await insertCityBatch(batch);
    totalImported += batch.length;
  }
  
  console.log(`\n  ✓ Imported ${totalImported} cities for ${countryCode}`);
  return totalImported;
}

function calculateSearchRank(record: GeoNameRecord): number {
  let rank = 0;
  
  // Capital cities get highest rank
  if (record.feature_code === 'PPLC') rank += 100;
  if (record.feature_code === 'PPLA') rank += 80;
  if (record.feature_code === 'PPLA2') rank += 60;
  
  // Population bonus (log scale)
  if (record.population > 0) {
    rank += Math.min(Math.floor(Math.log10(record.population) * 10), 50);
  }
  
  return rank;
}

async function insertCityBatch(batch: any[]): Promise<void> {
  // First, insert without geom
  const citiesWithoutGeom = batch.map(city => {
    const { geom, ...rest } = city;
    return rest;
  });
  
  const { error } = await supabase
    .from('geo_cities')
    .upsert(citiesWithoutGeom, { onConflict: 'geoname_id' });
  
  if (error) {
    console.error('\n  ✗ Error inserting batch:', error.message);
  }
}

async function updateCityGeometries(countryCode: string): Promise<void> {
  console.log(`\n📐 Updating geometries for ${countryCode}...`);
  
  // Use raw SQL to update geometries
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      UPDATE geo_cities 
      SET geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
      WHERE geom IS NULL 
        AND latitude IS NOT NULL 
        AND longitude IS NOT NULL
        AND country_id = (SELECT id FROM geo_countries WHERE iso_code = '${countryCode}')
    `
  });
  
  if (error) {
    // Fallback: geometries will be null, but basic functionality works
    console.log('  ⚠ Geometry update requires PostGIS, will be done via SQL');
  } else {
    console.log('  ✓ Geometries updated');
  }
}

// ============================================================================
// Main Import Function
// ============================================================================

async function importGeoNames(countries: string[]): Promise<void> {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  REDLIGHTAD GEONAMES IMPORT');
  console.log('  Importing location data for: ' + countries.join(', '));
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const startTime = Date.now();
  
  // Step 1: Download data
  await downloadGeoNamesData(countries);
  
  // Step 2: Import admin1 codes
  const admin1Map = await importAdmin1Codes();
  
  // Step 3: Import cities for each country
  let totalCities = 0;
  for (const country of countries) {
    const count = await importCitiesForCountry(country, admin1Map);
    totalCities += count;
    await updateCityGeometries(country);
  }
  
  const duration = Math.round((Date.now() - startTime) / 1000);
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`  ✓ IMPORT COMPLETE`);
  console.log(`  → Total cities imported: ${totalCities.toLocaleString()}`);
  console.log(`  → Duration: ${duration} seconds`);
  console.log('═══════════════════════════════════════════════════════════════\n');
}

// ============================================================================
// CLI Entry Point
// ============================================================================

const args = process.argv.slice(2);

if (args.includes('--help')) {
  console.log(`
GeoNames Import Script

Usage:
  npx ts-node scripts/import-geonames.ts --countries DK,DE,NL,GB
  npx ts-node scripts/import-geonames.ts --priority
  npx ts-node scripts/import-geonames.ts --all

Options:
  --countries XX,YY  Import specific countries (ISO codes)
  --priority         Import priority countries (DK,DE,NL,GB,US,FR,ES,IT)
  --all              Import all countries (very slow!)
  --help             Show this help
  `);
  process.exit(0);
}

let countries: string[] = [];

if (args.includes('--all')) {
  countries = [
    'DK', 'DE', 'NL', 'GB', 'US', 'FR', 'ES', 'IT', 'SE', 'NO',
    'BE', 'AT', 'CH', 'PL', 'CZ', 'PT', 'TH', 'BR', 'AU', 'CA',
    'MX', 'AE', 'RU', 'JP', 'IN', 'CO', 'AR', 'FI', 'IE', 'GR',
    'TR', 'HU', 'RO', 'BG', 'HR', 'SK', 'SI', 'LT', 'LV', 'EE'
  ];
} else if (args.includes('--priority')) {
  countries = ['DK', 'DE', 'NL', 'GB', 'US', 'FR', 'ES', 'IT'];
} else {
  const countryArg = args.find(a => a.startsWith('--countries='));
  if (countryArg) {
    countries = countryArg.split('=')[1].split(',').map(c => c.trim().toUpperCase());
  } else {
    const countryIndex = args.indexOf('--countries');
    if (countryIndex !== -1 && args[countryIndex + 1]) {
      countries = args[countryIndex + 1].split(',').map(c => c.trim().toUpperCase());
    }
  }
}

if (countries.length === 0) {
  console.log('No countries specified. Use --help for usage.');
  process.exit(1);
}

importGeoNames(countries).catch(console.error);
