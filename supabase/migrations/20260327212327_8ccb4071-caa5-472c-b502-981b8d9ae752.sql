
-- Reels table
CREATE TABLE public.reels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  hashtags TEXT[] DEFAULT '{}',
  duration_seconds INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  visibility TEXT DEFAULT 'public',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Reel likes
CREATE TABLE public.reel_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reel_id UUID NOT NULL REFERENCES public.reels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(reel_id, user_id)
);

-- Reel comments
CREATE TABLE public.reel_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reel_id UUID NOT NULL REFERENCES public.reels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES public.reel_comments(id) ON DELETE CASCADE,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Reel bookmarks
CREATE TABLE public.reel_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reel_id UUID NOT NULL REFERENCES public.reels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(reel_id, user_id)
);

-- Indexes
CREATE INDEX idx_reels_user ON public.reels(user_id);
CREATE INDEX idx_reels_org ON public.reels(organization_id);
CREATE INDEX idx_reels_active ON public.reels(is_active, created_at DESC);
CREATE INDEX idx_reel_likes_reel ON public.reel_likes(reel_id);
CREATE INDEX idx_reel_comments_reel ON public.reel_comments(reel_id);
CREATE INDEX idx_reel_bookmarks_user ON public.reel_bookmarks(user_id);

-- Enable RLS
ALTER TABLE public.reels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reel_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reel_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reel_bookmarks ENABLE ROW LEVEL SECURITY;

-- Reels visibility function (security definer to avoid recursion)
CREATE OR REPLACE FUNCTION public.can_view_reel(reel_org_id UUID, reel_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  viewer_org_id UUID;
  viewer_org_type TEXT;
  reel_org_type TEXT;
  is_viewer_driver BOOLEAN;
  is_reel_owner_driver BOOLEAN;
BEGIN
  -- Owner can always see their own reels
  IF auth.uid() = reel_user_id THEN RETURN TRUE; END IF;

  -- Get viewer's org
  SELECT uo.organization_id INTO viewer_org_id
  FROM user_organizations uo
  WHERE uo.user_id = auth.uid() AND uo.is_active = true
  LIMIT 1;

  -- Same org can always see
  IF viewer_org_id IS NOT NULL AND viewer_org_id = reel_org_id THEN RETURN TRUE; END IF;

  -- Check if viewer is driver (no org)
  is_viewer_driver := viewer_org_id IS NULL;
  is_reel_owner_driver := reel_org_id IS NULL;

  -- Both independent drivers can see each other
  IF is_viewer_driver AND is_reel_owner_driver THEN RETURN TRUE; END IF;

  -- Check linked partnerships
  IF viewer_org_id IS NOT NULL AND reel_org_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM verified_partnerships
      WHERE status = 'active'
        AND (
          (requester_org_id = viewer_org_id AND partner_org_id = reel_org_id)
          OR (requester_org_id = reel_org_id AND partner_org_id = viewer_org_id)
        )
    ) THEN RETURN TRUE; END IF;
  END IF;

  -- Same org type can see each other
  IF viewer_org_id IS NOT NULL AND reel_org_id IS NOT NULL THEN
    SELECT organization_type INTO viewer_org_type FROM organizations WHERE id = viewer_org_id;
    SELECT organization_type INTO reel_org_type FROM organizations WHERE id = reel_org_id;
    IF viewer_org_type = reel_org_type THEN RETURN TRUE; END IF;
  END IF;

  -- Driver linked to an org can see that org's reels
  IF is_viewer_driver AND reel_org_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM user_organizations
      WHERE user_id = auth.uid() AND organization_id = reel_org_id AND is_active = true
    ) THEN RETURN TRUE; END IF;
  END IF;

  RETURN FALSE;
END;
$$;

-- RLS policies for reels
CREATE POLICY "Users can view reels based on visibility rules"
  ON public.reels FOR SELECT TO authenticated
  USING (is_active = true AND public.can_view_reel(organization_id, user_id));

CREATE POLICY "Users can create their own reels"
  ON public.reels FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own reels"
  ON public.reels FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own reels"
  ON public.reels FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- RLS for reel_likes
CREATE POLICY "View likes on visible reels" ON public.reel_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can like reels" ON public.reel_likes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can unlike" ON public.reel_likes FOR DELETE TO authenticated USING (user_id = auth.uid());

-- RLS for reel_comments
CREATE POLICY "View comments on visible reels" ON public.reel_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can comment" ON public.reel_comments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own comments" ON public.reel_comments FOR DELETE TO authenticated USING (user_id = auth.uid());

-- RLS for reel_bookmarks
CREATE POLICY "View own bookmarks" ON public.reel_bookmarks FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can bookmark" ON public.reel_bookmarks FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can remove bookmark" ON public.reel_bookmarks FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.reels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reel_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reel_comments;
