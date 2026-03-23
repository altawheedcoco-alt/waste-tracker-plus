
-- Add column to track AI-generated images
ALTER TABLE platform_posts ADD COLUMN IF NOT EXISTS ai_image_generated boolean DEFAULT false;

-- Create storage bucket for post images
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to post images
CREATE POLICY "Public read post images" ON storage.objects
FOR SELECT USING (bucket_id = 'post-images');

-- Allow service role to insert post images  
CREATE POLICY "Service insert post images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'post-images');
