
-- Add location and business profile fields to organizations
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS location_url TEXT,
ADD COLUMN IF NOT EXISTS address_details TEXT,
ADD COLUMN IF NOT EXISTS location_description TEXT,
ADD COLUMN IF NOT EXISTS working_hours JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_location_public BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS location_lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS location_lng DOUBLE PRECISION;

-- Create organization_photos table
CREATE TABLE IF NOT EXISTS public.organization_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  is_public BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.organization_photos ENABLE ROW LEVEL SECURITY;

-- RLS: Members can view their own org photos
CREATE POLICY "Members can view own org photos"
ON public.organization_photos FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid()
  )
);

-- RLS: Public photos visible to all authenticated users
CREATE POLICY "Public photos visible to authenticated users"
ON public.organization_photos FOR SELECT
USING (is_public = true AND auth.uid() IS NOT NULL);

-- RLS: Company admins can insert
CREATE POLICY "Admins can insert org photos"
ON public.organization_photos FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT uo.organization_id FROM public.user_organizations uo
    JOIN public.user_roles ur ON ur.user_id = uo.user_id
    WHERE uo.user_id = auth.uid() AND ur.role IN ('company_admin', 'admin')
  )
);

-- RLS: Company admins can update
CREATE POLICY "Admins can update org photos"
ON public.organization_photos FOR UPDATE
USING (
  organization_id IN (
    SELECT uo.organization_id FROM public.user_organizations uo
    JOIN public.user_roles ur ON ur.user_id = uo.user_id
    WHERE uo.user_id = auth.uid() AND ur.role IN ('company_admin', 'admin')
  )
);

-- RLS: Company admins can delete
CREATE POLICY "Admins can delete org photos"
ON public.organization_photos FOR DELETE
USING (
  organization_id IN (
    SELECT uo.organization_id FROM public.user_organizations uo
    JOIN public.user_roles ur ON ur.user_id = uo.user_id
    WHERE uo.user_id = auth.uid() AND ur.role IN ('company_admin', 'admin')
  )
);
