-- Create partner visibility settings table
CREATE TABLE public.partner_visibility_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  partner_organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  can_view_maps BOOLEAN NOT NULL DEFAULT true,
  can_view_tracking BOOLEAN NOT NULL DEFAULT true,
  can_view_routes BOOLEAN NOT NULL DEFAULT true,
  can_view_driver_location BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  UNIQUE(organization_id, partner_organization_id)
);

-- Enable RLS
ALTER TABLE public.partner_visibility_settings ENABLE ROW LEVEL SECURITY;

-- Users can view settings for their organization
CREATE POLICY "Users can view their organization visibility settings"
ON public.partner_visibility_settings
FOR SELECT
USING (
  organization_id = get_user_org_id_safe(auth.uid()) 
  OR partner_organization_id = get_user_org_id_safe(auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Only organization admins can create settings
CREATE POLICY "Company admins can create visibility settings"
ON public.partner_visibility_settings
FOR INSERT
WITH CHECK (
  organization_id = get_user_org_id_safe(auth.uid()) 
  AND has_role(auth.uid(), 'company_admin'::app_role)
);

-- Only organization admins can update settings
CREATE POLICY "Company admins can update visibility settings"
ON public.partner_visibility_settings
FOR UPDATE
USING (
  organization_id = get_user_org_id_safe(auth.uid()) 
  AND has_role(auth.uid(), 'company_admin'::app_role)
);

-- Only organization admins can delete settings
CREATE POLICY "Company admins can delete visibility settings"
ON public.partner_visibility_settings
FOR DELETE
USING (
  organization_id = get_user_org_id_safe(auth.uid()) 
  AND has_role(auth.uid(), 'company_admin'::app_role)
);

-- Add index for faster lookups
CREATE INDEX idx_partner_visibility_org ON public.partner_visibility_settings(organization_id);
CREATE INDEX idx_partner_visibility_partner ON public.partner_visibility_settings(partner_organization_id);

-- Trigger for updated_at
CREATE TRIGGER update_partner_visibility_settings_updated_at
BEFORE UPDATE ON public.partner_visibility_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();