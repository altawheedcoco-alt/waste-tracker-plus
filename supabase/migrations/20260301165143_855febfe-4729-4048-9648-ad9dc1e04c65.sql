
-- ==============================================
-- Universal Smart Sharing System - Phase 1
-- ==============================================

-- 1. shared_links table
CREATE TABLE public.shared_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) UNIQUE NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES public.organizations(id),
  
  -- Access settings
  visibility_level VARCHAR(20) DEFAULT 'public' CHECK (visibility_level IN ('public', 'authenticated', 'linked_only')),
  allowed_fields JSONB DEFAULT '[]'::jsonb,
  
  -- Optional protection
  requires_pin BOOLEAN DEFAULT false,
  pin_hash TEXT,
  
  -- Validity
  expires_at TIMESTAMPTZ,
  max_views INTEGER,
  view_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  title VARCHAR(200),
  description TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. shared_link_views table (analytics)
CREATE TABLE public.shared_link_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_link_id UUID REFERENCES public.shared_links(id) ON DELETE CASCADE,
  viewer_user_id UUID,
  viewer_ip VARCHAR(50),
  viewer_device VARCHAR(200),
  viewed_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Indexes
CREATE UNIQUE INDEX idx_shared_links_code ON public.shared_links(code);
CREATE INDEX idx_shared_links_resource ON public.shared_links(resource_type, resource_id);
CREATE INDEX idx_shared_links_creator ON public.shared_links(created_by);
CREATE INDEX idx_shared_link_views_link ON public.shared_link_views(shared_link_id);

-- 4. Enable RLS
ALTER TABLE public.shared_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_link_views ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for shared_links

-- Creator can do everything
CREATE POLICY "Creator full access on shared_links"
ON public.shared_links
FOR ALL
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

-- Org members can view their org's links
CREATE POLICY "Org members can view org shared links"
ON public.shared_links
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- 6. RLS Policies for shared_link_views

-- Creator of the link can view analytics
CREATE POLICY "Link creator can view analytics"
ON public.shared_link_views
FOR SELECT
USING (
  shared_link_id IN (
    SELECT id FROM public.shared_links WHERE created_by = auth.uid()
  )
);

-- Anyone can insert views (tracked by edge function)
CREATE POLICY "Anyone can insert views"
ON public.shared_link_views
FOR INSERT
WITH CHECK (true);

-- 7. Updated_at trigger
CREATE TRIGGER update_shared_links_updated_at
BEFORE UPDATE ON public.shared_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
