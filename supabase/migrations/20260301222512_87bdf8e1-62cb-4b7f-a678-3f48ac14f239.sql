
-- Search history table to save map searches and manual picks
CREATE TABLE public.map_search_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  organization_id UUID,
  search_query TEXT,
  result_name TEXT NOT NULL,
  result_address TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  search_type TEXT NOT NULL DEFAULT 'manual', -- 'ai', 'osm', 'manual', 'gps'
  confidence TEXT,
  source_model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.map_search_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own search history
CREATE POLICY "Users can view own search history"
ON public.map_search_history FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own search history
CREATE POLICY "Users can insert own search history"
ON public.map_search_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own search history
CREATE POLICY "Users can delete own search history"
ON public.map_search_history FOR DELETE
USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_map_search_history_user ON public.map_search_history(user_id, created_at DESC);
