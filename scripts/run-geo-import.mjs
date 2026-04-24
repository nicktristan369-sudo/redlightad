/**
 * Quick script to import geo data via Supabase client
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', '.env.local') });

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/\\n/g, '');
const SUPABASE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim().replace(/\\n/g, '');

console.log('URL:', SUPABASE_URL ? SUPABASE_URL.substring(0, 30) + '...' : 'MISSING');
console.log('Key:', SUPABASE_KEY ? 'Present (' + SUPABASE_KEY.length + ' chars)' : 'MISSING');

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// All new countries to add
const newCountries = [
  { iso_code: 'GL', iso3_code: 'GRL', name: 'Greenland', name_local: 'Kalaallit Nunaat', domain: '.gl', continent: 'NA', population: 56000 },
  { iso_code: 'IS', iso3_code: 'ISL', name: 'Iceland', name_local: 'Ísland', domain: '.is', continent: 'EU', population: 370000 },
  { iso_code: 'LU', iso3_code: 'LUX', name: 'Luxembourg', name_local: 'Lëtzebuerg', domain: '.lu', continent: 'EU', population: 640000 },
  { iso_code: 'MT', iso3_code: 'MLT', name: 'Malta', name_local: 'Malta', domain: '.mt', continent: 'EU', population: 520000 },
  { iso_code: 'CY', iso3_code: 'CYP', name: 'Cyprus', name_local: 'Κύπρος', domain: '.cy', continent: 'EU', population: 1200000 },
  { iso_code: 'MC', iso3_code: 'MCO', name: 'Monaco', name_local: 'Monaco', domain: '.mc', continent: 'EU', population: 39000 },
  { iso_code: 'AD', iso3_code: 'AND', name: 'Andorra', name_local: 'Andorra', domain: '.ad', continent: 'EU', population: 77000 },
  { iso_code: 'LI', iso3_code: 'LIE', name: 'Liechtenstein', name_local: 'Liechtenstein', domain: '.li', continent: 'EU', population: 39000 },
  { iso_code: 'SM', iso3_code: 'SMR', name: 'San Marino', name_local: 'San Marino', domain: '.sm', continent: 'EU', population: 34000 },
  { iso_code: 'FO', iso3_code: 'FRO', name: 'Faroe Islands', name_local: 'Føroyar', domain: '.fo', continent: 'EU', population: 53000 },
  { iso_code: 'SG', iso3_code: 'SGP', name: 'Singapore', name_local: 'Singapore', domain: '.sg', continent: 'AS', population: 5900000 },
  { iso_code: 'HK', iso3_code: 'HKG', name: 'Hong Kong', name_local: '香港', domain: '.hk', continent: 'AS', population: 7500000 },
  { iso_code: 'MY', iso3_code: 'MYS', name: 'Malaysia', name_local: 'Malaysia', domain: '.my', continent: 'AS', population: 32000000 },
  { iso_code: 'ID', iso3_code: 'IDN', name: 'Indonesia', name_local: 'Indonesia', domain: '.id', continent: 'AS', population: 273000000 },
  { iso_code: 'PH', iso3_code: 'PHL', name: 'Philippines', name_local: 'Pilipinas', domain: '.ph', continent: 'AS', population: 110000000 },
  { iso_code: 'VN', iso3_code: 'VNM', name: 'Vietnam', name_local: 'Việt Nam', domain: '.vn', continent: 'AS', population: 98000000 },
  { iso_code: 'KR', iso3_code: 'KOR', name: 'South Korea', name_local: '대한민국', domain: '.kr', continent: 'AS', population: 52000000 },
  { iso_code: 'TW', iso3_code: 'TWN', name: 'Taiwan', name_local: '台灣', domain: '.tw', continent: 'AS', population: 24000000 },
  { iso_code: 'NZ', iso3_code: 'NZL', name: 'New Zealand', name_local: 'New Zealand', domain: '.nz', continent: 'OC', population: 5000000 },
  { iso_code: 'ZA', iso3_code: 'ZAF', name: 'South Africa', name_local: 'South Africa', domain: '.za', continent: 'AF', population: 60000000 },
  { iso_code: 'EG', iso3_code: 'EGY', name: 'Egypt', name_local: 'مصر', domain: '.eg', continent: 'AF', population: 102000000 },
  { iso_code: 'MA', iso3_code: 'MAR', name: 'Morocco', name_local: 'المغرب', domain: '.ma', continent: 'AF', population: 37000000 },
  { iso_code: 'CL', iso3_code: 'CHL', name: 'Chile', name_local: 'Chile', domain: '.cl', continent: 'SA', population: 19000000 },
  { iso_code: 'PE', iso3_code: 'PER', name: 'Peru', name_local: 'Perú', domain: '.pe', continent: 'SA', population: 33000000 },
  { iso_code: 'CR', iso3_code: 'CRI', name: 'Costa Rica', name_local: 'Costa Rica', domain: '.cr', continent: 'NA', population: 5100000 },
  { iso_code: 'PA', iso3_code: 'PAN', name: 'Panama', name_local: 'Panamá', domain: '.pa', continent: 'NA', population: 4400000 },
  { iso_code: 'DO', iso3_code: 'DOM', name: 'Dominican Republic', name_local: 'República Dominicana', domain: '.do', continent: 'NA', population: 11000000 },
  { iso_code: 'IL', iso3_code: 'ISR', name: 'Israel', name_local: 'ישראל', domain: '.il', continent: 'AS', population: 9200000 },
  { iso_code: 'UA', iso3_code: 'UKR', name: 'Ukraine', name_local: 'Україна', domain: '.ua', continent: 'EU', population: 44000000 },
  { iso_code: 'RS', iso3_code: 'SRB', name: 'Serbia', name_local: 'Србија', domain: '.rs', continent: 'EU', population: 6900000 },
  { iso_code: 'BA', iso3_code: 'BIH', name: 'Bosnia and Herzegovina', name_local: 'Bosna i Hercegovina', domain: '.ba', continent: 'EU', population: 3300000 },
  { iso_code: 'AL', iso3_code: 'ALB', name: 'Albania', name_local: 'Shqipëri', domain: '.al', continent: 'EU', population: 2900000 },
];

// Netherlands regions
const nlRegions = [
  { geoname_id: 2749879, name: 'North Holland', ascii_name: 'Noord-Holland', admin1_code: '07' },
  { geoname_id: 2743698, name: 'South Holland', ascii_name: 'Zuid-Holland', admin1_code: '11' },
  { geoname_id: 2745909, name: 'Utrecht', ascii_name: 'Utrecht', admin1_code: '09' },
  { geoname_id: 2756253, name: 'Gelderland', ascii_name: 'Gelderland', admin1_code: '03' },
  { geoname_id: 2751596, name: 'North Brabant', ascii_name: 'Noord-Brabant', admin1_code: '06' },
  { geoname_id: 2751875, name: 'Limburg', ascii_name: 'Limburg', admin1_code: '05' },
  { geoname_id: 2755812, name: 'Groningen', ascii_name: 'Groningen', admin1_code: '04' },
  { geoname_id: 2755634, name: 'Friesland', ascii_name: 'Friesland', admin1_code: '02' },
  { geoname_id: 2748838, name: 'Overijssel', ascii_name: 'Overijssel', admin1_code: '08' },
  { geoname_id: 2759793, name: 'Drenthe', ascii_name: 'Drenthe', admin1_code: '01' },
  { geoname_id: 2750324, name: 'Zeeland', ascii_name: 'Zeeland', admin1_code: '10' },
  { geoname_id: 2759995, name: 'Flevoland', ascii_name: 'Flevoland', admin1_code: '16' },
];

// Netherlands cities
const nlCities = [
  { geoname_id: 2759793, name: 'Amsterdam', ascii_name: 'Amsterdam', latitude: 52.37403, longitude: 4.88969, population: 872680, admin1_code: '07', is_capital: true, is_major_city: true },
  { geoname_id: 2747891, name: 'Rotterdam', ascii_name: 'Rotterdam', latitude: 51.92250, longitude: 4.47917, population: 651446, admin1_code: '11', is_capital: false, is_major_city: true },
  { geoname_id: 2747373, name: 'The Hague', ascii_name: 'The Hague', latitude: 52.07667, longitude: 4.29861, population: 545838, admin1_code: '11', is_capital: false, is_major_city: true },
  { geoname_id: 2745912, name: 'Utrecht', ascii_name: 'Utrecht', latitude: 52.09083, longitude: 5.12222, population: 357179, admin1_code: '09', is_capital: false, is_major_city: true },
  { geoname_id: 2756254, name: 'Eindhoven', ascii_name: 'Eindhoven', latitude: 51.44083, longitude: 5.47778, population: 231642, admin1_code: '06', is_capital: false, is_major_city: true },
  { geoname_id: 2757783, name: 'Tilburg', ascii_name: 'Tilburg', latitude: 51.55551, longitude: 5.09130, population: 217259, admin1_code: '06', is_capital: false, is_major_city: true },
  { geoname_id: 2755251, name: 'Groningen', ascii_name: 'Groningen', latitude: 53.21917, longitude: 6.56667, population: 202810, admin1_code: '04', is_capital: false, is_major_city: true },
  { geoname_id: 2759661, name: 'Almere', ascii_name: 'Almere', latitude: 52.35000, longitude: 5.26250, population: 203990, admin1_code: '16', is_capital: false, is_major_city: true },
  { geoname_id: 2758401, name: 'Breda', ascii_name: 'Breda', latitude: 51.58656, longitude: 4.77596, population: 183873, admin1_code: '06', is_capital: false, is_major_city: true },
  { geoname_id: 2750896, name: 'Nijmegen', ascii_name: 'Nijmegen', latitude: 51.84250, longitude: 5.85278, population: 176731, admin1_code: '03', is_capital: false, is_major_city: true },
  { geoname_id: 2759879, name: 'Arnhem', ascii_name: 'Arnhem', latitude: 51.98500, longitude: 5.89861, population: 159265, admin1_code: '03', is_capital: false, is_major_city: true },
  { geoname_id: 2755003, name: 'Haarlem', ascii_name: 'Haarlem', latitude: 52.38084, longitude: 4.63683, population: 160374, admin1_code: '07', is_capital: false, is_major_city: true },
  { geoname_id: 2756071, name: 'Enschede', ascii_name: 'Enschede', latitude: 52.21833, longitude: 6.89583, population: 158986, admin1_code: '08', is_capital: false, is_major_city: true },
  { geoname_id: 2751283, name: 'Maastricht', ascii_name: 'Maastricht', latitude: 50.84833, longitude: 5.68889, population: 122378, admin1_code: '05', is_capital: false, is_major_city: true },
  { geoname_id: 2751738, name: 'Leiden', ascii_name: 'Leiden', latitude: 52.16000, longitude: 4.49306, population: 124899, admin1_code: '11', is_capital: false, is_major_city: true },
];

// UK regions
const ukRegions = [
  { geoname_id: 6269131, name: 'England', ascii_name: 'England', admin1_code: 'ENG' },
  { geoname_id: 2638360, name: 'Scotland', ascii_name: 'Scotland', admin1_code: 'SCT' },
  { geoname_id: 2634895, name: 'Wales', ascii_name: 'Wales', admin1_code: 'WLS' },
  { geoname_id: 2641364, name: 'Northern Ireland', ascii_name: 'Northern Ireland', admin1_code: 'NIR' },
];

// UK cities
const ukCities = [
  { geoname_id: 2643743, name: 'London', ascii_name: 'London', latitude: 51.50853, longitude: -0.12574, population: 8982000, admin1_code: 'ENG', is_capital: true, is_major_city: true },
  { geoname_id: 2655603, name: 'Birmingham', ascii_name: 'Birmingham', latitude: 52.48142, longitude: -1.89983, population: 1144900, admin1_code: 'ENG', is_capital: false, is_major_city: true },
  { geoname_id: 2643123, name: 'Manchester', ascii_name: 'Manchester', latitude: 53.48095, longitude: -2.23743, population: 553230, admin1_code: 'ENG', is_capital: false, is_major_city: true },
  { geoname_id: 2648579, name: 'Glasgow', ascii_name: 'Glasgow', latitude: 55.86515, longitude: -4.25763, population: 626410, admin1_code: 'SCT', is_capital: false, is_major_city: true },
  { geoname_id: 2644210, name: 'Liverpool', ascii_name: 'Liverpool', latitude: 53.41058, longitude: -2.97794, population: 494814, admin1_code: 'ENG', is_capital: false, is_major_city: true },
  { geoname_id: 2644688, name: 'Leeds', ascii_name: 'Leeds', latitude: 53.79648, longitude: -1.54785, population: 789194, admin1_code: 'ENG', is_capital: false, is_major_city: true },
  { geoname_id: 2638077, name: 'Sheffield', ascii_name: 'Sheffield', latitude: 53.38297, longitude: -1.46590, population: 582506, admin1_code: 'ENG', is_capital: false, is_major_city: true },
  { geoname_id: 2650225, name: 'Edinburgh', ascii_name: 'Edinburgh', latitude: 55.95206, longitude: -3.19648, population: 488050, admin1_code: 'SCT', is_capital: false, is_major_city: true },
  { geoname_id: 2654675, name: 'Bristol', ascii_name: 'Bristol', latitude: 51.45523, longitude: -2.59665, population: 463400, admin1_code: 'ENG', is_capital: false, is_major_city: true },
  { geoname_id: 2644668, name: 'Leicester', ascii_name: 'Leicester', latitude: 52.63860, longitude: -1.13169, population: 443760, admin1_code: 'ENG', is_capital: false, is_major_city: true },
  { geoname_id: 2652221, name: 'Coventry', ascii_name: 'Coventry', latitude: 52.40656, longitude: -1.51217, population: 371521, admin1_code: 'ENG', is_capital: false, is_major_city: true },
  { geoname_id: 2654993, name: 'Bradford', ascii_name: 'Bradford', latitude: 53.79391, longitude: -1.75206, population: 537173, admin1_code: 'ENG', is_capital: false, is_major_city: true },
  { geoname_id: 2653822, name: 'Cardiff', ascii_name: 'Cardiff', latitude: 51.48158, longitude: -3.17909, population: 362756, admin1_code: 'WLS', is_capital: false, is_major_city: true },
  { geoname_id: 2655984, name: 'Belfast', ascii_name: 'Belfast', latitude: 54.59728, longitude: -5.93012, population: 343542, admin1_code: 'NIR', is_capital: false, is_major_city: true },
  { geoname_id: 2641170, name: 'Nottingham', ascii_name: 'Nottingham', latitude: 52.95478, longitude: -1.15810, population: 321500, admin1_code: 'ENG', is_capital: false, is_major_city: true },
];

async function main() {
  console.log('🌍 Starting geo import...\n');

  // 1. Insert new countries
  console.log('📍 Adding new countries...');
  const { error: countriesError } = await supabase
    .from('geo_countries')
    .upsert(newCountries, { onConflict: 'iso_code' });
  
  if (countriesError) {
    console.error('  ✗ Countries error:', countriesError.message);
  } else {
    console.log(`  ✓ Added ${newCountries.length} countries`);
  }

  // 2. Get NL country ID
  const { data: nlCountry } = await supabase
    .from('geo_countries')
    .select('id')
    .eq('iso_code', 'NL')
    .single();

  if (nlCountry) {
    // Insert NL regions
    console.log('\n🇳🇱 Adding Netherlands regions...');
    const nlRegionsWithCountry = nlRegions.map(r => ({ ...r, country_id: nlCountry.id }));
    const { error: nlRegError } = await supabase
      .from('geo_regions')
      .upsert(nlRegionsWithCountry, { onConflict: 'geoname_id' });
    
    if (nlRegError) {
      console.error('  ✗ NL regions error:', nlRegError.message);
    } else {
      console.log(`  ✓ Added ${nlRegions.length} regions`);
    }

    // Get region IDs
    const { data: regions } = await supabase
      .from('geo_regions')
      .select('id, admin1_code')
      .eq('country_id', nlCountry.id);

    const regionMap = new Map(regions?.map(r => [r.admin1_code, r.id]) || []);

    // Insert NL cities
    console.log('🏙️ Adding Netherlands cities...');
    const nlCitiesWithIds = nlCities.map(c => ({
      geoname_id: c.geoname_id,
      country_id: nlCountry.id,
      region_id: regionMap.get(c.admin1_code) || null,
      name: c.name,
      ascii_name: c.ascii_name,
      latitude: c.latitude,
      longitude: c.longitude,
      population: c.population,
      is_capital: c.is_capital,
      is_major_city: c.is_major_city,
      feature_code: c.is_capital ? 'PPLC' : 'PPL',
    }));

    const { error: nlCitiesError } = await supabase
      .from('geo_cities')
      .upsert(nlCitiesWithIds, { onConflict: 'geoname_id' });

    if (nlCitiesError) {
      console.error('  ✗ NL cities error:', nlCitiesError.message);
    } else {
      console.log(`  ✓ Added ${nlCities.length} cities`);
    }
  }

  // 3. Get UK country ID
  const { data: ukCountry } = await supabase
    .from('geo_countries')
    .select('id')
    .eq('iso_code', 'GB')
    .single();

  if (ukCountry) {
    // Insert UK regions
    console.log('\n🇬🇧 Adding UK regions...');
    const ukRegionsWithCountry = ukRegions.map(r => ({ ...r, country_id: ukCountry.id }));
    const { error: ukRegError } = await supabase
      .from('geo_regions')
      .upsert(ukRegionsWithCountry, { onConflict: 'geoname_id' });

    if (ukRegError) {
      console.error('  ✗ UK regions error:', ukRegError.message);
    } else {
      console.log(`  ✓ Added ${ukRegions.length} regions`);
    }

    // Get region IDs
    const { data: regions } = await supabase
      .from('geo_regions')
      .select('id, admin1_code')
      .eq('country_id', ukCountry.id);

    const regionMap = new Map(regions?.map(r => [r.admin1_code, r.id]) || []);

    // Insert UK cities
    console.log('🏙️ Adding UK cities...');
    const ukCitiesWithIds = ukCities.map(c => ({
      geoname_id: c.geoname_id,
      country_id: ukCountry.id,
      region_id: regionMap.get(c.admin1_code) || null,
      name: c.name,
      ascii_name: c.ascii_name,
      latitude: c.latitude,
      longitude: c.longitude,
      population: c.population,
      is_capital: c.is_capital,
      is_major_city: c.is_major_city,
      feature_code: c.is_capital ? 'PPLC' : 'PPL',
    }));

    const { error: ukCitiesError } = await supabase
      .from('geo_cities')
      .upsert(ukCitiesWithIds, { onConflict: 'geoname_id' });

    if (ukCitiesError) {
      console.error('  ✗ UK cities error:', ukCitiesError.message);
    } else {
      console.log(`  ✓ Added ${ukCities.length} cities`);
    }
  }

  // Final count
  const { count: countryCount } = await supabase.from('geo_countries').select('*', { count: 'exact', head: true });
  const { count: regionCount } = await supabase.from('geo_regions').select('*', { count: 'exact', head: true });
  const { count: cityCount } = await supabase.from('geo_cities').select('*', { count: 'exact', head: true });

  console.log('\n═══════════════════════════════════════════');
  console.log('  ✓ IMPORT COMPLETE');
  console.log(`  → Countries: ${countryCount}`);
  console.log(`  → Regions: ${regionCount}`);
  console.log(`  → Cities: ${cityCount}`);
  console.log('═══════════════════════════════════════════\n');
}

main().catch(console.error);
