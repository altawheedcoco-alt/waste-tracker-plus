-- Reel views tracking table for analytics
CREATE TABLE public.reel_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reel_id uuid NOT NULL REFERENCES public.reels(id) ON DELETE CASCADE,
  viewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  watch_duration_seconds integer DEFAULT 0,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_reel_views_reel_id ON public.reel_views(reel_id);
CREATE INDEX idx_reel_views_created ON public.reel_views(created_at);

ALTER TABLE public.reel_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can insert views"
  ON public.reel_views FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = viewer_id);

CREATE POLICY "Reel owners can view analytics"
  ON public.reel_views FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.reels WHERE reels.id = reel_views.reel_id AND reels.user_id = auth.uid())
    OR auth.uid() = viewer_id
  );

-- Add duet_of column to reels for reply/duet feature
ALTER TABLE public.reels ADD COLUMN IF NOT EXISTS duet_of uuid REFERENCES public.reels(id) ON DELETE SET NULL;

-- Add filter column to reels
ALTER TABLE public.reels ADD COLUMN IF NOT EXISTS video_filter text DEFAULT 'none';

-- Add reel views to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.reel_views;