-- Create table for post likes
CREATE TABLE public.organization_post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.organization_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Create table for post comments
CREATE TABLE public.organization_post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.organization_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.organization_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_post_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for likes
CREATE POLICY "Users can view likes on posts they can see"
  ON public.organization_post_likes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_posts op
      WHERE op.id = post_id
      AND (
        -- Own organization posts
        op.organization_id = public.get_user_org_id_safe(auth.uid())
        -- Or partner organization posts
        OR EXISTS (
          SELECT 1 FROM shipments s
          WHERE (s.generator_id = op.organization_id OR s.transporter_id = op.organization_id OR s.recycler_id = op.organization_id)
          AND (s.generator_id = public.get_user_org_id_safe(auth.uid()) OR s.transporter_id = public.get_user_org_id_safe(auth.uid()) OR s.recycler_id = public.get_user_org_id_safe(auth.uid()))
        )
        -- Or admin
        OR public.has_role(auth.uid(), 'admin')
      )
    )
  );

CREATE POLICY "Users can like posts they can see"
  ON public.organization_post_likes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM organization_posts op
      WHERE op.id = post_id
      AND (
        op.organization_id = public.get_user_org_id_safe(auth.uid())
        OR EXISTS (
          SELECT 1 FROM shipments s
          WHERE (s.generator_id = op.organization_id OR s.transporter_id = op.organization_id OR s.recycler_id = op.organization_id)
          AND (s.generator_id = public.get_user_org_id_safe(auth.uid()) OR s.transporter_id = public.get_user_org_id_safe(auth.uid()) OR s.recycler_id = public.get_user_org_id_safe(auth.uid()))
        )
        OR public.has_role(auth.uid(), 'admin')
      )
    )
  );

CREATE POLICY "Users can unlike their own likes"
  ON public.organization_post_likes FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for comments
CREATE POLICY "Users can view comments on posts they can see"
  ON public.organization_post_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_posts op
      WHERE op.id = post_id
      AND (
        op.organization_id = public.get_user_org_id_safe(auth.uid())
        OR EXISTS (
          SELECT 1 FROM shipments s
          WHERE (s.generator_id = op.organization_id OR s.transporter_id = op.organization_id OR s.recycler_id = op.organization_id)
          AND (s.generator_id = public.get_user_org_id_safe(auth.uid()) OR s.transporter_id = public.get_user_org_id_safe(auth.uid()) OR s.recycler_id = public.get_user_org_id_safe(auth.uid()))
        )
        OR public.has_role(auth.uid(), 'admin')
      )
    )
  );

CREATE POLICY "Users can comment on posts they can see"
  ON public.organization_post_comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM organization_posts op
      WHERE op.id = post_id
      AND (
        op.organization_id = public.get_user_org_id_safe(auth.uid())
        OR EXISTS (
          SELECT 1 FROM shipments s
          WHERE (s.generator_id = op.organization_id OR s.transporter_id = op.organization_id OR s.recycler_id = op.organization_id)
          AND (s.generator_id = public.get_user_org_id_safe(auth.uid()) OR s.transporter_id = public.get_user_org_id_safe(auth.uid()) OR s.recycler_id = public.get_user_org_id_safe(auth.uid()))
        )
        OR public.has_role(auth.uid(), 'admin')
      )
    )
  );

CREATE POLICY "Users can update their own comments"
  ON public.organization_post_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON public.organization_post_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update likes count
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE organization_posts SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE organization_posts SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger to update likes count
CREATE TRIGGER on_post_like_change
  AFTER INSERT OR DELETE ON organization_post_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_likes_count();

-- Trigger to update updated_at on comments
CREATE TRIGGER update_post_comments_updated_at
  BEFORE UPDATE ON organization_post_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();