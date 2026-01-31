-- Create storage bucket for chat files if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('organization-documents', 'organization-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Authenticated users can upload chat files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view chat files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own chat files" ON storage.objects;
DROP POLICY IF EXISTS "Chat files upload policy" ON storage.objects;
DROP POLICY IF EXISTS "Chat files view policy" ON storage.objects;
DROP POLICY IF EXISTS "Chat files delete policy" ON storage.objects;

-- Create policy for uploading files to organization-documents bucket
CREATE POLICY "Chat files upload policy"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'organization-documents'
);

-- Create policy for viewing files in organization-documents bucket
CREATE POLICY "Chat files view policy"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'organization-documents'
);

-- Create policy for deleting own files
CREATE POLICY "Chat files delete policy"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'organization-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);