
-- Expand partner_code column to accommodate type prefixes
ALTER TABLE public.organizations ALTER COLUMN partner_code TYPE VARCHAR(16);

-- Update partner code generation to use type-specific prefixes
CREATE OR REPLACE FUNCTION public.generate_partner_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prefix TEXT;
BEGIN
  IF NEW.partner_code IS NULL OR NEW.partner_code = '' OR NEW.partner_code LIKE 'PTR-%' THEN
    CASE NEW.organization_type
      WHEN 'generator' THEN prefix := 'GEN';
      WHEN 'transporter' THEN prefix := 'TRN';
      WHEN 'recycler' THEN prefix := 'RCY';
      WHEN 'disposal' THEN prefix := 'DSP';
      WHEN 'consultant' THEN prefix := 'CNS';
      WHEN 'consulting_office' THEN prefix := 'COF';
      WHEN 'iso_body' THEN prefix := 'ISO';
      ELSE prefix := 'ORG';
    END CASE;
    NEW.partner_code := prefix || '-' || UPPER(SUBSTRING(gen_random_uuid()::text FROM 1 FOR 8));
  END IF;
  RETURN NEW;
END;
$$;

-- Update existing organizations with type-specific codes
UPDATE public.organizations SET partner_code = 'GEN-' || UPPER(SUBSTRING(gen_random_uuid()::text FROM 1 FOR 8)) WHERE organization_type = 'generator';
UPDATE public.organizations SET partner_code = 'TRN-' || UPPER(SUBSTRING(gen_random_uuid()::text FROM 1 FOR 8)) WHERE organization_type = 'transporter';
UPDATE public.organizations SET partner_code = 'RCY-' || UPPER(SUBSTRING(gen_random_uuid()::text FROM 1 FOR 8)) WHERE organization_type = 'recycler';
UPDATE public.organizations SET partner_code = 'DSP-' || UPPER(SUBSTRING(gen_random_uuid()::text FROM 1 FOR 8)) WHERE organization_type = 'disposal';
UPDATE public.organizations SET partner_code = 'CNS-' || UPPER(SUBSTRING(gen_random_uuid()::text FROM 1 FOR 8)) WHERE organization_type = 'consultant';
UPDATE public.organizations SET partner_code = 'COF-' || UPPER(SUBSTRING(gen_random_uuid()::text FROM 1 FOR 8)) WHERE organization_type = 'consulting_office';
UPDATE public.organizations SET partner_code = 'ISO-' || UPPER(SUBSTRING(gen_random_uuid()::text FROM 1 FOR 8)) WHERE organization_type = 'iso_body';
