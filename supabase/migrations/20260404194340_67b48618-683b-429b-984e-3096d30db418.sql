-- Add missing license/compliance fields for authorized transporters
ALTER TABLE public.organizations 
  ADD COLUMN IF NOT EXISTS environmental_register_number TEXT,
  ADD COLUMN IF NOT EXISTS environmental_register_expiry DATE,
  ADD COLUMN IF NOT EXISTS environmental_register_url TEXT,
  ADD COLUMN IF NOT EXISTS hazardous_materials_register_number TEXT,
  ADD COLUMN IF NOT EXISTS hazardous_materials_register_expiry DATE,
  ADD COLUMN IF NOT EXISTS hazardous_materials_register_url TEXT,
  ADD COLUMN IF NOT EXISTS license_geographic_scope TEXT DEFAULT 'single_governorate',
  ADD COLUMN IF NOT EXISTS licensed_governorates TEXT[] DEFAULT '{}';

-- Add comment for clarity
COMMENT ON COLUMN public.organizations.license_geographic_scope IS 'Transport license scope: single_governorate, five_governorates, nationwide';
COMMENT ON COLUMN public.organizations.licensed_governorates IS 'List of governorate names the transporter is licensed to operate in';
COMMENT ON COLUMN public.organizations.environmental_register_number IS 'Environmental register number issued by EEAA';
COMMENT ON COLUMN public.organizations.hazardous_materials_register_number IS 'Hazardous materials register number issued by EEAA';