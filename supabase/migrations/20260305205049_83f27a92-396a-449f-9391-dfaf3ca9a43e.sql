INSERT INTO storage.buckets (id, name, public)
VALUES ('shipment-documents', 'shipment-documents', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload shipment docs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'shipment-documents');

CREATE POLICY "Public read access for shipment docs"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'shipment-documents');