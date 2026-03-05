
-- Add legal fields for generator
ALTER TABLE public.manual_shipment_drafts
  ADD COLUMN IF NOT EXISTS generator_commercial_register TEXT,
  ADD COLUMN IF NOT EXISTS generator_tax_id TEXT,
  ADD COLUMN IF NOT EXISTS generator_representative TEXT,
  ADD COLUMN IF NOT EXISTS generator_email TEXT;

-- Add legal fields for transporter
ALTER TABLE public.manual_shipment_drafts
  ADD COLUMN IF NOT EXISTS transporter_commercial_register TEXT,
  ADD COLUMN IF NOT EXISTS transporter_tax_id TEXT,
  ADD COLUMN IF NOT EXISTS transporter_representative TEXT,
  ADD COLUMN IF NOT EXISTS transporter_email TEXT;

-- Add legal fields for destination
ALTER TABLE public.manual_shipment_drafts
  ADD COLUMN IF NOT EXISTS destination_commercial_register TEXT,
  ADD COLUMN IF NOT EXISTS destination_tax_id TEXT,
  ADD COLUMN IF NOT EXISTS destination_representative TEXT,
  ADD COLUMN IF NOT EXISTS destination_email TEXT;
