-- Add email_notifications column to profiles table
-- Run this in Supabase SQL Editor

-- Add the column with default true
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true;

-- Update existing profiles to have notifications enabled
UPDATE profiles 
SET email_notifications = true 
WHERE email_notifications IS NULL;

-- Add comment
COMMENT ON COLUMN profiles.email_notifications IS 'Whether user wants to receive email notifications';
