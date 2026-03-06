
-- Fix search_path for the function
CREATE OR REPLACE FUNCTION public.auto_set_issuing_authority_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
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
