
-- Create a public bucket for logos, avatars, covers, and gallery photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('public-assets', 'public-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own org assets
CREATE POLICY "Authenticated users can upload public assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'public-assets');

-- Anyone can view public assets
CREATE POLICY "Public assets are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'public-assets');

-- Authenticated users can update their own uploads
CREATE POLICY "Authenticated users can update public assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'public-assets');

-- Authenticated users can delete their own uploads
CREATE POLICY "Authenticated users can delete public assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'public-assets');
