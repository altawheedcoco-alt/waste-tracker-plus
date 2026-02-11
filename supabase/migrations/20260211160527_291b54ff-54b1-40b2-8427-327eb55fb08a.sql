
-- Create weight disputes table
CREATE TABLE public.weight_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES public.shipments(id),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  generator_weight NUMERIC NOT NULL,
  recycler_weight NUMERIC NOT NULL,
  difference_percentage NUMERIC NOT NULL,
  threshold_percentage NUMERIC NOT NULL DEFAULT 5,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.weight_disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view their disputes" ON public.weight_disputes
FOR SELECT USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Authenticated users can insert disputes" ON public.weight_disputes
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can update disputes" ON public.weight_disputes
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create storage bucket for weighbridge photos
INSERT INTO storage.buckets (id, name, public) VALUES ('weighbridge-photos', 'weighbridge-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Auth users upload weighbridge photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'weighbridge-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Public view weighbridge photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'weighbridge-photos');
