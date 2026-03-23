CREATE TABLE IF NOT EXISTS listing_videos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE,
  url text NOT NULL,
  thumbnail_url text,
  is_locked boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE listing_videos ENABLE ROW LEVEL SECURITY;

-- Alle kan SE offentlige videoer
CREATE POLICY "public_read_unlocked_videos" ON listing_videos
  FOR SELECT USING (is_locked = false);

-- Loggede brugere kan se alle videoer på listings de ejer ELLER alle ulåste
CREATE POLICY "auth_read_own_or_unlocked" ON listing_videos
  FOR SELECT TO authenticated
  USING (
    is_locked = false
    OR listing_id IN (SELECT id FROM listings WHERE user_id = auth.uid())
  );

-- Kun ejere kan INSERT/UPDATE/DELETE
CREATE POLICY "owner_insert" ON listing_videos FOR INSERT TO authenticated
  WITH CHECK (listing_id IN (SELECT id FROM listings WHERE user_id = auth.uid()));

CREATE POLICY "owner_update" ON listing_videos FOR UPDATE TO authenticated
  USING (listing_id IN (SELECT id FROM listings WHERE user_id = auth.uid()));

CREATE POLICY "owner_delete" ON listing_videos FOR DELETE TO authenticated
  USING (listing_id IN (SELECT id FROM listings WHERE user_id = auth.uid()));
