-- Add packaging method and hazard level columns
ALTER TABLE public.shipments
ADD COLUMN IF NOT EXISTS packaging_method text,
ADD COLUMN IF NOT EXISTS hazard_level text;