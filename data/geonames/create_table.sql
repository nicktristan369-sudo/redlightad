-- GeoNames Cities Table for Location System
-- Run this in Supabase SQL Editor

-- Drop existing table if exists
DROP TABLE IF EXISTS geonames_cities CASCADE;

-- Create main table
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

-- Indexes for fast searching
CREATE INDEX idx_geonames_country ON geonames_cities(country_code);
CREATE INDEX idx_geonames_ascii ON geonames_cities(ascii_name);
CREATE INDEX idx_geonames_ascii_lower ON geonames_cities(LOWER(ascii_name));
CREATE INDEX idx_geonames_major ON geonames_cities(country_code, is_major_city) WHERE is_major_city = true;
CREATE INDEX idx_geonames_pop ON geonames_cities(country_code, population DESC);

-- Enable RLS
ALTER TABLE geonames_cities ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read (cities are public data)
CREATE POLICY "Allow public read" ON geonames_cities 
  FOR SELECT USING (true);

-- Function to find nearest major city using Haversine formula
CREATE OR REPLACE FUNCTION find_nearest_major_city(
  p_country_code CHAR(2),
  p_lat DOUBLE PRECISION,
  p_lon DOUBLE PRECISION
) RETURNS TABLE (
  geoname_id INT,
  name TEXT,
  distance_km DOUBLE PRECISION
) AS $$
  SELECT 
    geoname_id,
    name,
    (6371 * acos(
      LEAST(1, GREATEST(-1,
        cos(radians(p_lat)) * cos(radians(latitude)) *
        cos(radians(longitude) - radians(p_lon)) +
        sin(radians(p_lat)) * sin(radians(latitude))
      ))
    )) as distance_km
  FROM geonames_cities
  WHERE country_code = p_country_code
    AND is_major_city = true
  ORDER BY distance_km
  LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- Function to search cities by name
CREATE OR REPLACE FUNCTION search_cities(
  p_query TEXT,
  p_country_code CHAR(2) DEFAULT NULL,
  p_limit INT DEFAULT 20
) RETURNS TABLE (
  geoname_id INT,
  name TEXT,
  ascii_name TEXT,
  country_code CHAR(2),
  admin1_name TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  population INT,
  is_major_city BOOLEAN
) AS $$
  SELECT 
    geoname_id,
    name,
    ascii_name,
    country_code,
    admin1_name,
    latitude,
    longitude,
    population,
    is_major_city
  FROM geonames_cities
  WHERE 
    LOWER(ascii_name) LIKE LOWER(p_query) || '%'
    AND (p_country_code IS NULL OR country_code = p_country_code)
  ORDER BY 
    -- Exact matches first
    CASE WHEN LOWER(ascii_name) = LOWER(p_query) THEN 0 ELSE 1 END,
    -- Major cities second
    CASE WHEN is_major_city THEN 0 ELSE 1 END,
    -- Then by population
    population DESC
  LIMIT p_limit;
$$ LANGUAGE SQL STABLE;
