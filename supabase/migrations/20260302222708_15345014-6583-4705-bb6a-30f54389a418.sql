
-- Drop existing policies
DROP POLICY IF EXISTS "Org members can manage their public profile" ON public.org_public_profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by share code" ON public.org_public_profiles;

-- Create a security definer function to check org membership
CREATE OR REPLACE FUNCTION public.is_org_member(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND organization_id = _org_id
  )
  OR EXISTS (
    SELECT 1 FROM public.organization_members om
    JOIN public.profiles p ON p.id = om.profile_id
    WHERE p.user_id = _user_id AND om.organization_id = _org_id AND om.status = 'active'
  );
$$;

-- Recreate policies using the function
CREATE POLICY "Org members can manage their public profile"
ON public.org_public_profiles
FOR ALL
TO authenticated
USING (public.is_org_member(auth.uid(), organization_id))
WITH CHECK (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Public profiles are viewable by share code"
ON public.org_public_profiles
FOR SELECT
USING (is_active = true);
