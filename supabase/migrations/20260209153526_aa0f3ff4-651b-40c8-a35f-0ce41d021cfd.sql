
-- Add recycler visibility control column
ALTER TABLE public.partner_visibility_settings
ADD COLUMN IF NOT EXISTS can_view_recycler_info boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.partner_visibility_settings.can_view_recycler_info IS 'Whether the generator partner can see recycler info on shipments managed by this transporter';
