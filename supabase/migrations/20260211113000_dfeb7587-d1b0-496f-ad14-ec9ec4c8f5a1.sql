
-- Drop the failed table if it partially exists
DROP TABLE IF EXISTS public.legal_licenses;

-- Centralized Legal Licenses Table
CREATE TABLE public.legal_licenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  facility_id UUID REFERENCES public.disposal_facilities(id) ON DELETE SET NULL,
  
  license_category TEXT NOT NULL,
  license_name TEXT NOT NULL,
  license_name_en TEXT,
  issuing_authority TEXT NOT NULL,
  license_number TEXT,
  
  issue_date DATE,
  expiry_date DATE,
  renewal_date DATE,
  
  document_url TEXT,
  document_file_name TEXT,
  
  status TEXT NOT NULL DEFAULT 'active',
  
  allowed_waste_codes TEXT[] DEFAULT '{}',
  
  notes TEXT,
  reminder_sent_at TIMESTAMPTZ,
  
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.legal_licenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org licenses"
  ON public.legal_licenses FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert licenses for their org"
  ON public.legal_licenses FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their org licenses"
  ON public.legal_licenses FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their org licenses"
  ON public.legal_licenses FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all licenses"
  ON public.legal_licenses FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE INDEX idx_legal_licenses_org ON public.legal_licenses(organization_id);
CREATE INDEX idx_legal_licenses_expiry ON public.legal_licenses(expiry_date);
CREATE INDEX idx_legal_licenses_category ON public.legal_licenses(license_category);

CREATE TRIGGER update_legal_licenses_updated_at
  BEFORE UPDATE ON public.legal_licenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Validation trigger for waste code checks
CREATE OR REPLACE FUNCTION public.update_license_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expiry_date IS NULL THEN
    NEW.status := 'active';
  ELSIF NEW.expiry_date < CURRENT_DATE THEN
    NEW.status := 'expired';
  ELSIF NEW.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN
    NEW.status := 'expiring_soon';
  ELSE
    NEW.status := 'active';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_license_status_trigger
  BEFORE INSERT OR UPDATE ON public.legal_licenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_license_status();
