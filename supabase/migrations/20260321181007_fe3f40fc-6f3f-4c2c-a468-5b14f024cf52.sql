
-- 1. إضافة أعمدة مفقودة لجدول القنوات
ALTER TABLE public.broadcast_channels
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS pinned_post_id uuid,
  ADD COLUMN IF NOT EXISTS rules text,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS total_posts integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_post_at timestamptz;

-- 2. إضافة أعمدة مفقودة لجدول المنشورات
ALTER TABLE public.broadcast_posts
  ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS edited_at timestamptz,
  ADD COLUMN IF NOT EXISTS forward_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comments_count integer DEFAULT 0;

-- 3. إنشاء جدول تعليقات المنشورات
CREATE TABLE IF NOT EXISTS public.broadcast_post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.broadcast_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  parent_comment_id uuid REFERENCES public.broadcast_post_comments(id) ON DELETE CASCADE,
  likes_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 4. إنشاء جدول إعجابات التعليقات
CREATE TABLE IF NOT EXISTS public.broadcast_comment_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES public.broadcast_post_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- 5. إنشاء جدول مشاهدات المنشورات
CREATE TABLE IF NOT EXISTS public.broadcast_post_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.broadcast_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  viewed_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- 6. تفعيل RLS
ALTER TABLE public.broadcast_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_post_views ENABLE ROW LEVEL SECURITY;

-- 7. سياسات التعليقات
CREATE POLICY "Authenticated can view comments" ON public.broadcast_post_comments
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can add comments" ON public.broadcast_post_comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own comments" ON public.broadcast_post_comments
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 8. سياسات إعجابات التعليقات
CREATE POLICY "Authenticated can view comment likes" ON public.broadcast_comment_likes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users manage own comment likes" ON public.broadcast_comment_likes
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 9. سياسات المشاهدات
CREATE POLICY "Authenticated can view post views" ON public.broadcast_post_views
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users record own views" ON public.broadcast_post_views
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 10. دوال التحديث التلقائي
CREATE OR REPLACE FUNCTION public.update_broadcast_channel_stats()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE broadcast_channels SET total_posts = COALESCE(total_posts, 0) + 1, last_post_at = NEW.created_at, updated_at = now() WHERE id = NEW.channel_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE broadcast_channels SET total_posts = GREATEST(COALESCE(total_posts, 0) - 1, 0), updated_at = now() WHERE id = OLD.channel_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END; $$;

DROP TRIGGER IF EXISTS trg_broadcast_post_stats ON public.broadcast_posts;
CREATE TRIGGER trg_broadcast_post_stats AFTER INSERT OR DELETE ON public.broadcast_posts FOR EACH ROW EXECUTE FUNCTION public.update_broadcast_channel_stats();

CREATE OR REPLACE FUNCTION public.update_broadcast_subscriber_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE broadcast_channels SET subscriber_count = COALESCE(subscriber_count, 0) + 1 WHERE id = NEW.channel_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE broadcast_channels SET subscriber_count = GREATEST(COALESCE(subscriber_count, 0) - 1, 0) WHERE id = OLD.channel_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END; $$;

DROP TRIGGER IF EXISTS trg_broadcast_sub_count ON public.broadcast_channel_subscribers;
CREATE TRIGGER trg_broadcast_sub_count AFTER INSERT OR DELETE ON public.broadcast_channel_subscribers FOR EACH ROW EXECUTE FUNCTION public.update_broadcast_subscriber_count();

CREATE OR REPLACE FUNCTION public.update_broadcast_comment_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE broadcast_posts SET comments_count = COALESCE(comments_count, 0) + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE broadcast_posts SET comments_count = GREATEST(COALESCE(comments_count, 0) - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END; $$;

DROP TRIGGER IF EXISTS trg_broadcast_comment_count ON public.broadcast_post_comments;
CREATE TRIGGER trg_broadcast_comment_count AFTER INSERT OR DELETE ON public.broadcast_post_comments FOR EACH ROW EXECUTE FUNCTION public.update_broadcast_comment_count();

CREATE OR REPLACE FUNCTION public.update_broadcast_views_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE broadcast_posts SET views_count = COALESCE(views_count, 0) + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_broadcast_views ON public.broadcast_post_views;
CREATE TRIGGER trg_broadcast_views AFTER INSERT ON public.broadcast_post_views FOR EACH ROW EXECUTE FUNCTION public.update_broadcast_views_count();
