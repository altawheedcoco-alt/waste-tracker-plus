
-- Create storage bucket for profile media (avatars, covers, post images)
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-media', 'profile-media', true)
ON CONFLICT (id) DO NOTHING;

-- RLS: Users can upload to their own folder
CREATE POLICY "Users upload own media" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'profile-media' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS: Users can update/delete own media
CREATE POLICY "Users manage own media" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'profile-media' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS: Public read
CREATE POLICY "Public read profile media" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'profile-media');
