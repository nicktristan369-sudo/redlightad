-- Add geo columns for Booking.com style location system
-- Run this in Supabase SQL editor

-- Add new columns to listings table
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS place_id TEXT,
ADD COLUMN IF NOT EXISTS formatted_address TEXT,
ADD COLUMN IF NOT EXISTS major_city TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT;

-- Create index for geo queries (proximity search)
CREATE INDEX IF NOT EXISTS idx_listings_geo 
ON listings (latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Create index for major city searches
CREATE INDEX IF NOT EXISTS idx_listings_major_city 
ON listings (major_city) 
WHERE major_city IS NOT NULL;

-- Create index for city searches
CREATE INDEX IF NOT EXISTS idx_listings_city 
ON listings (city) 
WHERE city IS NOT NULL;

COMMENT ON COLUMN listings.latitude IS 'Latitude from Google Places';
COMMENT ON COLUMN listings.longitude IS 'Longitude from Google Places';
COMMENT ON COLUMN listings.place_id IS 'Google Places ID for reference';
COMMENT ON COLUMN listings.formatted_address IS 'Full formatted address from Google';
COMMENT ON COLUMN listings.major_city IS 'Nearest major city for grouping (e.g., Marbella for Benahavis)';
COMMENT ON COLUMN listings.postal_code IS 'Postal/ZIP code';
