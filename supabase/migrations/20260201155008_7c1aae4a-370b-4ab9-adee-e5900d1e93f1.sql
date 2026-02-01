
-- Add new columns for generator and partner companies
ALTER TABLE public.external_weight_records
ADD COLUMN generator_company_id uuid REFERENCES public.organizations(id),
ADD COLUMN generator_company_name text,
ADD COLUMN partner_company_id uuid REFERENCES public.organizations(id),
ADD COLUMN partner_company_name text,
ADD COLUMN partner_type text CHECK (partner_type IN ('transporter', 'recycler'));

-- Add comment to clarify the columns
COMMENT ON COLUMN public.external_weight_records.generator_company_id IS 'The generator organization that produced the waste';
COMMENT ON COLUMN public.external_weight_records.partner_company_id IS 'The transporter (for recyclers) or recycler (for transporters)';
COMMENT ON COLUMN public.external_weight_records.partner_type IS 'Type of partner: transporter (when org is recycler) or recycler (when org is transporter)';
