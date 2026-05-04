-- Add video_count column to listings and keep it in sync with listing_videos table

ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS video_count integer DEFAULT 0;

-- Backfill existing counts
UPDATE public.listings l
SET video_count = (
  SELECT COUNT(*) FROM public.listing_videos lv WHERE lv.listing_id = l.id
);

-- Trigger function to keep video_count in sync
CREATE OR REPLACE FUNCTION public.sync_listing_video_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.listings SET video_count = video_count + 1 WHERE id = NEW.listing_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.listings SET video_count = GREATEST(0, video_count - 1) WHERE id = OLD.listing_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_listing_video_count ON public.listing_videos;
CREATE TRIGGER trg_sync_listing_video_count
AFTER INSERT OR DELETE ON public.listing_videos
FOR EACH ROW EXECUTE FUNCTION public.sync_listing_video_count();
