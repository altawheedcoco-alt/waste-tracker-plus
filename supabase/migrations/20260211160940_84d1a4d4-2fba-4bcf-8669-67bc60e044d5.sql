
-- Add license management columns to organizations
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS hazardous_certified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS license_expiry_date DATE,
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS license_renewal_url TEXT;
