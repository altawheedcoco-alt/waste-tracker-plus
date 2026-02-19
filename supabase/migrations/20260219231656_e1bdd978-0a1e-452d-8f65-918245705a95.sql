
-- Fix signature_audit_log SELECT policy (uses profiles.id instead of profiles.user_id)
DROP POLICY IF EXISTS "Org members can view audit log" ON public.signature_audit_log;
CREATE POLICY "Org members can view audit log"
  ON public.signature_audit_log FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Fix document_signatures INSERT policy to allow signing any document type (not just shipment-linked)
DROP POLICY IF EXISTS "Authenticated users can create signatures for their org" ON public.document_signatures;
CREATE POLICY "Authenticated users can create signatures for their org"
  ON public.document_signatures FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      -- User belongs to the org on the signature
      organization_id IN (
        SELECT organization_id FROM profiles WHERE user_id = auth.uid()
      )
      -- OR user is a partner org on the related shipment
      OR EXISTS (
        SELECT 1 FROM shipments s
        WHERE s.id = document_signatures.document_id
        AND (
          s.generator_id IN (SELECT organization_id FROM profiles WHERE user_id = auth.uid())
          OR s.transporter_id IN (SELECT organization_id FROM profiles WHERE user_id = auth.uid())
          OR s.recycler_id IN (SELECT organization_id FROM profiles WHERE user_id = auth.uid())
        )
      )
    )
  );

-- Expand document_signatures SELECT to allow partner orgs to see signatures on shared shipments
DROP POLICY IF EXISTS "Users can view signatures for their organization" ON public.document_signatures;
CREATE POLICY "Users can view signatures for their organization"
  ON public.document_signatures FOR SELECT
  USING (
    -- Own org signatures
    user_belongs_to_org(auth.uid(), organization_id)
    -- Partner org can see signatures on shared shipments
    OR EXISTS (
      SELECT 1 FROM shipments s
      WHERE s.id = document_signatures.document_id
      AND (
        s.generator_id IN (SELECT organization_id FROM profiles WHERE user_id = auth.uid())
        OR s.transporter_id IN (SELECT organization_id FROM profiles WHERE user_id = auth.uid())
        OR s.recycler_id IN (SELECT organization_id FROM profiles WHERE user_id = auth.uid())
      )
    )
    -- Admin access
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Add UPDATE policy for document_signatures (needed for status changes)
DROP POLICY IF EXISTS "Users can update their own signatures" ON public.document_signatures;
CREATE POLICY "Users can update their own signatures"
  ON public.document_signatures FOR UPDATE
  USING (
    signed_by = auth.uid()
    OR organization_id IN (SELECT organization_id FROM profiles WHERE user_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Fix signing_requests: ensure partner orgs can also see requests sent TO them
-- Already exists but let's ensure DELETE policy exists for cleanup
DROP POLICY IF EXISTS "Users can delete their signing requests" ON public.signing_requests;
CREATE POLICY "Users can delete their signing requests"
  ON public.signing_requests FOR DELETE
  USING (
    sender_organization_id IN (SELECT organization_id FROM profiles WHERE user_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Ensure storage policies allow signature uploads for all authenticated users
DO $$
BEGIN
  -- Allow authenticated uploads to organization-stamps bucket
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND policyname = 'Allow authenticated signature uploads'
  ) THEN
    CREATE POLICY "Allow authenticated signature uploads"
      ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id = 'organization-stamps'
        AND auth.uid() IS NOT NULL
      );
  END IF;

  -- Allow authenticated users to update their uploads  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND policyname = 'Allow authenticated signature updates'
  ) THEN
    CREATE POLICY "Allow authenticated signature updates"
      ON storage.objects FOR UPDATE
      USING (
        bucket_id = 'organization-stamps'
        AND auth.uid() IS NOT NULL
      );
  END IF;
END $$;
