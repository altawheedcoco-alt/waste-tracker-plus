
-- Add social profile columns to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS cover_url text,
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS profile_visibility text DEFAULT 'org_and_partners';

-- Member posts table
CREATE TABLE IF NOT EXISTS public.member_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  content text NOT NULL,
  media_urls text[] DEFAULT '{}',
  post_type text DEFAULT 'text',
  visibility text DEFAULT 'org_and_partners',
  likes_count integer DEFAULT 0,
  is_pinned boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.member_posts ENABLE ROW LEVEL SECURITY;

-- RLS: Author can manage own posts
CREATE POLICY "Authors manage own posts" ON public.member_posts
  FOR ALL TO authenticated
  USING (author_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- RLS: Org members and partners can view posts
CREATE POLICY "Org members and partners view posts" ON public.member_posts
  FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
      UNION
      SELECT partner_organization_id FROM public.partner_links 
        WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()) 
        AND status = 'active'
      UNION
      SELECT organization_id FROM public.partner_links 
        WHERE partner_organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()) 
        AND status = 'active'
    )
  );

-- Member reviews/ratings table
CREATE TABLE IF NOT EXISTS public.member_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewer_organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  review_category text DEFAULT 'general',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(member_id, reviewer_id)
);

ALTER TABLE public.member_reviews ENABLE ROW LEVEL SECURITY;

-- RLS: Reviewers manage own reviews
CREATE POLICY "Reviewers manage own reviews" ON public.member_reviews
  FOR ALL TO authenticated
  USING (reviewer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- RLS: Member and org members can view reviews
CREATE POLICY "View reviews" ON public.member_reviews
  FOR SELECT TO authenticated
  USING (
    member_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR reviewer_organization_id IN (
      SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
    )
    OR member_id IN (
      SELECT id FROM public.profiles WHERE organization_id IN (
        SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
        UNION
        SELECT partner_organization_id FROM public.partner_links 
          WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()) AND status = 'active'
        UNION
        SELECT organization_id FROM public.partner_links 
          WHERE partner_organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()) AND status = 'active'
      )
    )
  );

-- Post likes table
CREATE TABLE IF NOT EXISTS public.member_post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.member_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.member_post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own likes" ON public.member_post_likes
  FOR ALL TO authenticated USING (user_id = auth.uid());

CREATE POLICY "View likes" ON public.member_post_likes
  FOR SELECT TO authenticated USING (true);
