-- Create a storage bucket for recycling certificates PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('recycling-certificates', 'recycling-certificates', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload certificates
CREATE POLICY "Authenticated users can upload certificates"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'recycling-certificates');

-- Allow anyone to view certificates (public bucket)
CREATE POLICY "Anyone can view certificates"
ON storage.objects FOR SELECT
USING (bucket_id = 'recycling-certificates');

-- Allow users to delete their own uploaded certificates
CREATE POLICY "Users can delete own certificates"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'recycling-certificates' AND auth.uid()::text = (storage.foldername(name))[1]);