
-- Custody chain events table for QR Code chain audit trail
CREATE TABLE public.custody_chain_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('generator_handover', 'transporter_pickup', 'transporter_delivery', 'recycler_receipt', 'disposal_receipt')),
  actor_organization_id UUID REFERENCES public.organizations(id),
  actor_user_id UUID,
  qr_code_data TEXT NOT NULL,
  qr_code_hash TEXT NOT NULL,
  previous_event_id UUID REFERENCES public.custody_chain_events(id),
  gps_latitude DOUBLE PRECISION,
  gps_longitude DOUBLE PRECISION,
  gps_accuracy DOUBLE PRECISION,
  device_info TEXT,
  photo_proof_url TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_custody_chain_shipment ON public.custody_chain_events(shipment_id, created_at);
CREATE INDEX idx_custody_chain_hash ON public.custody_chain_events(qr_code_hash);

-- Enable RLS
ALTER TABLE public.custody_chain_events ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view custody events for their org shipments"
ON public.custody_chain_events FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.shipments s
    JOIN public.profiles p ON p.organization_id IN (s.generator_id, s.transporter_id, s.recycler_id)
    WHERE s.id = custody_chain_events.shipment_id
    AND p.id = auth.uid()
  )
  OR
  EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
);

CREATE POLICY "Users can insert custody events for their org shipments"
ON public.custody_chain_events FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.shipments s
    JOIN public.profiles p ON p.organization_id IN (s.generator_id, s.transporter_id, s.recycler_id)
    WHERE s.id = custody_chain_events.shipment_id
    AND p.id = auth.uid()
  )
);

-- Add manifest columns to shipments
ALTER TABLE public.shipments
ADD COLUMN IF NOT EXISTS generator_qr_code TEXT,
ADD COLUMN IF NOT EXISTS transporter_pickup_qr TEXT,
ADD COLUMN IF NOT EXISTS transporter_delivery_qr TEXT,
ADD COLUMN IF NOT EXISTS recycler_receipt_qr TEXT,
ADD COLUMN IF NOT EXISTS manifest_pdf_url TEXT,
ADD COLUMN IF NOT EXISTS manifest_generated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS custody_chain_complete BOOLEAN DEFAULT false;

-- Enable realtime for custody chain
ALTER PUBLICATION supabase_realtime ADD TABLE public.custody_chain_events;
