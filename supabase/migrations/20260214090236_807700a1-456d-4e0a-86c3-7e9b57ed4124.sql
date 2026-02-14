
-- Driver permits table
CREATE TABLE public.driver_permits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  permit_number TEXT NOT NULL,
  permit_type TEXT NOT NULL DEFAULT 'operating', -- operating, hazmat_transport, site_access
  status TEXT NOT NULL DEFAULT 'active', -- active, expired, suspended, revoked
  issued_by UUID REFERENCES auth.users(id),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE NOT NULL,
  scope JSONB DEFAULT '{}', -- { transport: true, loading: true, unloading: true, waste_types: [...] }
  conditions TEXT,
  notes TEXT,
  suspended_at TIMESTAMPTZ,
  suspended_by UUID,
  suspension_reason TEXT,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID,
  revocation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, permit_number)
);

ALTER TABLE public.driver_permits ENABLE ROW LEVEL SECURITY;

-- Org members can view their org permits
CREATE POLICY "Users can view org permits"
  ON public.driver_permits FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid()
    )
  );

-- Org members can insert permits for their org
CREATE POLICY "Users can create org permits"
  ON public.driver_permits FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid()
    )
  );

-- Org members can update their org permits
CREATE POLICY "Users can update org permits"
  ON public.driver_permits FOR UPDATE TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid()
    )
  );

-- Auto-update updated_at
CREATE TRIGGER update_driver_permits_updated_at
  BEFORE UPDATE ON public.driver_permits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Generate permit number function
CREATE OR REPLACE FUNCTION public.generate_permit_number(org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  seq_num INT;
  year_month TEXT;
BEGIN
  year_month := to_char(now(), 'YYMM');
  SELECT COUNT(*) + 1 INTO seq_num FROM driver_permits WHERE organization_id = org_id;
  RETURN 'PRM-' || year_month || '-' || lpad(seq_num::text, 4, '0');
END;
$$;
