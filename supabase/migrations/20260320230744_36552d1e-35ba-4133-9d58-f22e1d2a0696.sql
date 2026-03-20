
-- Drop existing function first then recreate
DROP FUNCTION IF EXISTS public.get_user_org_ids(uuid);
DROP FUNCTION IF EXISTS public.get_org_chain_ids(uuid);

-- Helper function to get user's org IDs (SECURITY DEFINER breaks RLS cycle)
CREATE FUNCTION public.get_user_org_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.profiles WHERE user_id = _user_id AND organization_id IS NOT NULL;
$$;

-- Helper function to get chain IDs for an org
CREATE FUNCTION public.get_org_chain_ids(_org_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.signing_chains WHERE initiated_org_id = _org_id;
$$;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view chains involving their org" ON public.signing_chains;
DROP POLICY IF EXISTS "Users can create chains for their org" ON public.signing_chains;
DROP POLICY IF EXISTS "Users can update chains they initiated" ON public.signing_chains;
DROP POLICY IF EXISTS "Users can view steps in their chains" ON public.signing_chain_steps;
DROP POLICY IF EXISTS "Users can insert steps in chains they own" ON public.signing_chain_steps;
DROP POLICY IF EXISTS "Signers can update their own steps" ON public.signing_chain_steps;

-- Recreate signing_chains policies (no cross-table reference)
CREATE POLICY "Users can view their org chains"
  ON public.signing_chains FOR SELECT TO authenticated
  USING (initiated_org_id IN (SELECT public.get_user_org_ids(auth.uid())));

CREATE POLICY "Users can create org chains"
  ON public.signing_chains FOR INSERT TO authenticated
  WITH CHECK (initiated_org_id IN (SELECT public.get_user_org_ids(auth.uid())));

CREATE POLICY "Users can update org chains"
  ON public.signing_chains FOR UPDATE TO authenticated
  USING (initiated_org_id IN (SELECT public.get_user_org_ids(auth.uid())));

-- Recreate signing_chain_steps policies (use helper functions)
CREATE POLICY "Users can view chain steps"
  ON public.signing_chain_steps FOR SELECT TO authenticated
  USING (
    signer_org_id IN (SELECT public.get_user_org_ids(auth.uid()))
    OR chain_id IN (SELECT public.get_org_chain_ids(org_id) FROM public.get_user_org_ids(auth.uid()) AS org_id)
  );

CREATE POLICY "Users can insert chain steps"
  ON public.signing_chain_steps FOR INSERT TO authenticated
  WITH CHECK (
    chain_id IN (SELECT public.get_org_chain_ids(org_id) FROM public.get_user_org_ids(auth.uid()) AS org_id)
  );

CREATE POLICY "Users can update chain steps"
  ON public.signing_chain_steps FOR UPDATE TO authenticated
  USING (
    signer_org_id IN (SELECT public.get_user_org_ids(auth.uid()))
    OR chain_id IN (SELECT public.get_org_chain_ids(org_id) FROM public.get_user_org_ids(auth.uid()) AS org_id)
  );
