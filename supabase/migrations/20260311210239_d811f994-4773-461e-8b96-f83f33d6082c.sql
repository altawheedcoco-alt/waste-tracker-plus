
-- Add seller_type and target_audience columns to marketplace_listings
ALTER TABLE public.marketplace_listings 
  ADD COLUMN IF NOT EXISTS seller_type text DEFAULT 'generator',
  ADD COLUMN IF NOT EXISTS target_audience text[] DEFAULT ARRAY['transporter','recycler','disposal']::text[],
  ADD COLUMN IF NOT EXISTS price_per_unit numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS contact_phone text,
  ADD COLUMN IF NOT EXISTS contact_name text,
  ADD COLUMN IF NOT EXISTS is_negotiable boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS delivery_option text DEFAULT 'pickup';

-- Add comment for clarity
COMMENT ON COLUMN public.marketplace_listings.seller_type IS 'Type of organization posting: generator, transporter, recycler, disposal';
COMMENT ON COLUMN public.marketplace_listings.target_audience IS 'Array of org types that can see this listing';
COMMENT ON COLUMN public.marketplace_listings.delivery_option IS 'pickup, delivery, or both';
