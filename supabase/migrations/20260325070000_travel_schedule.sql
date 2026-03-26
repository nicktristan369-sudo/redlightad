CREATE TABLE IF NOT EXISTS travel_schedule (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  country_code TEXT NOT NULL,
  arrival_date DATE NOT NULL,
  departure_date DATE NOT NULL,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE listings ADD COLUMN IF NOT EXISTS original_country TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS original_city TEXT;

CREATE INDEX IF NOT EXISTS travel_schedule_listing_id_idx ON travel_schedule(listing_id);
CREATE INDEX IF NOT EXISTS travel_schedule_dates_idx ON travel_schedule(arrival_date, departure_date);
