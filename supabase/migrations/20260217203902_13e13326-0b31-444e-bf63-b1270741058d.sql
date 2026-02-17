
-- Add per-shipment generator hiding flag (hide generator from recycler)
ALTER TABLE public.shipments
ADD COLUMN IF NOT EXISTS hide_generator_from_recycler boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.shipments.hide_generator_from_recycler IS 'When true, generator info is hidden from the recycler for this specific shipment';

CREATE INDEX IF NOT EXISTS idx_shipments_hide_generator ON public.shipments(hide_generator_from_recycler) WHERE hide_generator_from_recycler = true;

-- Add global setting for hiding generator info from recycler partners
ALTER TABLE public.partner_visibility_settings
ADD COLUMN IF NOT EXISTS can_view_generator_info boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.partner_visibility_settings.can_view_generator_info IS 'Whether the recycler partner can see generator info on shipments managed by this transporter';
