
-- Add per-shipment recycler hiding flag
ALTER TABLE public.shipments
ADD COLUMN IF NOT EXISTS hide_recycler_from_generator boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.shipments.hide_recycler_from_generator IS 'When true, recycler info is hidden from the generator for this specific shipment';

-- Add index for fast lookups
CREATE INDEX IF NOT EXISTS idx_shipments_hide_recycler ON public.shipments(hide_recycler_from_generator) WHERE hide_recycler_from_generator = true;
