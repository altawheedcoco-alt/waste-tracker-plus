-- Create organization_posts table for social-like posts
CREATE TABLE public.organization_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  content TEXT,
  media_urls JSONB DEFAULT '[]'::jsonb,
  post_type TEXT NOT NULL DEFAULT 'text' CHECK (post_type IN ('text', 'image', 'video', 'gallery')),
  is_pinned BOOLEAN DEFAULT false,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.organization_posts ENABLE ROW LEVEL SECURITY;

-- Create trigger for updated_at
CREATE TRIGGER update_organization_posts_updated_at
  BEFORE UPDATE ON public.organization_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Policy: Organization members can create posts for their org
CREATE POLICY "Organization members can create posts"
  ON public.organization_posts
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Policy: Organization members can update their org's posts
CREATE POLICY "Organization members can update their posts"
  ON public.organization_posts
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Policy: Organization members can delete their org's posts
CREATE POLICY "Organization members can delete their posts"
  ON public.organization_posts
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Policy: Partners and admins can view posts
-- Partners are orgs that have shipments together
CREATE POLICY "Partners and admins can view posts"
  ON public.organization_posts
  FOR SELECT
  USING (
    -- Admins can see all
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
    OR
    -- Own organization's posts
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
    )
    OR
    -- Partner organizations (have shipments together)
    organization_id IN (
      SELECT DISTINCT 
        CASE 
          WHEN s.generator_id = my_org.organization_id THEN s.transporter_id
          WHEN s.generator_id = my_org.organization_id THEN s.recycler_id
          WHEN s.transporter_id = my_org.organization_id THEN s.generator_id
          WHEN s.transporter_id = my_org.organization_id THEN s.recycler_id
          WHEN s.recycler_id = my_org.organization_id THEN s.generator_id
          WHEN s.recycler_id = my_org.organization_id THEN s.transporter_id
        END as partner_id
      FROM public.shipments s
      CROSS JOIN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()) my_org
      WHERE s.generator_id = my_org.organization_id
         OR s.transporter_id = my_org.organization_id
         OR s.recycler_id = my_org.organization_id
    )
  );

-- Create storage bucket for post media
INSERT INTO storage.buckets (id, name, public) 
VALUES ('organization-posts', 'organization-posts', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: Anyone can view public post media
CREATE POLICY "Public can view post media"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'organization-posts');

-- Storage policy: Organization members can upload media
CREATE POLICY "Organization members can upload post media"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'organization-posts' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.organizations 
      WHERE id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
    )
  );

-- Storage policy: Organization members can delete their media
CREATE POLICY "Organization members can delete post media"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'organization-posts' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.organizations 
      WHERE id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
    )
  );

-- Add index for faster queries
CREATE INDEX idx_organization_posts_org_id ON public.organization_posts(organization_id);
CREATE INDEX idx_organization_posts_created_at ON public.organization_posts(created_at DESC);