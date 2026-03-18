
-- Post reactions table (Facebook-style: like, love, haha, wow, sad, angry)
CREATE TABLE public.post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.organization_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reaction_type TEXT NOT NULL DEFAULT 'like',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view post reactions" ON public.post_reactions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can add their own reactions" ON public.post_reactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reactions" ON public.post_reactions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own reactions" ON public.post_reactions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Comment likes table
CREATE TABLE public.comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES public.organization_post_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view comment likes" ON public.comment_likes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can like comments" ON public.comment_likes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike comments" ON public.comment_likes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Add parent_id for reply-to-comment
ALTER TABLE public.organization_post_comments ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.organization_post_comments(id) ON DELETE CASCADE;

-- Indexes
CREATE INDEX idx_post_reactions_post_id ON public.post_reactions(post_id);
CREATE INDEX idx_comment_likes_comment_id ON public.comment_likes(comment_id);
CREATE INDEX idx_comments_parent_id ON public.organization_post_comments(parent_id);
