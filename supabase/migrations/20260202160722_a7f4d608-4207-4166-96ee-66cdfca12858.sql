-- Create table to store partner waste type preferences
CREATE TABLE public.partner_waste_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  partner_organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  external_partner_id UUID REFERENCES public.external_partners(id) ON DELETE CASCADE,
  waste_type TEXT NOT NULL,
  waste_code TEXT,
  price_per_unit NUMERIC DEFAULT 0,
  unit TEXT DEFAULT 'كجم',
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Either partner_organization_id or external_partner_id must be set
  CONSTRAINT partner_waste_types_partner_check CHECK (
    (partner_organization_id IS NOT NULL AND external_partner_id IS NULL) OR
    (partner_organization_id IS NULL AND external_partner_id IS NOT NULL)
  )
);

-- Create unique constraint to prevent duplicate waste types per partner
CREATE UNIQUE INDEX partner_waste_types_unique ON public.partner_waste_types (
  organization_id, 
  COALESCE(partner_organization_id, '00000000-0000-0000-0000-000000000000'::uuid),
  COALESCE(external_partner_id, '00000000-0000-0000-0000-000000000000'::uuid),
  waste_type
);

-- Enable RLS
ALTER TABLE public.partner_waste_types ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their organization partner waste types"
ON public.partner_waste_types FOR SELECT
USING (
  organization_id = get_user_org_id_safe(auth.uid()) OR
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users can create partner waste types for their organization"
ON public.partner_waste_types FOR INSERT
WITH CHECK (
  organization_id = get_user_org_id_safe(auth.uid()) OR
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users can update their organization partner waste types"
ON public.partner_waste_types FOR UPDATE
USING (
  organization_id = get_user_org_id_safe(auth.uid()) OR
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users can delete their organization partner waste types"
ON public.partner_waste_types FOR DELETE
USING (
  organization_id = get_user_org_id_safe(auth.uid()) OR
  has_role(auth.uid(), 'admin'::app_role)
);

-- Trigger for updated_at
CREATE TRIGGER update_partner_waste_types_updated_at
BEFORE UPDATE ON public.partner_waste_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();