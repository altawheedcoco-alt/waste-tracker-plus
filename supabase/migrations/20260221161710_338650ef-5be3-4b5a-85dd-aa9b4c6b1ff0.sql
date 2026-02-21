-- Add photos column to shipment_logs for status change photos
ALTER TABLE public.shipment_logs ADD COLUMN IF NOT EXISTS photos text[] DEFAULT NULL;

-- Add comment
COMMENT ON COLUMN public.shipment_logs.photos IS 'Array of photo URLs uploaded during status change';