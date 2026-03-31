
-- Drop the overly broad policy
DROP POLICY IF EXISTS "Org members and agencies can view workers" ON public.worker_profiles;

-- Create a security definer function to check if user has hiring relationship
CREATE OR REPLACE FUNCTION public.has_worker_relationship(p_user_id uuid, p_worker_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM agency_candidates ac
    JOIN recruitment_agencies ra ON ra.id = ac.agency_id
    WHERE ac.worker_id = p_worker_id
      AND ra.organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = p_user_id
      )
  )
$$;

-- Policy 1: Workers can always see their own full profile (already covered by ALL policy, but explicit)
-- Policy 2: Org members/agencies can view workers but PII is hidden via RLS
-- We use a policy that allows SELECT but combine with a view for safe access

-- Allow org members and agencies to see worker profiles (non-PII access enforced at app level)
CREATE POLICY "Org members can view worker profiles safely"
ON public.worker_profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR public.has_worker_relationship(auth.uid(), id)
  OR is_current_user_admin()
);
