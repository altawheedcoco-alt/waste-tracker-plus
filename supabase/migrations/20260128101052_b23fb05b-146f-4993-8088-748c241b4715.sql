-- Fix remaining security issues with stricter RLS policies

-- 1. Update organizations policy to only allow viewing by related parties (not all authenticated users)
DROP POLICY IF EXISTS "Organizations viewable by authenticated users" ON public.organizations;
DROP POLICY IF EXISTS "Organizations viewable by authenticated users only" ON public.organizations;

-- Allow viewing own organization
CREATE POLICY "Users can view own organization"
ON public.organizations FOR SELECT
USING (id = get_user_organization_id(auth.uid()));

-- Allow viewing organizations related through shipments (generator, transporter, recycler relationships)
CREATE POLICY "Users can view related organizations through shipments"
ON public.organizations FOR SELECT
USING (
  id IN (
    SELECT generator_id FROM shipments WHERE transporter_id = get_user_organization_id(auth.uid()) OR recycler_id = get_user_organization_id(auth.uid())
    UNION
    SELECT transporter_id FROM shipments WHERE generator_id = get_user_organization_id(auth.uid()) OR recycler_id = get_user_organization_id(auth.uid())
    UNION
    SELECT recycler_id FROM shipments WHERE generator_id = get_user_organization_id(auth.uid()) OR transporter_id = get_user_organization_id(auth.uid())
  )
);

-- Allow admins to view all organizations
CREATE POLICY "Admins can view all organizations"
ON public.organizations FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- 2. Update drivers policy to only allow company_admin or admin to view driver details (license info)
DROP POLICY IF EXISTS "Drivers viewable by same organization" ON public.drivers;
DROP POLICY IF EXISTS "Drivers require authentication" ON public.drivers;

-- Only company admins and admins can view drivers
CREATE POLICY "Drivers viewable by authorized personnel only"
ON public.drivers FOR SELECT
USING (
  (organization_id = get_user_organization_id(auth.uid()) AND has_role(auth.uid(), 'company_admin'))
  OR has_role(auth.uid(), 'admin')
);

-- 3. Remove the overly permissive profiles policy we just added
DROP POLICY IF EXISTS "Profiles require authentication" ON public.profiles;