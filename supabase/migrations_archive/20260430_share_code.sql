-- Add share_code column for anonymous personal links
ALTER TABLE listings ADD COLUMN IF NOT EXISTS share_code TEXT UNIQUE;

-- Generate random 8-char codes for all existing listings
UPDATE listings 
SET share_code = lower(substring(md5(random()::text || id::text), 1, 8))
WHERE share_code IS NULL;

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS listings_share_code_idx ON listings(share_code);
