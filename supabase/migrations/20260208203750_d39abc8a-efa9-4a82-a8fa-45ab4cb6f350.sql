-- Add partner_code to organizations for verification
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS partner_code VARCHAR(8) UNIQUE;

-- Generate unique partner codes for existing organizations
UPDATE public.organizations 
SET partner_code = UPPER(SUBSTRING(MD5(RANDOM()::TEXT || id::TEXT) FROM 1 FOR 8))
WHERE partner_code IS NULL;

-- Make partner_code NOT NULL after populating
ALTER TABLE public.organizations 
ALTER COLUMN partner_code SET NOT NULL;

-- Create function to auto-generate partner code
CREATE OR REPLACE FUNCTION generate_partner_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.partner_code IS NULL THEN
    NEW.partner_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || NEW.id::TEXT) FROM 1 FOR 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new organizations
DROP TRIGGER IF EXISTS set_partner_code ON public.organizations;
CREATE TRIGGER set_partner_code
  BEFORE INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION generate_partner_code();

-- Create verified partnerships table
CREATE TABLE IF NOT EXISTS public.verified_partnerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  partner_org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'pending', 'rejected', 'inactive')),
  partnership_type VARCHAR(50),
  notes TEXT,
  verified_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester_org_id, partner_org_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_verified_partnerships_requester ON public.verified_partnerships(requester_org_id);
CREATE INDEX IF NOT EXISTS idx_verified_partnerships_partner ON public.verified_partnerships(partner_org_id);

-- Enable RLS
ALTER TABLE public.verified_partnerships ENABLE ROW LEVEL SECURITY;

-- RLS policies for verified_partnerships
CREATE POLICY "Organizations can view their partnerships"
  ON public.verified_partnerships FOR SELECT
  USING (
    requester_org_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    OR partner_org_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Organizations can create partnership requests"
  ON public.verified_partnerships FOR INSERT
  WITH CHECK (
    requester_org_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Organizations can update their partnerships"
  ON public.verified_partnerships FOR UPDATE
  USING (
    requester_org_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    OR partner_org_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Organizations can delete their partnerships"
  ON public.verified_partnerships FOR DELETE
  USING (
    requester_org_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

-- Trigger for updated_at
CREATE TRIGGER update_verified_partnerships_updated_at
  BEFORE UPDATE ON public.verified_partnerships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();