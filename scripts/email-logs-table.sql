-- Email logs for tracking sent emails (prevents duplicates)
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL, -- 'premium_reminder', 'premium_expired', 'new_message', etc.
  recipient TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_logs_user ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_listing ON email_logs(listing_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_created ON email_logs(created_at DESC);

-- Composite index for checking recent emails
CREATE INDEX IF NOT EXISTS idx_email_logs_dedup 
  ON email_logs(listing_id, email_type, created_at);

-- RLS
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Only admins/service role can access
CREATE POLICY "Service role only" ON email_logs
  FOR ALL USING (false);

COMMENT ON TABLE email_logs IS 'Tracks sent emails to prevent duplicates';
