
-- Create shipment-photos bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('shipment-photos', 'shipment-photos', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for shipment-photos
CREATE POLICY "Authenticated users can upload shipment photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'shipment-photos');

CREATE POLICY "Authenticated users can view shipment photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'shipment-photos');

CREATE POLICY "Authenticated users can delete own shipment photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'shipment-photos');
