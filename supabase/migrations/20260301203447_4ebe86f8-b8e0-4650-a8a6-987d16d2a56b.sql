
-- Add license source tracking to organizations
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS license_source_env_approval BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS license_source_wmra_permit BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS env_approval_number TEXT,
ADD COLUMN IF NOT EXISTS env_approval_date DATE,
ADD COLUMN IF NOT EXISTS env_approval_expiry DATE,
ADD COLUMN IF NOT EXISTS wmra_permit_number TEXT,
ADD COLUMN IF NOT EXISTS wmra_permit_date DATE,
ADD COLUMN IF NOT EXISTS wmra_permit_expiry DATE,
ADD COLUMN IF NOT EXISTS licensed_waste_categories TEXT[] DEFAULT '{}';
