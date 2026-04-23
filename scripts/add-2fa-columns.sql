-- Add 2FA columns to profiles table
-- Run this in Supabase SQL Editor

-- Add TOTP secret and enabled flag
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS totp_secret TEXT DEFAULT NULL;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN DEFAULT false;

-- Add comment
COMMENT ON COLUMN profiles.totp_secret IS 'TOTP secret key for 2FA (base32 encoded)';
COMMENT ON COLUMN profiles.totp_enabled IS 'Whether 2FA is enabled for this user';

-- Ensure only enabled users have a secret visible (security)
-- The secret should only be set when 2FA is being set up or is enabled
