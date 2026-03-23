
-- جدول إعجابات المنشورات
CREATE TABLE public.platform_post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  visitor_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, visitor_id)
);

ALTER TABLE public.platform_post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read likes" ON public.platform_post_likes
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert likes" ON public.platform_post_likes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can delete own likes" ON public.platform_post_likes
  FOR DELETE USING (true);

-- Add likes_count column to platform_posts
ALTER TABLE public.platform_posts ADD COLUMN IF NOT EXISTS likes_count integer DEFAULT 0;

-- Function to increment views safely via RPC
CREATE OR REPLACE FUNCTION public.increment_post_views(p_post_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE platform_posts SET views_count = COALESCE(views_count, 0) + 1 WHERE id = p_post_id;
$$;

-- Function to toggle like and update count
CREATE OR REPLACE FUNCTION public.toggle_post_like(p_post_id uuid, p_visitor_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  already_liked boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM platform_post_likes WHERE post_id = p_post_id AND visitor_id = p_visitor_id) INTO already_liked;
  
  IF already_liked THEN
    DELETE FROM platform_post_likes WHERE post_id = p_post_id AND visitor_id = p_visitor_id;
    UPDATE platform_posts SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0) WHERE id = p_post_id;
    RETURN false;
  ELSE
    INSERT INTO platform_post_likes (post_id, visitor_id) VALUES (p_post_id, p_visitor_id);
    UPDATE platform_posts SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = p_post_id;
    RETURN true;
  END IF;
END;
$$;
