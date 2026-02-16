
-- Add pricing mode columns to shipments
ALTER TABLE public.shipments 
  ADD COLUMN IF NOT EXISTS pricing_mode text DEFAULT 'auto',
  ADD COLUMN IF NOT EXISTS driver_fee numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS transporter_margin_percent numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS transporter_margin_fixed numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS disposal_cost numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS client_total numeric DEFAULT 0;

-- Comment on pricing_mode values
COMMENT ON COLUMN public.shipments.pricing_mode IS 'auto | driver_fee_plus_margin | transport_only | transport_and_disposal | externally_agreed | generator_pays | manual';

-- Organization-level default pricing settings
CREATE TABLE IF NOT EXISTS public.organization_pricing_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  default_pricing_mode text NOT NULL DEFAULT 'auto',
  default_margin_percent numeric DEFAULT 15,
  default_margin_fixed numeric DEFAULT 0,
  default_driver_fee_per_km numeric DEFAULT 2,
  default_disposal_cost_per_ton numeric DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id)
);

ALTER TABLE public.organization_pricing_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view their pricing settings"
  ON public.organization_pricing_settings FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Org members can insert their pricing settings"
  ON public.organization_pricing_settings FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Org members can update their pricing settings"
  ON public.organization_pricing_settings FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));
