-- Premium history tracking
-- Run this in Supabase SQL Editor

-- 1. Add premium_expires_at to listings if not exists
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Create premium_history table for tracking changes
CREATE TABLE IF NOT EXISTS premium_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'upgraded', 'downgraded', 'expired', 'renewed'
  previous_tier TEXT,
  new_tier TEXT,
  expired_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Optional: payment reference
  payment_id TEXT,
  amount_paid DECIMAL(10,2)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_premium_history_listing ON premium_history(listing_id);
CREATE INDEX IF NOT EXISTS idx_premium_history_user ON premium_history(user_id);
CREATE INDEX IF NOT EXISTS idx_premium_history_created ON premium_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_premium_expires ON listings(premium_expires_at) WHERE premium_tier IS NOT NULL AND premium_tier != 'basic';

-- RLS
ALTER TABLE premium_history ENABLE ROW LEVEL SECURITY;

-- Users can see their own premium history
CREATE POLICY "Users see own premium history" ON premium_history
  FOR SELECT USING (auth.uid() = user_id);

-- Comments
COMMENT ON TABLE premium_history IS 'Tracks all premium tier changes for listings';
COMMENT ON COLUMN listings.premium_expires_at IS 'When premium subscription expires (NULL = no expiry/basic)';
