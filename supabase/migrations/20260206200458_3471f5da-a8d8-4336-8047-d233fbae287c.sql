-- Fix remaining security issues

-- 1. Fix contract_verifications - require proper verification code
DROP POLICY IF EXISTS "Authenticated can log verifications" ON public.contract_verifications;

CREATE POLICY "Users can log verifications for accessible contracts"
ON public.contract_verifications FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.contracts c
    WHERE c.id = contract_id
    AND (
      public.can_access_contract(auth.uid(), c.id)
      OR public.has_role(auth.uid(), 'admin')
    )
  )
);

-- 2. Add proper policies for submission_rate_limits
-- This should only be accessible by service_role (edge functions)
-- No policies means no access for authenticated/anon which is correct
-- But we need at least a restrictive policy for the linter

CREATE POLICY "Rate limits not accessible to users"
ON public.submission_rate_limits FOR SELECT
TO authenticated
USING (false);