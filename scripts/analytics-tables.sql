-- Analytics tables for provider dashboard
-- Run this in Supabase SQL Editor

-- 1. Profile views tracking table
CREATE TABLE IF NOT EXISTS profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address TEXT,
  user_agent TEXT,
  viewed_at TIMESTAMPTZ DEFAULT now(),
  referrer TEXT
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_profile_views_listing ON profile_views(listing_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewed_at ON profile_views(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_profile_views_ip ON profile_views(listing_id, ip_address);

-- 2. Add view_count to listings for quick access
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- 3. Function to increment view count
CREATE OR REPLACE FUNCTION increment_listing_views(lid UUID)
RETURNS void AS $$
BEGIN
  UPDATE listings 
  SET view_count = COALESCE(view_count, 0) + 1 
  WHERE id = lid;
END;
$$ LANGUAGE plpgsql;

-- 4. Enable RLS on profile_views
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (tracking is public)
CREATE POLICY "Anyone can track views" ON profile_views
  FOR INSERT WITH CHECK (true);

-- Only listing owners can see their own views
CREATE POLICY "Providers see own listing views" ON profile_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM listings l 
      WHERE l.id = profile_views.listing_id 
      AND l.user_id = auth.uid()
    )
  );

-- 5. Optionally: Create a materialized view for daily stats (for large scale)
-- This is optional and can be added later for performance
-- CREATE MATERIALIZED VIEW daily_view_stats AS
-- SELECT 
--   listing_id,
--   DATE(viewed_at) as view_date,
--   COUNT(*) as view_count
-- FROM profile_views
-- GROUP BY listing_id, DATE(viewed_at);

-- Comments
COMMENT ON TABLE profile_views IS 'Tracks profile page views for analytics';
COMMENT ON COLUMN listings.view_count IS 'Cached total view count for quick display';
