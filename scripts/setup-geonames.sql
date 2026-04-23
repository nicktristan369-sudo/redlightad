-- ============================================================================
-- REDLIGHTAD GLOBAL LOCATION SYSTEM
-- Powered by GeoNames (11+ million places worldwide)
-- ============================================================================

-- Enable PostGIS for spatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable trigram for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================================
-- COUNTRIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS geo_countries (
  id SERIAL PRIMARY KEY,
  geoname_id BIGINT UNIQUE,
  name VARCHAR(200) NOT NULL,
  name_local VARCHAR(200),           -- Local name (Deutschland, Danmark, etc.)
  iso_code CHAR(2) UNIQUE NOT NULL,  -- DK, DE, US
  iso3_code CHAR(3),                 -- DNK, DEU, USA
  domain VARCHAR(10),                -- .dk, .de, .com
  continent VARCHAR(2),              -- EU, NA, AS, AF, OC, SA, AN
  population BIGINT DEFAULT 0,
  area_km2 DECIMAL(12, 2),
  currency_code CHAR(3),
  currency_name VARCHAR(50),
  phone_prefix VARCHAR(20),
  languages VARCHAR(100),            -- da,en,de etc.
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  geom GEOGRAPHY(Point, 4326),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- REGIONS TABLE (Admin Level 1: States, Regions, Provinces)
-- Examples: California, Bavaria, Syddanmark, Île-de-France
-- ============================================================================
CREATE TABLE IF NOT EXISTS geo_regions (
  id SERIAL PRIMARY KEY,
  geoname_id BIGINT UNIQUE NOT NULL,
  country_id INTEGER REFERENCES geo_countries(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  name_local VARCHAR(200),
  ascii_name VARCHAR(200),
  admin1_code VARCHAR(20),
  population BIGINT DEFAULT 0,
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  geom GEOGRAPHY(Point, 4326),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- SUBREGIONS TABLE (Admin Level 2: Counties, Municipalities, Kommuner)
-- Examples: Los Angeles County, München (Landkreis), Aarhus Kommune
-- ============================================================================
CREATE TABLE IF NOT EXISTS geo_subregions (
  id SERIAL PRIMARY KEY,
  geoname_id BIGINT UNIQUE NOT NULL,
  region_id INTEGER REFERENCES geo_regions(id) ON DELETE CASCADE,
  country_id INTEGER REFERENCES geo_countries(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  name_local VARCHAR(200),
  ascii_name VARCHAR(200),
  admin1_code VARCHAR(20),
  admin2_code VARCHAR(80),
  population BIGINT DEFAULT 0,
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  geom GEOGRAPHY(Point, 4326),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- CITIES TABLE (All populated places in the world)
-- This is the main table - will contain millions of rows
-- ============================================================================
CREATE TABLE IF NOT EXISTS geo_cities (
  id SERIAL PRIMARY KEY,
  geoname_id BIGINT UNIQUE NOT NULL,
  country_id INTEGER REFERENCES geo_countries(id) ON DELETE CASCADE,
  region_id INTEGER REFERENCES geo_regions(id) ON DELETE SET NULL,
  subregion_id INTEGER REFERENCES geo_subregions(id) ON DELETE SET NULL,
  
  -- Names
  name VARCHAR(200) NOT NULL,
  name_local VARCHAR(200),
  ascii_name VARCHAR(200),
  
  -- Coordinates (CRITICAL for radius search)
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  geom GEOGRAPHY(Point, 4326) NOT NULL,
  
  -- Metadata
  population BIGINT DEFAULT 0,
  elevation INTEGER,                  -- Meters above sea level
  feature_code VARCHAR(10),           -- PPL, PPLC, PPLA, etc.
  timezone VARCHAR(40),
  
  -- Admin codes for linking
  admin1_code VARCHAR(20),
  admin2_code VARCHAR(80),
  admin3_code VARCHAR(20),
  admin4_code VARCHAR(20),
  
  -- Computed fields
  is_capital BOOLEAN DEFAULT FALSE,   -- PPLC
  is_major_city BOOLEAN DEFAULT FALSE, -- Population > 100,000
  is_regional_capital BOOLEAN DEFAULT FALSE, -- PPLA
  
  -- Search optimization
  search_rank INTEGER DEFAULT 0,      -- Higher = more important
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- ALTERNATE NAMES TABLE (Local names, translations, common misspellings)
-- Examples: "Copenhagen" → "København", "Munich" → "München"
-- ============================================================================
CREATE TABLE IF NOT EXISTS geo_alternate_names (
  id SERIAL PRIMARY KEY,
  geoname_id BIGINT,                  -- Reference to original GeoNames ID
  city_id INTEGER REFERENCES geo_cities(id) ON DELETE CASCADE,
  name VARCHAR(400) NOT NULL,
  ascii_name VARCHAR(400),
  language VARCHAR(10),               -- da, en, de, NULL for general
  is_preferred BOOLEAN DEFAULT FALSE,
  is_short BOOLEAN DEFAULT FALSE,
  is_colloquial BOOLEAN DEFAULT FALSE,
  is_historic BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- LISTINGS LOCATION EXTENSION
-- Add geospatial columns to existing listings table
-- ============================================================================

-- Add new columns to listings (if they don't exist)
DO $$ 
BEGIN
  -- Add city_geoname_id if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'listings' AND column_name = 'city_geoname_id') THEN
    ALTER TABLE listings ADD COLUMN city_geoname_id INTEGER REFERENCES geo_cities(id);
  END IF;
  
  -- Add region_geoname_id if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'listings' AND column_name = 'region_geoname_id') THEN
    ALTER TABLE listings ADD COLUMN region_geoname_id INTEGER REFERENCES geo_regions(id);
  END IF;
  
  -- Add coordinates if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'listings' AND column_name = 'latitude') THEN
    ALTER TABLE listings ADD COLUMN latitude DECIMAL(10, 7);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'listings' AND column_name = 'longitude') THEN
    ALTER TABLE listings ADD COLUMN longitude DECIMAL(10, 7);
  END IF;
  
  -- Add PostGIS geometry column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'listings' AND column_name = 'geom') THEN
    ALTER TABLE listings ADD COLUMN geom GEOGRAPHY(Point, 4326);
  END IF;
END $$;

-- ============================================================================
-- INDEXES (CRITICAL FOR PERFORMANCE)
-- ============================================================================

-- Countries
CREATE INDEX IF NOT EXISTS idx_geo_countries_iso ON geo_countries(iso_code);
CREATE INDEX IF NOT EXISTS idx_geo_countries_domain ON geo_countries(domain);

-- Regions
CREATE INDEX IF NOT EXISTS idx_geo_regions_country ON geo_regions(country_id);
CREATE INDEX IF NOT EXISTS idx_geo_regions_admin1 ON geo_regions(country_id, admin1_code);
CREATE INDEX IF NOT EXISTS idx_geo_regions_name ON geo_regions USING gin(ascii_name gin_trgm_ops);

-- Subregions
CREATE INDEX IF NOT EXISTS idx_geo_subregions_region ON geo_subregions(region_id);
CREATE INDEX IF NOT EXISTS idx_geo_subregions_country ON geo_subregions(country_id);

-- Cities (MOST IMPORTANT)
CREATE INDEX IF NOT EXISTS idx_geo_cities_geom ON geo_cities USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_geo_cities_country ON geo_cities(country_id);
CREATE INDEX IF NOT EXISTS idx_geo_cities_region ON geo_cities(region_id);
CREATE INDEX IF NOT EXISTS idx_geo_cities_name ON geo_cities USING gin(ascii_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_geo_cities_name_local ON geo_cities USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_geo_cities_population ON geo_cities(population DESC);
CREATE INDEX IF NOT EXISTS idx_geo_cities_major ON geo_cities(is_major_city) WHERE is_major_city = TRUE;
CREATE INDEX IF NOT EXISTS idx_geo_cities_search_rank ON geo_cities(search_rank DESC);
CREATE INDEX IF NOT EXISTS idx_geo_cities_country_pop ON geo_cities(country_id, population DESC);

-- Alternate names
CREATE INDEX IF NOT EXISTS idx_geo_alt_names_city ON geo_alternate_names(city_id);
CREATE INDEX IF NOT EXISTS idx_geo_alt_names_name ON geo_alternate_names USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_geo_alt_names_ascii ON geo_alternate_names USING gin(ascii_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_geo_alt_names_lang ON geo_alternate_names(language);

-- Listings spatial index
CREATE INDEX IF NOT EXISTS idx_listings_geom ON listings USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_listings_city_geo ON listings(city_geoname_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate smart radius based on city population
CREATE OR REPLACE FUNCTION get_smart_radius_km(city_population BIGINT)
RETURNS INTEGER AS $$
BEGIN
  -- Larger cities = smaller radius (more density)
  -- Smaller cities = larger radius (need to include nearby areas)
  IF city_population >= 1000000 THEN
    RETURN 10;  -- Mega cities: 10km
  ELSIF city_population >= 500000 THEN
    RETURN 15;  -- Large cities: 15km
  ELSIF city_population >= 100000 THEN
    RETURN 25;  -- Medium cities: 25km
  ELSIF city_population >= 50000 THEN
    RETURN 35;  -- Small cities: 35km
  ELSIF city_population >= 10000 THEN
    RETURN 50;  -- Towns: 50km
  ELSE
    RETURN 75;  -- Villages/rural: 75km
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update listing geometry from coordinates
CREATE OR REPLACE FUNCTION update_listing_geom()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.geom := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update geom when coordinates change
DROP TRIGGER IF EXISTS trg_listing_geom ON listings;
CREATE TRIGGER trg_listing_geom
  BEFORE INSERT OR UPDATE OF latitude, longitude ON listings
  FOR EACH ROW
  EXECUTE FUNCTION update_listing_geom();

-- ============================================================================
-- SEARCH FUNCTIONS
-- ============================================================================

-- Search cities with fuzzy matching and ranking
CREATE OR REPLACE FUNCTION search_cities(
  search_query TEXT,
  country_code_filter CHAR(2) DEFAULT NULL,
  result_limit INTEGER DEFAULT 15
)
RETURNS TABLE (
  city_id INTEGER,
  city_name VARCHAR,
  city_ascii VARCHAR,
  region_name VARCHAR,
  country_name VARCHAR,
  country_iso CHAR(2),
  population BIGINT,
  latitude DECIMAL,
  longitude DECIMAL,
  relevance_score REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.ascii_name,
    r.name,
    co.name,
    co.iso_code,
    c.population,
    c.latitude,
    c.longitude,
    (
      -- Similarity score
      GREATEST(
        similarity(c.ascii_name, search_query),
        similarity(c.name, search_query)
      ) * 0.6
      -- Population bonus (log scale)
      + LEAST(LOG(GREATEST(c.population, 1)) / 20.0, 0.3)
      -- Exact match bonus
      + CASE WHEN LOWER(c.ascii_name) = LOWER(search_query) THEN 0.1 ELSE 0 END
    )::REAL AS relevance
  FROM geo_cities c
  LEFT JOIN geo_regions r ON c.region_id = r.id
  LEFT JOIN geo_countries co ON c.country_id = co.id
  WHERE 
    (country_code_filter IS NULL OR co.iso_code = country_code_filter)
    AND (
      c.ascii_name ILIKE '%' || search_query || '%'
      OR c.name ILIKE '%' || search_query || '%'
      OR c.id IN (
        SELECT an.city_id FROM geo_alternate_names an
        WHERE an.name ILIKE '%' || search_query || '%'
      )
    )
  ORDER BY relevance DESC, c.population DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- Search listings within radius of a city
CREATE OR REPLACE FUNCTION search_listings_by_location(
  city_name_query TEXT,
  country_code_filter CHAR(2),
  radius_km INTEGER DEFAULT NULL,
  result_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  listing_id UUID,
  title VARCHAR,
  city_name VARCHAR,
  region_name VARCHAR,
  distance_km DECIMAL
) AS $$
DECLARE
  search_city geo_cities%ROWTYPE;
  effective_radius INTEGER;
BEGIN
  -- Find the city
  SELECT * INTO search_city
  FROM geo_cities c
  JOIN geo_countries co ON c.country_id = co.id
  WHERE c.ascii_name ILIKE city_name_query
    AND co.iso_code = country_code_filter
  ORDER BY c.population DESC
  LIMIT 1;
  
  IF search_city IS NULL THEN
    RETURN;
  END IF;
  
  -- Use smart radius if not specified
  effective_radius := COALESCE(radius_km, get_smart_radius_km(search_city.population));
  
  RETURN QUERY
  SELECT 
    l.id,
    l.display_name,
    l.city,
    l.region,
    ROUND((ST_Distance(l.geom, search_city.geom) / 1000)::DECIMAL, 1)
  FROM listings l
  WHERE 
    l.status = 'active'
    AND l.geom IS NOT NULL
    AND ST_DWithin(l.geom, search_city.geom, effective_radius * 1000)
  ORDER BY ST_Distance(l.geom, search_city.geom)
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INITIAL DATA: Core countries for RedLightAD
-- ============================================================================

INSERT INTO geo_countries (iso_code, iso3_code, name, name_local, domain, continent, population) VALUES
  ('DK', 'DNK', 'Denmark', 'Danmark', '.dk', 'EU', 5900000),
  ('DE', 'DEU', 'Germany', 'Deutschland', '.de', 'EU', 83200000),
  ('NL', 'NLD', 'Netherlands', 'Nederland', '.nl', 'EU', 17400000),
  ('GB', 'GBR', 'United Kingdom', 'United Kingdom', '.uk', 'EU', 67000000),
  ('US', 'USA', 'United States', 'United States', '.com', 'NA', 331000000),
  ('FR', 'FRA', 'France', 'France', '.fr', 'EU', 67400000),
  ('ES', 'ESP', 'Spain', 'España', '.es', 'EU', 47400000),
  ('IT', 'ITA', 'Italy', 'Italia', '.it', 'EU', 59000000),
  ('SE', 'SWE', 'Sweden', 'Sverige', '.se', 'EU', 10400000),
  ('NO', 'NOR', 'Norway', 'Norge', '.no', 'EU', 5400000),
  ('BE', 'BEL', 'Belgium', 'België', '.be', 'EU', 11500000),
  ('AT', 'AUT', 'Austria', 'Österreich', '.at', 'EU', 9000000),
  ('CH', 'CHE', 'Switzerland', 'Schweiz', '.ch', 'EU', 8700000),
  ('PL', 'POL', 'Poland', 'Polska', '.pl', 'EU', 38000000),
  ('CZ', 'CZE', 'Czech Republic', 'Česko', '.cz', 'EU', 10700000),
  ('PT', 'PRT', 'Portugal', 'Portugal', '.pt', 'EU', 10300000),
  ('TH', 'THA', 'Thailand', 'ไทย', '.th', 'AS', 70000000),
  ('BR', 'BRA', 'Brazil', 'Brasil', '.br', 'SA', 213000000),
  ('AU', 'AUS', 'Australia', 'Australia', '.au', 'OC', 26000000),
  ('CA', 'CAN', 'Canada', 'Canada', '.ca', 'NA', 38000000),
  ('MX', 'MEX', 'Mexico', 'México', '.mx', 'NA', 130000000),
  ('AE', 'ARE', 'United Arab Emirates', 'الإمارات', '.ae', 'AS', 10000000),
  ('RU', 'RUS', 'Russia', 'Россия', '.ru', 'EU', 144000000),
  ('JP', 'JPN', 'Japan', '日本', '.jp', 'AS', 125000000),
  ('IN', 'IND', 'India', 'भारत', '.in', 'AS', 1400000000),
  ('CO', 'COL', 'Colombia', 'Colombia', '.co', 'SA', 51000000),
  ('AR', 'ARG', 'Argentina', 'Argentina', '.ar', 'SA', 45000000),
  ('FI', 'FIN', 'Finland', 'Suomi', '.fi', 'EU', 5500000),
  ('IE', 'IRL', 'Ireland', 'Ireland', '.ie', 'EU', 5000000),
  ('GR', 'GRC', 'Greece', 'Ελλάδα', '.gr', 'EU', 10700000),
  ('TR', 'TUR', 'Turkey', 'Türkiye', '.tr', 'AS', 85000000),
  ('HU', 'HUN', 'Hungary', 'Magyarország', '.hu', 'EU', 9700000),
  ('RO', 'ROU', 'Romania', 'România', '.ro', 'EU', 19000000),
  ('BG', 'BGR', 'Bulgaria', 'България', '.bg', 'EU', 6900000),
  ('HR', 'HRV', 'Croatia', 'Hrvatska', '.hr', 'EU', 4000000),
  ('SK', 'SVK', 'Slovakia', 'Slovensko', '.sk', 'EU', 5500000),
  ('SI', 'SVN', 'Slovenia', 'Slovenija', '.si', 'EU', 2100000),
  ('LT', 'LTU', 'Lithuania', 'Lietuva', '.lt', 'EU', 2800000),
  ('LV', 'LVA', 'Latvia', 'Latvija', '.lv', 'EU', 1900000),
  ('EE', 'EST', 'Estonia', 'Eesti', '.ee', 'EU', 1300000)
ON CONFLICT (iso_code) DO UPDATE SET
  name = EXCLUDED.name,
  name_local = EXCLUDED.name_local,
  population = EXCLUDED.population,
  updated_at = NOW();

-- ============================================================================
-- DONE! 
-- Next steps:
-- 1. Run GeoNames import script to populate cities
-- 2. Migrate existing listings to use new geo system
-- ============================================================================
