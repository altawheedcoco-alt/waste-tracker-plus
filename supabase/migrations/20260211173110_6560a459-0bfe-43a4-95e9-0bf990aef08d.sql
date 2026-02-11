
-- Add dual weight verification columns to shipments
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS weight_at_source NUMERIC;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS weight_at_destination NUMERIC;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS weight_discrepancy_pct NUMERIC GENERATED ALWAYS AS (
  CASE WHEN weight_at_source > 0 AND weight_at_destination > 0
    THEN ROUND(ABS(weight_at_source - weight_at_destination) / weight_at_source * 100, 2)
    ELSE NULL
  END
) STORED;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS compliance_verified BOOLEAN DEFAULT false;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS gps_active_throughout BOOLEAN DEFAULT true;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS gps_signal_lost_at TIMESTAMPTZ;
