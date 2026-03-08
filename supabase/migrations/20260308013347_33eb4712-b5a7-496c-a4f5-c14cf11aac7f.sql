
ALTER TABLE public.visitor_tracking 
  ADD COLUMN IF NOT EXISTS session_duration_seconds integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_scroll_depth integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pages_visited text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS exit_page text,
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS utm_term text,
  ADD COLUMN IF NOT EXISTS utm_content text,
  ADD COLUMN IF NOT EXISTS viewport_width integer,
  ADD COLUMN IF NOT EXISTS viewport_height integer,
  ADD COLUMN IF NOT EXISTS bounce boolean DEFAULT true;
