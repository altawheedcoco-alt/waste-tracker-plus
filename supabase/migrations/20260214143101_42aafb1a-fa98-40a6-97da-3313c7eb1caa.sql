-- Fix 1: Update document_signatures INSERT policy
DROP POLICY IF EXISTS "Authorized users can create signatures" ON public.document_signatures;

CREATE POLICY "Authenticated users can create signatures for their org"
ON public.document_signatures
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM shipment_documents sd
    JOIN shipments s ON s.id = sd.shipment_id
    WHERE sd.id = document_id
    AND (
      s.generator_id IN (SELECT organization_id FROM profiles WHERE user_id = auth.uid())
      OR s.transporter_id IN (SELECT organization_id FROM profiles WHERE user_id = auth.uid())
      OR s.recycler_id IN (SELECT organization_id FROM profiles WHERE user_id = auth.uid())
    )
  )
);

-- Fix 2: Update storage policy for organization-stamps to allow signatures subfolder
DROP POLICY IF EXISTS "Organizations can upload their stamps" ON storage.objects;

CREATE POLICY "Organizations can upload stamps and signatures"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'organization-stamps'
  AND (
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM organizations WHERE id IN (
        SELECT organization_id FROM profiles WHERE user_id = auth.uid()
      )
    )
    OR
    (
      (storage.foldername(name))[1] = 'signatures'
      AND (storage.foldername(name))[2] IN (
        SELECT id::text FROM organizations WHERE id IN (
          SELECT organization_id FROM profiles WHERE user_id = auth.uid()
        )
      )
    )
  )
);

-- Fix 3: Ensure SELECT policy exists for viewing
DROP POLICY IF EXISTS "Anyone can view stamps" ON storage.objects;
CREATE POLICY "Anyone can view org stamps and signatures"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'organization-stamps');