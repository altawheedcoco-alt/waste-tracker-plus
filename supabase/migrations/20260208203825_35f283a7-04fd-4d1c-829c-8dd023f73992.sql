-- Make partner_code have a default value so it's not required on insert
ALTER TABLE public.organizations 
ALTER COLUMN partner_code SET DEFAULT UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));