-- Create employee invitations table
CREATE TABLE public.employee_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  employee_type TEXT NOT NULL DEFAULT 'employee',
  permissions TEXT[] DEFAULT '{}',
  access_all_partners BOOLEAN DEFAULT true,
  access_all_waste_types BOOLEAN DEFAULT true,
  partner_ids UUID[] DEFAULT '{}',
  external_partner_ids UUID[] DEFAULT '{}',
  waste_types TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  accepted_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employee_invitations ENABLE ROW LEVEL SECURITY;

-- Index for fast token lookup
CREATE INDEX idx_employee_invitations_token ON public.employee_invitations(token);
CREATE INDEX idx_employee_invitations_org ON public.employee_invitations(organization_id);
CREATE INDEX idx_employee_invitations_email ON public.employee_invitations(email);
CREATE INDEX idx_employee_invitations_status ON public.employee_invitations(status);

-- RLS Policies
CREATE POLICY "Users can view invitations from their organization"
ON public.employee_invitations
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can create invitations"
ON public.employee_invitations
FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'company_admin')
  )
);

CREATE POLICY "Admins can update invitations"
ON public.employee_invitations
FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'company_admin')
  )
);

-- Function to generate secure invitation token
CREATE OR REPLACE FUNCTION public.generate_invitation_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$;

-- Trigger to update updated_at
CREATE TRIGGER update_employee_invitations_updated_at
BEFORE UPDATE ON public.employee_invitations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();