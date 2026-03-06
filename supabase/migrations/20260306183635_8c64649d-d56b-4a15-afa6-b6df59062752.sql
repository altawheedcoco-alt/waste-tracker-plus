
-- Backfill issuing_authority_code for existing licenses based on license_category
UPDATE public.legal_licenses 
SET issuing_authority_code = CASE 
  WHEN license_category IN ('ida', 'industrial_register') THEN 'ida'
  WHEN license_category = 'wmra' THEN 'wmra'
  WHEN license_category = 'eeaa' THEN 'eeaa'
  WHEN license_category = 'hazardous_handling' THEN 'eeaa'
  ELSE issuing_authority_code
END
WHERE issuing_authority_code IS NULL 
  AND license_category IN ('ida', 'industrial_register', 'wmra', 'eeaa', 'hazardous_handling');

-- Create a trigger to auto-set issuing_authority_code on insert/update
CREATE OR REPLACE FUNCTION public.auto_set_issuing_authority_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.issuing_authority_code IS NULL THEN
    NEW.issuing_authority_code := CASE 
      WHEN NEW.license_category IN ('ida', 'industrial_register') THEN 'ida'
      WHEN NEW.license_category = 'wmra' THEN 'wmra'
      WHEN NEW.license_category = 'eeaa' THEN 'eeaa'
      WHEN NEW.license_category = 'hazardous_handling' THEN 'eeaa'
      ELSE NULL
    END;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_issuing_authority_code ON public.legal_licenses;
CREATE TRIGGER trg_auto_issuing_authority_code
  BEFORE INSERT OR UPDATE ON public.legal_licenses
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_issuing_authority_code();
