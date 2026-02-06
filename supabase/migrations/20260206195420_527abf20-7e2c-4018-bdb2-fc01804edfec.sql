-- Add missing location columns to shipments table
ALTER TABLE public.shipments
ADD COLUMN IF NOT EXISTS pickup_latitude NUMERIC,
ADD COLUMN IF NOT EXISTS pickup_longitude NUMERIC,
ADD COLUMN IF NOT EXISTS pickup_city TEXT,
ADD COLUMN IF NOT EXISTS delivery_latitude NUMERIC,
ADD COLUMN IF NOT EXISTS delivery_longitude NUMERIC,
ADD COLUMN IF NOT EXISTS delivery_city TEXT;