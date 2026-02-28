
-- Fix critical RLS bug: cds_select policy has self-referencing condition (always true)
DROP POLICY IF EXISTS "cds_select" ON public.consultant_document_signatures;

CREATE POLICY "cds_select" ON public.consultant_document_signatures
FOR SELECT USING (
  -- Consultant who signed
  (EXISTS (
    SELECT 1 FROM environmental_consultants ec
    WHERE ec.id = consultant_document_signatures.consultant_id
    AND ec.user_id = auth.uid()
  ))
  OR
  -- Organization member where the signature belongs
  (organization_id = get_user_org_id_safe(auth.uid()))
  OR
  -- Office director can see office signatures
  (office_id IN (
    SELECT co.id FROM consulting_offices co
    WHERE co.director_user_id = auth.uid()
  ))
);
