-- Create shipment rejection log table
CREATE TABLE public.shipment_rejection_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_id UUID NOT NULL REFERENCES public.shipments(id),
  receipt_id UUID REFERENCES public.shipment_receipts(id),
  rejected_by_organization_id UUID REFERENCES public.organizations(id),
  rejected_by_user_id UUID,
  rejection_reason TEXT NOT NULL,
  rejection_type TEXT NOT NULL DEFAULT 'transporter_delivery_rejection' CHECK (rejection_type IN ('transporter_delivery_rejection', 'generator_rejection', 'recycler_rejection', 'other')),
  shipment_status_before TEXT,
  is_sidelined BOOLEAN DEFAULT false,
  sidelined_at TIMESTAMPTZ,
  sidelined_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shipment_rejection_log ENABLE ROW LEVEL SECURITY;

-- RLS: Organizations can see rejections related to their shipments
CREATE POLICY "Organizations can view their rejection logs"
ON public.shipment_rejection_log
FOR SELECT
USING (
  rejected_by_organization_id IN (
    SELECT id FROM public.organizations WHERE id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  )
  OR shipment_id IN (
    SELECT id FROM public.shipments WHERE 
      generator_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
      OR transporter_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
      OR recycler_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  )
);

-- RLS: Users can insert rejection logs for their organization
CREATE POLICY "Users can create rejection logs"
ON public.shipment_rejection_log
FOR INSERT
WITH CHECK (
  rejected_by_organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- RLS: Users can update (sideline) their own rejection logs
CREATE POLICY "Users can update their rejection logs"
ON public.shipment_rejection_log
FOR UPDATE
USING (
  rejected_by_organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Index for quick lookups
CREATE INDEX idx_rejection_log_shipment ON public.shipment_rejection_log(shipment_id);
CREATE INDEX idx_rejection_log_org ON public.shipment_rejection_log(rejected_by_organization_id);
CREATE INDEX idx_rejection_log_sidelined ON public.shipment_rejection_log(is_sidelined) WHERE is_sidelined = false;