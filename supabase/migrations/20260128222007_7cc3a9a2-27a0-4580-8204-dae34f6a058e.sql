-- Add position/department field to profiles for employee specialization
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS position text,
ADD COLUMN IF NOT EXISTS department text;

-- Create employee permissions table for granular access control
CREATE TABLE IF NOT EXISTS public.employee_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  permission_type text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(profile_id, permission_type)
);

-- Enable RLS
ALTER TABLE public.employee_permissions ENABLE ROW LEVEL SECURITY;

-- Company admins can manage permissions for their organization's employees
CREATE POLICY "Company admins can view org permissions"
ON public.employee_permissions
FOR SELECT
USING (
  profile_id IN (
    SELECT id FROM profiles WHERE organization_id = get_user_org_id_safe(auth.uid())
  )
  AND (has_role(auth.uid(), 'company_admin') OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Company admins can insert org permissions"
ON public.employee_permissions
FOR INSERT
WITH CHECK (
  profile_id IN (
    SELECT id FROM profiles WHERE organization_id = get_user_org_id_safe(auth.uid())
  )
  AND (has_role(auth.uid(), 'company_admin') OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Company admins can delete org permissions"
ON public.employee_permissions
FOR DELETE
USING (
  profile_id IN (
    SELECT id FROM profiles WHERE organization_id = get_user_org_id_safe(auth.uid())
  )
  AND (has_role(auth.uid(), 'company_admin') OR has_role(auth.uid(), 'admin'))
);

-- Allow admins to manage all employee permissions
CREATE POLICY "Admins can manage all permissions"
ON public.employee_permissions
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Policy for company admins to view employees in their organization
CREATE POLICY "Company admins can view org profiles"
ON public.profiles
FOR SELECT
USING (
  organization_id = get_user_org_id_safe(auth.uid())
  AND has_role(auth.uid(), 'company_admin')
);

-- Policy for company admins to update employees in their organization
CREATE POLICY "Company admins can update org profiles"
ON public.profiles
FOR UPDATE
USING (
  organization_id = get_user_org_id_safe(auth.uid())
  AND has_role(auth.uid(), 'company_admin')
  AND user_id != auth.uid()
);