ALTER TABLE public.manual_shipment_drafts 
  ADD COLUMN IF NOT EXISTS price_per_unit numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS vat_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS vat_amount numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS labor_tax_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS labor_tax_percent numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS labor_tax_amount numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS extra_costs numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS amount_paid numeric DEFAULT NULL;