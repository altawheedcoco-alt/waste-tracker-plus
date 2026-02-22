
-- Add map link columns to shipments table
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS pickup_map_link TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS delivery_map_link TEXT;
