
-- Update default expiry to 15 minutes instead of 30 seconds
ALTER TABLE public.driver_shipment_offers 
  ALTER COLUMN expires_at SET DEFAULT (now() + interval '15 minutes');

-- Add distance_km column if not exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'driver_shipment_offers' AND column_name = 'distance_km') THEN
    ALTER TABLE public.driver_shipment_offers ADD COLUMN distance_km NUMERIC(8,2);
  END IF;
END $$;

-- Add offer_round column if not exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'driver_shipment_offers' AND column_name = 'offer_round') THEN
    ALTER TABLE public.driver_shipment_offers ADD COLUMN offer_round INTEGER NOT NULL DEFAULT 1;
  END IF;
END $$;

-- Add max_radius_km for search configuration
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'driver_shipment_offers' AND column_name = 'max_radius_km') THEN
    ALTER TABLE public.driver_shipment_offers ADD COLUMN max_radius_km NUMERIC(8,2) DEFAULT 10;
  END IF;
END $$;

-- Create index for expiry-based cleanup
CREATE INDEX IF NOT EXISTS idx_driver_offers_expires ON public.driver_shipment_offers(expires_at) WHERE status = 'pending';
