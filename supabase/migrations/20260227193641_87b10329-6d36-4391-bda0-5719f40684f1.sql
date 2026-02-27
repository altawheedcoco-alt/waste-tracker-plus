
-- 1. Add SEO & scheduling columns to blog_posts
ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS meta_description TEXT,
  ADD COLUMN IF NOT EXISTS meta_description_en TEXT,
  ADD COLUMN IF NOT EXISTS focus_keyword TEXT,
  ADD COLUMN IF NOT EXISTS focus_keyword_en TEXT,
  ADD COLUMN IF NOT EXISTS cover_image_alt TEXT,
  ADD COLUMN IF NOT EXISTS cover_image_alt_en TEXT,
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS seo_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS canonical_url TEXT,
  ADD COLUMN IF NOT EXISTS og_image_url TEXT;

-- Update existing posts: set status based on is_published
UPDATE public.blog_posts SET status = 'published' WHERE is_published = true;

-- 2. Trigger: Auto-publish scheduled posts
-- This will be called by a cron job
CREATE OR REPLACE FUNCTION public.auto_publish_scheduled_blog_posts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.blog_posts
  SET is_published = true,
      status = 'published',
      published_at = now(),
      updated_at = now()
  WHERE status = 'scheduled'
    AND scheduled_at IS NOT NULL
    AND scheduled_at <= now()
    AND is_published = false;
END;
$$;

-- 3. Trigger: Calculate basic SEO score on insert/update
CREATE OR REPLACE FUNCTION public.calculate_blog_seo_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  score INT := 0;
BEGIN
  -- Title exists and reasonable length
  IF length(NEW.title) BETWEEN 10 AND 100 THEN score := score + 15; END IF;
  -- Meta description exists
  IF NEW.meta_description IS NOT NULL AND length(NEW.meta_description) BETWEEN 50 AND 160 THEN score := score + 20; END IF;
  -- Focus keyword exists
  IF NEW.focus_keyword IS NOT NULL AND length(NEW.focus_keyword) > 2 THEN score := score + 10; END IF;
  -- Focus keyword in title
  IF NEW.focus_keyword IS NOT NULL AND NEW.title ILIKE '%' || NEW.focus_keyword || '%' THEN score := score + 15; END IF;
  -- Focus keyword in content
  IF NEW.focus_keyword IS NOT NULL AND NEW.content ILIKE '%' || NEW.focus_keyword || '%' THEN score := score + 10; END IF;
  -- Slug exists and is clean
  IF NEW.slug IS NOT NULL AND length(NEW.slug) BETWEEN 5 AND 80 THEN score := score + 10; END IF;
  -- Cover image alt text
  IF NEW.cover_image_alt IS NOT NULL AND length(NEW.cover_image_alt) > 5 THEN score := score + 10; END IF;
  -- Content length (minimum 300 chars)
  IF length(NEW.content) > 300 THEN score := score + 10; END IF;
  
  NEW.seo_score := score;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_blog_seo_score ON public.blog_posts;
CREATE TRIGGER trg_blog_seo_score
  BEFORE INSERT OR UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_blog_seo_score();
