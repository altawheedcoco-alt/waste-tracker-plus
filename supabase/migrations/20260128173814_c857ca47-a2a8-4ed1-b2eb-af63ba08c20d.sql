-- Drop problematic policies on organizations
DROP POLICY IF EXISTS "Users can view related organizations through shipments" ON public.organizations;
DROP POLICY IF EXISTS "Organizations manageable by company admins" ON public.organizations;
DROP POLICY IF EXISTS "Admins can view all organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users can view own organization" ON public.organizations;
DROP POLICY IF EXISTS "Company admins can view generators and recyclers" ON public.organizations;
DROP POLICY IF EXISTS "Drivers can view generators and recyclers" ON public.organizations;
DROP POLICY IF EXISTS "Transporters can view generators and recyclers" ON public.organizations;

-- Drop problematic policies on chat_participants
DROP POLICY IF EXISTS "Users can add participants" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can view participants in their rooms" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can update their own participation" ON public.chat_participants;

-- Create safe function to get user organization without recursion
CREATE OR REPLACE FUNCTION public.get_user_org_id_safe(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- Recreate organizations policies without recursion
CREATE POLICY "Admins can view all organizations"
ON public.organizations FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own organization"
ON public.organizations FOR SELECT
USING (id = get_user_org_id_safe(auth.uid()));

CREATE POLICY "Users can update own organization"
ON public.organizations FOR UPDATE
USING (id = get_user_org_id_safe(auth.uid()) AND (has_role(auth.uid(), 'company_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role)));

CREATE POLICY "Admins can update all organizations"
ON public.organizations FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Verified orgs viewable by authenticated users"
ON public.organizations FOR SELECT
USING (is_verified = true AND auth.uid() IS NOT NULL);

-- Recreate chat_participants policies without recursion
CREATE POLICY "Users can view own participation"
ON public.chat_participants FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own participation"
ON public.chat_participants FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own participation"
ON public.chat_participants FOR UPDATE
USING (user_id = auth.uid());