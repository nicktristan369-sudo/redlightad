CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES auth.users(id),
  reason TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending'
);
CREATE INDEX IF NOT EXISTS reports_listing_id_idx ON reports(listing_id);
CREATE INDEX IF NOT EXISTS reports_status_idx ON reports(status);
