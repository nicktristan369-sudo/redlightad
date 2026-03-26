CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES listings(id),
  buyer_id UUID REFERENCES auth.users(id),
  rate_type TEXT NOT NULL,
  price_redcoins INT NOT NULL,
  commission INT NOT NULL,
  seller_receives INT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES listings(id),
  amount_redcoins INT NOT NULL,
  amount_dkk NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending',
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS bookings_listing_id_idx ON bookings(listing_id);
CREATE INDEX IF NOT EXISTS bookings_buyer_id_idx ON bookings(buyer_id);
CREATE INDEX IF NOT EXISTS bookings_status_idx ON bookings(status);
CREATE INDEX IF NOT EXISTS payouts_listing_id_idx ON payouts(listing_id);
