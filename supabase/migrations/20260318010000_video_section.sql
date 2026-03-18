-- Tilføj manglende kolonner til listing_videos
ALTER TABLE listing_videos ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE listing_videos ADD COLUMN IF NOT EXISTS redcoin_price int DEFAULT 0;
ALTER TABLE listing_videos ADD COLUMN IF NOT EXISTS views int DEFAULT 0;
ALTER TABLE listing_videos ADD COLUMN IF NOT EXISTS likes int DEFAULT 0;
ALTER TABLE listing_videos ADD COLUMN IF NOT EXISTS sort_order int DEFAULT 0;

-- Tabel til videokøb
CREATE TABLE IF NOT EXISTS video_purchases (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id uuid REFERENCES listing_videos(id) ON DELETE CASCADE,
  coins_paid int NOT NULL DEFAULT 0,
  purchased_at timestamptz DEFAULT now(),
  UNIQUE(buyer_id, video_id)
);

ALTER TABLE video_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_see_own_purchases" ON video_purchases
  FOR SELECT TO authenticated USING (buyer_id = auth.uid());

CREATE POLICY "users_insert_own_purchases" ON video_purchases
  FOR INSERT TO authenticated WITH CHECK (buyer_id = auth.uid());

-- Opdater RLS på listing_videos: loggede brugere kan se låste videoer de har købt
DROP POLICY IF EXISTS "auth_read_own_or_unlocked" ON listing_videos;
CREATE POLICY "auth_read_videos" ON listing_videos
  FOR SELECT TO authenticated
  USING (
    is_locked = false
    OR listing_id IN (SELECT id FROM listings WHERE user_id = auth.uid())
    OR id IN (SELECT video_id FROM video_purchases WHERE buyer_id = auth.uid())
  );
