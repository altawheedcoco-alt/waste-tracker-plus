-- Create user_organizations table to link users to multiple organizations
CREATE TABLE public.user_organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role_in_organization TEXT NOT NULL DEFAULT 'admin', -- admin, employee, viewer
  is_primary BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, organization_id)
);

-- Enable RLS
ALTER TABLE public.user_organizations ENABLE ROW LEVEL SECURITY;

-- Create index for faster lookups
CREATE INDEX idx_user_organizations_user_id ON public.user_organizations(user_id);
CREATE INDEX idx_user_organizations_organization_id ON public.user_organizations(organization_id);

-- RLS Policies
-- Users can view their own organization memberships
CREATE POLICY "Users can view their own organization memberships"
  ON public.user_organizations
  FOR SELECT
  USING (user_id = auth.uid());

-- Admins can view all organization memberships
CREATE POLICY "Admins can view all organization memberships"
  ON public.user_organizations
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Company admins can manage memberships for their organizations
CREATE POLICY "Company admins can insert memberships"
  ON public.user_organizations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_organizations uo
      WHERE uo.organization_id = user_organizations.organization_id
      AND uo.user_id = auth.uid()
      AND uo.role_in_organization = 'admin'
    )
    OR has_role(auth.uid(), 'admin')
  );

-- Users can update their own active organization
CREATE POLICY "Users can update their own memberships"
  ON public.user_organizations
  FOR UPDATE
  USING (user_id = auth.uid());

-- Create trigger for updated_at
CREATE TRIGGER update_user_organizations_updated_at
  BEFORE UPDATE ON public.user_organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add active_organization_id to profiles to track current selection
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS active_organization_id UUID REFERENCES public.organizations(id);

-- Migrate existing data: create user_organizations entries from current profiles
INSERT INTO public.user_organizations (user_id, organization_id, role_in_organization, is_primary, is_active)
SELECT 
  p.user_id, 
  p.organization_id, 
  CASE 
    WHEN EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = p.user_id AND ur.role = 'company_admin') THEN 'admin'
    WHEN EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = p.user_id AND ur.role = 'employee') THEN 'employee'
    ELSE 'viewer'
  END,
  true,
  true
FROM public.profiles p
WHERE p.organization_id IS NOT NULL
ON CONFLICT (user_id, organization_id) DO NOTHING;

-- Update active_organization_id to current organization_id for existing users
UPDATE public.profiles 
SET active_organization_id = organization_id 
WHERE organization_id IS NOT NULL AND active_organization_id IS NULL;

-- Function to get user's organizations
CREATE OR REPLACE FUNCTION public.get_user_organizations(_user_id uuid)
RETURNS TABLE (
  organization_id uuid,
  organization_name text,
  organization_type text,
  role_in_organization text,
  is_primary boolean,
  is_active boolean,
  is_verified boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    o.id as organization_id,
    o.name as organization_name,
    o.organization_type::text,
    uo.role_in_organization,
    uo.is_primary,
    uo.is_active,
    o.is_verified
  FROM public.user_organizations uo
  JOIN public.organizations o ON o.id = uo.organization_id
  WHERE uo.user_id = _user_id AND uo.is_active = true
  ORDER BY uo.is_primary DESC, o.name ASC;
$$;

-- Function to switch active organization
CREATE OR REPLACE FUNCTION public.switch_organization(_user_id uuid, _organization_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify user has access to this organization
  IF NOT EXISTS (
    SELECT 1 FROM public.user_organizations
    WHERE user_id = _user_id AND organization_id = _organization_id AND is_active = true
  ) THEN
    RETURN false;
  END IF;
  
  -- Update active_organization_id in profiles
  UPDATE public.profiles
  SET 
    active_organization_id = _organization_id,
    organization_id = _organization_id,
    updated_at = now()
  WHERE user_id = _user_id;
  
  RETURN true;
END;
$$;