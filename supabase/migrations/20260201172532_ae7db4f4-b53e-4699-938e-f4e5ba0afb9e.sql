
-- Update the verification code generation function
CREATE OR REPLACE FUNCTION public.generate_contract_verification_code()
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  timestamp_part TEXT;
  random_part TEXT;
  checksum INTEGER;
BEGIN
  timestamp_part := upper(to_hex(extract(epoch from now())::bigint % 100000));
  random_part := upper(substr(md5(random()::text), 1, 6));
  checksum := (extract(epoch from now())::bigint % 97);
  RETURN 'EG-I-RECYCLE-' || timestamp_part || '-' || random_part || '-' || lpad(checksum::text, 2, '0');
END;
$function$;
