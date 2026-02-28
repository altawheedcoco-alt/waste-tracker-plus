
-- Create storage bucket for system screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('system-screenshots', 'system-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload screenshots
CREATE POLICY "Admins can upload screenshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'system-screenshots');

-- Allow authenticated users to update screenshots
CREATE POLICY "Admins can update screenshots"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'system-screenshots');

-- Allow anyone to view screenshots
CREATE POLICY "Anyone can view screenshots"
ON storage.objects FOR SELECT
USING (bucket_id = 'system-screenshots');

-- Allow admins to delete screenshots
CREATE POLICY "Admins can delete screenshots"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'system-screenshots');
