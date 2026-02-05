-- Create organization deposit links table for shareable quick deposit links
CREATE TABLE IF NOT EXISTS public.organization_deposit_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  token VARCHAR(32) NOT NULL UNIQUE,
  title VARCHAR(255),
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  
  CONSTRAINT unique_org_token UNIQUE (organization_id, token)
);

-- Create index for fast token lookups
CREATE INDEX idx_deposit_links_token ON public.organization_deposit_links(token);
CREATE INDEX idx_deposit_links_org ON public.organization_deposit_links(organization_id);

-- Enable RLS
ALTER TABLE public.organization_deposit_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies for deposit links - organization members can manage
CREATE POLICY "Organization members can view their deposit links"
  ON public.organization_deposit_links
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can create deposit links"
  ON public.organization_deposit_links
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can update their deposit links"
  ON public.organization_deposit_links
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can delete their deposit links"
  ON public.organization_deposit_links
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Allow anonymous public read for active links (needed for the public deposit page)
CREATE POLICY "Public can view active deposit links by token"
  ON public.organization_deposit_links
  FOR SELECT
  TO anon
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Update deposits table to allow public submissions via link
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS deposit_link_id UUID REFERENCES public.organization_deposit_links(id);
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS submitter_name VARCHAR(255);
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS submitter_phone VARCHAR(50);
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS submitter_email VARCHAR(255);
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS is_public_submission BOOLEAN DEFAULT false;

-- Allow anonymous public inserts for deposits via valid deposit links
CREATE POLICY "Public can submit deposits via valid links"
  ON public.deposits
  FOR INSERT
  TO anon
  WITH CHECK (
    is_public_submission = true 
    AND deposit_link_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.organization_deposit_links 
      WHERE id = deposit_link_id 
      AND is_active = true 
      AND (expires_at IS NULL OR expires_at > now())
    )
  );