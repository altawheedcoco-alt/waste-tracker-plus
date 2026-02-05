-- Create organization_shipment_links table for quick shipment creation
CREATE TABLE IF NOT EXISTS public.organization_shipment_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  title TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  
  -- Preset fields
  preset_generator_id UUID REFERENCES public.organizations(id),
  preset_generator_external_id UUID REFERENCES public.external_partners(id),
  preset_recycler_id UUID REFERENCES public.organizations(id),
  preset_recycler_external_id UUID REFERENCES public.external_partners(id),
  preset_waste_type TEXT,
  preset_waste_category TEXT,
  preset_pickup_location JSONB,
  preset_delivery_location JSONB,
  preset_notes TEXT,
  
  -- Permissions
  allow_weight_edit BOOLEAN DEFAULT true,
  allow_date_edit BOOLEAN DEFAULT true,
  allow_generator_edit BOOLEAN DEFAULT false,
  allow_recycler_edit BOOLEAN DEFAULT false,
  allow_location_edit BOOLEAN DEFAULT true,
  require_photo BOOLEAN DEFAULT false
);

-- Add index for token lookup
CREATE INDEX IF NOT EXISTS idx_shipment_links_token ON public.organization_shipment_links(token);
CREATE INDEX IF NOT EXISTS idx_shipment_links_org ON public.organization_shipment_links(organization_id);

-- Add shipment_link_id to shipments table
ALTER TABLE public.shipments
ADD COLUMN IF NOT EXISTS shipment_link_id UUID REFERENCES public.organization_shipment_links(id),
ADD COLUMN IF NOT EXISTS is_public_submission BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS submitter_name TEXT,
ADD COLUMN IF NOT EXISTS submitter_phone TEXT;

-- Enable RLS
ALTER TABLE public.organization_shipment_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organization_shipment_links
CREATE POLICY "Organizations can manage their own shipment links"
ON public.organization_shipment_links
FOR ALL
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Allow public read for active links by token (for public submission page)
CREATE POLICY "Public can read active shipment links by token"
ON public.organization_shipment_links
FOR SELECT
USING (is_active = true);

-- Allow anonymous insert to shipments via valid link
CREATE POLICY "Anonymous can create shipments via valid link"
ON public.shipments
FOR INSERT
WITH CHECK (
  shipment_link_id IS NOT NULL 
  AND is_public_submission = true
  AND EXISTS (
    SELECT 1 FROM public.organization_shipment_links 
    WHERE id = shipment_link_id 
    AND is_active = true 
    AND (expires_at IS NULL OR expires_at > now())
  )
);

COMMENT ON TABLE public.organization_shipment_links IS 'Shareable links for quick shipment creation with preset data';