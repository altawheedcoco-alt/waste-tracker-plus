ALTER TABLE public.manual_shipment_drafts 
  ADD COLUMN IF NOT EXISTS finance_visibility text DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS finance_visible_to_generator boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS finance_visible_to_transporter boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS finance_visible_to_destination boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS finance_visible_to_driver boolean DEFAULT true;