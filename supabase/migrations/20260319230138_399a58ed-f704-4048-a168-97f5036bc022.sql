-- Create storage bucket for custom chat wallpapers
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-wallpapers', 'chat-wallpapers', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their wallpapers
CREATE POLICY "Users can upload own wallpapers"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-wallpapers' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access
CREATE POLICY "Public wallpaper read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-wallpapers');

-- Allow users to delete their own wallpapers
CREATE POLICY "Users can delete own wallpapers"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'chat-wallpapers' AND auth.uid()::text = (storage.foldername(name))[1]);