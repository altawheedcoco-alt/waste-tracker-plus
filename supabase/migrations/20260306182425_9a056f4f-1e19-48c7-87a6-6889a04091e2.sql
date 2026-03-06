
-- Fix function search path
CREATE OR REPLACE FUNCTION public.generate_attestation_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  seq_num INTEGER;
  year_str TEXT;
BEGIN
  year_str := to_char(now(), 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(attestation_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO seq_num
  FROM public.regulatory_attestations
  WHERE attestation_number LIKE 'ATT-' || year_str || '-%';
  RETURN 'ATT-' || year_str || '-' || LPAD(seq_num::TEXT, 5, '0');
END;
$$;
