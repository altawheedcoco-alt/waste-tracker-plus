
-- Fix qr_scan_logs: use correct column name
DROP POLICY IF EXISTS "Authenticated can insert scan logs" ON public.qr_scan_logs;
CREATE POLICY "Authenticated can insert scan logs"
ON public.qr_scan_logs FOR INSERT
TO authenticated
WITH CHECK (
  scanner_user_id = auth.uid()
  OR scanner_user_id IS NULL
);

-- Fix storage policies that weren't applied due to the error above

-- Remove overly broad public SELECT on sensitive buckets
DROP POLICY IF EXISTS "Anyone can view payment receipts" ON storage.objects;
CREATE POLICY "Org members can view payment receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-receipts'
  AND (storage.foldername(name))[1] IN (
    SELECT organization_id::text FROM profiles WHERE user_id = auth.uid()
  )
);

-- Fix id-cards: remove public access
DROP POLICY IF EXISTS "ID cards are publicly readable" ON storage.objects;

-- Fix organization-documents: remove public SELECT
DROP POLICY IF EXISTS "Chat files view policy" ON storage.objects;
CREATE POLICY "Org members can view organization documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'organization-documents'
  AND (
    (auth.uid())::text = (storage.foldername(name))[1]
    OR (storage.foldername(name))[1] IN (
      SELECT organization_id::text FROM profiles WHERE user_id = auth.uid()
    )
  )
);

-- Fix weighbridge upload: change from public to authenticated role
DROP POLICY IF EXISTS "Auth users upload weighbridge photos" ON storage.objects;
CREATE POLICY "Authenticated users upload weighbridge photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'weighbridge-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT organization_id::text FROM profiles WHERE user_id = auth.uid()
  )
);

-- Fix rating-evidence upload: change from public to authenticated
DROP POLICY IF EXISTS "Authenticated users can upload evidence" ON storage.objects;
CREATE POLICY "Authenticated users can upload evidence"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'rating-evidence'
  AND auth.uid() IS NOT NULL
);

-- Make sensitive buckets private
UPDATE storage.buckets SET public = false WHERE id = 'recycling-certificates';
UPDATE storage.buckets SET public = false WHERE id = 'rating-evidence';
UPDATE storage.buckets SET public = false WHERE id = 'stories';
