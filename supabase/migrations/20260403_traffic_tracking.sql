CREATE TABLE IF NOT EXISTS page_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  path TEXT NOT NULL,
  country TEXT,
  city TEXT,
  referrer TEXT,
  user_agent TEXT,
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_stats (
  date DATE PRIMARY KEY,
  visitors INT DEFAULT 0,
  registrations INT DEFAULT 0,
  listings_created INT DEFAULT 0,
  revenue_dkk NUMERIC DEFAULT 0
);
