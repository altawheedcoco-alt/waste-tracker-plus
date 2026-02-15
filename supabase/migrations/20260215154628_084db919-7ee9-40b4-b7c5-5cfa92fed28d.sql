-- Add file_url column to document_print_log to store generated PDFs
ALTER TABLE public.document_print_log 
ADD COLUMN IF NOT EXISTS file_url text;

-- Add comment
COMMENT ON COLUMN public.document_print_log.file_url IS 'URL of the stored PDF/file for this document';

-- Create storage bucket for archived documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('document-archive', 'document-archive', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
CREATE POLICY "Users can upload documents" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'document-archive');

-- Allow public read
CREATE POLICY "Documents are publicly readable" ON storage.objects
FOR SELECT
USING (bucket_id = 'document-archive');

-- Allow users to update their documents
CREATE POLICY "Users can update their documents" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'document-archive');
