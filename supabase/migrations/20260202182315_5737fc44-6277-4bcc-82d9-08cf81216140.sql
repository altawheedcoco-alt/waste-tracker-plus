-- Add tax fields to partner_waste_types table
ALTER TABLE public.partner_waste_types
ADD COLUMN tax_included boolean DEFAULT false,
ADD COLUMN tax_type text DEFAULT 'vat',
ADD COLUMN tax_rate numeric DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN public.partner_waste_types.tax_included IS 'Whether the price includes tax or not';
COMMENT ON COLUMN public.partner_waste_types.tax_type IS 'Type of tax: vat, sales, other';
COMMENT ON COLUMN public.partner_waste_types.tax_rate IS 'Tax percentage rate';