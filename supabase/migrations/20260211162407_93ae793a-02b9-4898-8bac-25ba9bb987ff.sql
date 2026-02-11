
-- Track plate verification per shipment trip
CREATE TABLE public.vehicle_plate_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES public.drivers(id),
  expected_plate TEXT NOT NULL,
  scanned_plate TEXT,
  photo_url TEXT,
  is_match BOOLEAN NOT NULL DEFAULT false,
  confidence_score NUMERIC(5,2),
  override_by UUID REFERENCES auth.users(id),
  override_reason TEXT,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  gps_latitude DOUBLE PRECISION,
  gps_longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vehicle_plate_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view verifications"
  ON public.vehicle_plate_verifications FOR SELECT
  USING (
    shipment_id IN (
      SELECT id FROM public.shipments s 
      WHERE s.transporter_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
        OR s.generator_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
        OR s.recycler_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Drivers can insert verifications"
  ON public.vehicle_plate_verifications FOR INSERT
  WITH CHECK (
    shipment_id IN (
      SELECT id FROM public.shipments s 
      WHERE s.transporter_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- Add plate_verified flag to shipments
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS plate_verified BOOLEAN DEFAULT false;

CREATE INDEX idx_plate_verifications_shipment ON public.vehicle_plate_verifications(shipment_id);
