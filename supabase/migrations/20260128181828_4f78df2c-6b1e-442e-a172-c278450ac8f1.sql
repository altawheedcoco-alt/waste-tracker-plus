-- Add stamp and signature columns to organizations
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS stamp_url TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS signature_url TEXT;

-- Create storage bucket for stamps and signatures
INSERT INTO storage.buckets (id, name, public) 
VALUES ('organization-stamps', 'organization-stamps', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their organization stamps/signatures
CREATE POLICY "Organizations can upload their stamps" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'organization-stamps' AND 
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM organizations WHERE id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  )
);

-- Allow authenticated users to update their organization stamps/signatures
CREATE POLICY "Organizations can update their stamps" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'organization-stamps' AND 
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM organizations WHERE id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  )
);

-- Allow authenticated users to delete their organization stamps/signatures
CREATE POLICY "Organizations can delete their stamps" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'organization-stamps' AND 
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM organizations WHERE id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  )
);

-- Allow public read access to stamps (for printing)
CREATE POLICY "Public can view organization stamps" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'organization-stamps');