-- Private show requests
CREATE TABLE IF NOT EXISTS public.cam_private_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewer_username TEXT NOT NULL,
  tokens_per_min INTEGER NOT NULL DEFAULT 20,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | accepted | declined | ended
  created_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  room_name TEXT -- LiveKit private room name
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cam_private_requests_listing ON cam_private_requests(listing_id);
CREATE INDEX IF NOT EXISTS idx_cam_private_requests_viewer ON cam_private_requests(viewer_id);
CREATE INDEX IF NOT EXISTS idx_cam_private_requests_status ON cam_private_requests(status);

-- RLS
ALTER TABLE cam_private_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see their own requests" ON cam_private_requests
  FOR ALL USING (viewer_id = auth.uid() OR listing_id IN (
    SELECT id FROM listings WHERE user_id = auth.uid()
  ));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE cam_private_requests;
