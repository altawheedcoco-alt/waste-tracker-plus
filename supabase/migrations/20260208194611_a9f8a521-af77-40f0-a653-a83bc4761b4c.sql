-- Fix the permissive RLS policy for disposal_certificates
DROP POLICY IF EXISTS "Disposal facilities can insert certificates" ON public.disposal_certificates;
CREATE POLICY "Disposal facilities can insert certificates"
ON public.disposal_certificates FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.disposal_facilities df
    WHERE df.id = disposal_facility_id
    AND df.organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  )
);