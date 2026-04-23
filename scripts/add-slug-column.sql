-- Add slug column to listings table
ALTER TABLE listings ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS listings_slug_unique ON listings(slug) WHERE slug IS NOT NULL;

-- Generate slugs for existing listings that don't have one
UPDATE listings
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      COALESCE(display_name, title),
      '[^a-zA-Z0-9\s-]', '', 'g'
    ),
    '\s+', '-', 'g'
  )
) || '-' || SUBSTRING(id::text, 1, 4)
WHERE slug IS NULL;

-- Verify
SELECT id, slug, title FROM listings LIMIT 10;
