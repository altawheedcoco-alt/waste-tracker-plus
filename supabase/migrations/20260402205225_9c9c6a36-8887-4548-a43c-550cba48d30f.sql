
-- Create storage bucket for call recordings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('call-recordings', 'call-recordings', true, 104857600, ARRAY['audio/webm', 'video/webm', 'audio/ogg', 'video/mp4'])
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload recordings
CREATE POLICY "Authenticated users can upload recordings"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'call-recordings');

-- Allow authenticated users to read recordings
CREATE POLICY "Authenticated users can read recordings"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'call-recordings');
