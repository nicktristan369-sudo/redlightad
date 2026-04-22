-- Migration: Add localization fields for multi-region support
-- Date: 2026-04-22

-- Add localization fields to users table (if using auth.users)
-- Note: In Supabase, we typically add user metadata to a separate profile table

-- Check if profiles table exists and add fields
DO $$ 
BEGIN
    -- Add preferred_language to profiles if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'preferred_language'
    ) THEN
        ALTER TABLE profiles ADD COLUMN preferred_language VARCHAR(10) DEFAULT 'en';
    END IF;

    -- Add registration_region to profiles if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'registration_region'
    ) THEN
        ALTER TABLE profiles ADD COLUMN registration_region VARCHAR(5) DEFAULT 'COM';
    END IF;

    -- Add registration_domain to profiles if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'registration_domain'
    ) THEN
        ALTER TABLE profiles ADD COLUMN registration_domain VARCHAR(50);
    END IF;
END $$;

-- Add region to listings table for filtering
DO $$ 
BEGIN
    -- Add region to listings if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'listings' AND column_name = 'region'
    ) THEN
        ALTER TABLE listings ADD COLUMN region VARCHAR(5) DEFAULT 'COM';
    END IF;

    -- Add target_countries to listings for multi-region targeting
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'listings' AND column_name = 'target_countries'
    ) THEN
        ALTER TABLE listings ADD COLUMN target_countries TEXT[] DEFAULT '{}';
    END IF;
END $$;

-- Create indexes for faster filtering
CREATE INDEX IF NOT EXISTS idx_profiles_preferred_language ON profiles(preferred_language);
CREATE INDEX IF NOT EXISTS idx_profiles_registration_region ON profiles(registration_region);
CREATE INDEX IF NOT EXISTS idx_listings_region ON listings(region);

-- Create a view for region-specific listings
CREATE OR REPLACE VIEW listings_by_region AS
SELECT 
    l.*,
    p.preferred_language,
    p.registration_region
FROM listings l
LEFT JOIN profiles p ON l.user_id = p.id;

-- Comment for documentation
COMMENT ON COLUMN profiles.preferred_language IS 'User preferred language code (en, nl, de, etc.)';
COMMENT ON COLUMN profiles.registration_region IS 'Region where user registered (NL, DE, COM, etc.)';
COMMENT ON COLUMN profiles.registration_domain IS 'Domain user registered from (redlightad.nl, etc.)';
COMMENT ON COLUMN listings.region IS 'Primary region for this listing';
COMMENT ON COLUMN listings.target_countries IS 'Array of country codes this listing targets';
