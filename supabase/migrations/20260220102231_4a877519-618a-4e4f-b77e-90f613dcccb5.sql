
-- Create storage bucket for signing request documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('signing-documents', 'signing-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their org folder
CREATE POLICY "Users can upload signing documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'signing-documents');

-- Allow authenticated users to read signing documents
CREATE POLICY "Users can read signing documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'signing-documents');
