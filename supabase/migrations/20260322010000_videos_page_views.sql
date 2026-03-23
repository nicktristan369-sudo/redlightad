-- Add duration column for video length display
ALTER TABLE listing_videos ADD COLUMN IF NOT EXISTS duration int;

-- RPC function for atomic view increment
CREATE OR REPLACE FUNCTION increment_video_views(video_id uuid)
RETURNS void AS $$
  UPDATE listing_videos SET views = views + 1 WHERE id = video_id;
$$ LANGUAGE sql SECURITY DEFINER;
