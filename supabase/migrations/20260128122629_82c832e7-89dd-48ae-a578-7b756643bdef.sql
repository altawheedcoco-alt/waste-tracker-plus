-- Add new columns to shipments table for the enhanced form
ALTER TABLE public.shipments
ADD COLUMN IF NOT EXISTS pickup_date date,
ADD COLUMN IF NOT EXISTS expected_delivery_date date,
ADD COLUMN IF NOT EXISTS shipment_type text DEFAULT 'regular',
ADD COLUMN IF NOT EXISTS disposal_method text,
ADD COLUMN IF NOT EXISTS manual_driver_name text,
ADD COLUMN IF NOT EXISTS manual_vehicle_plate text;