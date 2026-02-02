-- Create storage bucket for ID cards
INSERT INTO storage.buckets (id, name, public)
VALUES ('id-cards', 'id-cards', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy to allow authenticated users to upload their ID cards
CREATE POLICY "Users can upload ID cards"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'id-cards' 
  AND auth.uid() IS NOT NULL
);

-- Create policy to allow public read access to ID cards
CREATE POLICY "ID cards are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'id-cards');