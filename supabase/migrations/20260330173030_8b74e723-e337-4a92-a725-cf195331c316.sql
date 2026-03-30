
-- Make shipment-documents bucket private
UPDATE storage.buckets SET public = false WHERE id = 'shipment-documents';

-- Replace the public read policy with an org-scoped one
DROP POLICY IF EXISTS "Public read access for shipment docs" ON storage.objects;
CREATE POLICY "Org members read shipment docs" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'shipment-documents'
  AND (
    (storage.foldername(name))[1] = get_user_org_id_safe(auth.uid())::text
    OR is_current_user_admin()
  )
);
