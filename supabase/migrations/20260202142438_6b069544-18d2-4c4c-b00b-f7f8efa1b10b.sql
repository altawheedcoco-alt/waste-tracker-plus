-- Create storage bucket for payment receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-receipts', 'payment-receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload payment receipts
CREATE POLICY "Authenticated users can upload payment receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'payment-receipts');

-- Allow authenticated users to view payment receipts
CREATE POLICY "Anyone can view payment receipts"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-receipts');

-- Allow users to update their own receipts
CREATE POLICY "Users can update payment receipts"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'payment-receipts');

-- Allow users to delete their own receipts
CREATE POLICY "Users can delete payment receipts"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'payment-receipts');