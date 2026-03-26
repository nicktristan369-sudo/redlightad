CREATE TABLE IF NOT EXISTS invite_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT,
  city TEXT,
  country TEXT,
  category TEXT,
  description TEXT,
  images JSONB,
  source_url TEXT,
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  created_listing_id UUID REFERENCES listings(id),
  clicks INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days'
);
CREATE INDEX IF NOT EXISTS invite_links_token_idx ON invite_links(token);
CREATE INDEX IF NOT EXISTS invite_links_is_used_idx ON invite_links(is_used);
