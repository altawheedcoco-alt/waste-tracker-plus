
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS license_source_ida boolean DEFAULT false;
