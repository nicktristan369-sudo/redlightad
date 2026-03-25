CREATE TABLE IF NOT EXISTS marketplace_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price_redcoins INT NOT NULL,
  preview_url TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketplace_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES marketplace_items(id),
  buyer_id UUID REFERENCES auth.users(id),
  seller_listing_id UUID REFERENCES listings(id),
  price_redcoins INT NOT NULL,
  commission INT NOT NULL,
  seller_receives INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
