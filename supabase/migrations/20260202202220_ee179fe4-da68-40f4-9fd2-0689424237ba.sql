-- Create enum for granular permission types
DO $$ BEGIN
  CREATE TYPE public.employee_permission_type AS ENUM (
    -- Deposits permissions
    'create_deposits',
    'view_deposits',
    'manage_deposits',
    
    -- Shipments permissions
    'create_shipments',
    'view_shipments',
    'manage_shipments',
    'cancel_shipments',
    
    -- Accounts permissions
    'view_accounts',
    'view_account_details',
    'export_accounts',
    
    -- Partners permissions
    'view_partners',
    'manage_partners',
    'create_external_partners',
    
    -- Reports permissions
    'view_reports',
    'create_reports',
    'export_reports',
    
    -- Drivers permissions
    'view_drivers',
    'manage_drivers',
    
    -- Settings permissions
    'view_settings',
    'manage_settings',
    
    -- Full access
    'full_access'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create employee_partner_access table for partner-specific access
CREATE TABLE IF NOT EXISTS public.employee_partner_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  partner_organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  external_partner_id UUID REFERENCES public.external_partners(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  CONSTRAINT chk_partner_type CHECK (
    (partner_organization_id IS NOT NULL AND external_partner_id IS NULL) OR
    (partner_organization_id IS NULL AND external_partner_id IS NOT NULL)
  ),
  UNIQUE(profile_id, partner_organization_id),
  UNIQUE(profile_id, external_partner_id)
);

-- Create employee_waste_access table for waste type specific access
CREATE TABLE IF NOT EXISTS public.employee_waste_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  waste_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  UNIQUE(profile_id, waste_type)
);

-- Add employee-specific fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS employee_type TEXT DEFAULT 'admin',
ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS invitation_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS access_all_partners BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS access_all_waste_types BOOLEAN DEFAULT true;

-- Enable RLS on new tables
ALTER TABLE public.employee_partner_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_waste_access ENABLE ROW LEVEL SECURITY;

-- RLS policies for employee_partner_access
CREATE POLICY "Company admins can manage partner access"
ON public.employee_partner_access
FOR ALL
USING (
  (organization_id = get_user_org_id_safe(auth.uid()) AND has_role(auth.uid(), 'company_admin'))
  OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can view own partner access"
ON public.employee_partner_access
FOR SELECT
USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- RLS policies for employee_waste_access
CREATE POLICY "Company admins can manage waste access"
ON public.employee_waste_access
FOR ALL
USING (
  (organization_id = get_user_org_id_safe(auth.uid()) AND has_role(auth.uid(), 'company_admin'))
  OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can view own waste access"
ON public.employee_waste_access
FOR SELECT
USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Function to check if employee has permission
CREATE OR REPLACE FUNCTION public.has_employee_permission(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.employee_permissions ep
    JOIN public.profiles p ON ep.profile_id = p.id
    WHERE p.user_id = _user_id
      AND (ep.permission_type = _permission OR ep.permission_type = 'full_access')
  )
$$;

-- Function to check if employee has access to partner
CREATE OR REPLACE FUNCTION public.has_partner_access(_user_id uuid, _partner_org_id uuid DEFAULT NULL, _external_partner_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = _user_id
      AND (
        p.access_all_partners = true
        OR EXISTS (
          SELECT 1 FROM public.employee_partner_access epa
          WHERE epa.profile_id = p.id
            AND (
              (_partner_org_id IS NOT NULL AND epa.partner_organization_id = _partner_org_id)
              OR (_external_partner_id IS NOT NULL AND epa.external_partner_id = _external_partner_id)
            )
        )
      )
  )
$$;

-- Function to check if employee has access to waste type
CREATE OR REPLACE FUNCTION public.has_waste_access(_user_id uuid, _waste_type text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = _user_id
      AND (
        p.access_all_waste_types = true
        OR EXISTS (
          SELECT 1 FROM public.employee_waste_access ewa
          WHERE ewa.profile_id = p.id
            AND ewa.waste_type = _waste_type
        )
      )
  )
$$;