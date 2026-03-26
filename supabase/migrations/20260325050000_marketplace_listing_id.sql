ALTER TABLE marketplace_items ADD COLUMN IF NOT EXISTS listing_id UUID REFERENCES listings(id) ON DELETE CASCADE;
ALTER TABLE marketplace_items ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE marketplace_items ADD COLUMN IF NOT EXISTS price_redcoins INT;
ALTER TABLE marketplace_items ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;
