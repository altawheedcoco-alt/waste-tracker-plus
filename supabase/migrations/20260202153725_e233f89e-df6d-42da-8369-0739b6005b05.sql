-- Create table for external partners (clients not registered in the system)
CREATE TABLE public.external_partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  partner_type TEXT NOT NULL CHECK (partner_type IN ('generator', 'recycler', 'transporter')),
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  tax_number TEXT,
  commercial_register TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.external_partners ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their organization external partners"
ON public.external_partners
FOR SELECT
USING (organization_id = get_user_org_id_safe(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can create external partners for their organization"
ON public.external_partners
FOR INSERT
WITH CHECK (organization_id = get_user_org_id_safe(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update their organization external partners"
ON public.external_partners
FOR UPDATE
USING (organization_id = get_user_org_id_safe(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can delete their organization external partners"
ON public.external_partners
FOR DELETE
USING (organization_id = get_user_org_id_safe(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

-- Add index for faster queries
CREATE INDEX idx_external_partners_org_type ON public.external_partners(organization_id, partner_type);

-- Add trigger for updated_at
CREATE TRIGGER update_external_partners_updated_at
BEFORE UPDATE ON public.external_partners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();