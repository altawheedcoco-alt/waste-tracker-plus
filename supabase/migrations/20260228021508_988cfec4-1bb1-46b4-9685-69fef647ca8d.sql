
-- Re-create with simple authenticated check (this is an internal admin tool)
CREATE POLICY "Authenticated can upload screenshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'system-screenshots');

CREATE POLICY "Authenticated can update screenshots"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'system-screenshots');

CREATE POLICY "Authenticated can delete screenshots"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'system-screenshots');
