-- Drop the recursive policy and replace with a security definer function approach
DROP POLICY IF EXISTS "Regulators can view all organizations" ON public.organizations;

-- Create a security definer function to check if user belongs to a regulator org
CREATE OR REPLACE FUNCTION public.is_regulator_user(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.organizations o ON o.id = p.organization_id
    WHERE p.id = p_user_id
    AND o.organization_type = 'regulator'
  )
$$;

-- Recreate the policy using the security definer function
CREATE POLICY "Regulators can view all organizations"
ON public.organizations
FOR SELECT
TO authenticated
USING (
  public.is_regulator_user(auth.uid())
);

-- Also update the shipments policy to use the same function
DROP POLICY IF EXISTS "Regulators can view all shipments" ON public.shipments;
CREATE POLICY "Regulators can view all shipments"
ON public.shipments
FOR SELECT
TO authenticated
USING (
  public.is_regulator_user(auth.uid())
);