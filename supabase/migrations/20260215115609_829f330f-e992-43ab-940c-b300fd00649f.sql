
-- Environmental Consultants System (Full)

CREATE TABLE public.environmental_consultants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  full_name_en TEXT,
  national_id TEXT,
  phone TEXT,
  email TEXT,
  specialization TEXT,
  license_number TEXT,
  license_issuer TEXT,
  license_expiry DATE,
  qualification TEXT,
  years_of_experience INTEGER,
  bio TEXT,
  profile_photo_url TEXT,
  signature_url TEXT,
  stamp_url TEXT,
  consultant_code TEXT UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

CREATE TABLE public.consultant_organization_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultant_id UUID NOT NULL REFERENCES public.environmental_consultants(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role_title TEXT DEFAULT 'استشاري بيئي',
  assigned_at TIMESTAMPTZ DEFAULT now(),
  assigned_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  can_sign_certificates BOOLEAN DEFAULT true,
  can_sign_permits BOOLEAN DEFAULT true,
  can_sign_shipments BOOLEAN DEFAULT true,
  can_sign_reports BOOLEAN DEFAULT true,
  notes TEXT,
  UNIQUE(consultant_id, organization_id)
);

CREATE TABLE public.consultant_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultant_id UUID NOT NULL REFERENCES public.environmental_consultants(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  document_name TEXT NOT NULL,
  document_url TEXT NOT NULL,
  expiry_date DATE,
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.consultant_document_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultant_id UUID NOT NULL REFERENCES public.environmental_consultants(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  document_type TEXT NOT NULL,
  document_id UUID NOT NULL,
  signature_data TEXT,
  stamp_applied BOOLEAN DEFAULT false,
  signature_hash TEXT,
  ip_address TEXT,
  device_info TEXT,
  signed_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT
);

-- RLS
ALTER TABLE public.environmental_consultants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultant_organization_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultant_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultant_document_signatures ENABLE ROW LEVEL SECURITY;

-- Consultants: own profile
CREATE POLICY "ec_select_own" ON public.environmental_consultants FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "ec_update_own" ON public.environmental_consultants FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "ec_insert_own" ON public.environmental_consultants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Consultants: org members can view assigned consultants
CREATE POLICY "ec_select_by_org" ON public.environmental_consultants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.consultant_organization_assignments coa
      JOIN public.profiles p ON p.organization_id = coa.organization_id
      WHERE coa.consultant_id = environmental_consultants.id
        AND p.id = auth.uid() AND coa.is_active = true
    )
  );

-- Assignments
CREATE POLICY "coa_select" ON public.consultant_organization_assignments FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.environmental_consultants ec WHERE ec.id = consultant_id AND ec.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.organization_id = organization_id)
  );
CREATE POLICY "coa_insert" ON public.consultant_organization_assignments FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.organization_id = organization_id)
  );
CREATE POLICY "coa_update" ON public.consultant_organization_assignments FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.organization_id = organization_id)
  );
CREATE POLICY "coa_delete" ON public.consultant_organization_assignments FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.organization_id = organization_id)
  );

-- Credentials
CREATE POLICY "cc_own" ON public.consultant_credentials FOR ALL
  USING (EXISTS (SELECT 1 FROM public.environmental_consultants ec WHERE ec.id = consultant_id AND ec.user_id = auth.uid()));
CREATE POLICY "cc_view_by_partner" ON public.consultant_credentials FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.consultant_organization_assignments coa
      JOIN public.profiles p ON p.organization_id = coa.organization_id
      WHERE coa.consultant_id = consultant_credentials.consultant_id
        AND p.id = auth.uid() AND coa.is_active = true
    )
  );

-- Signatures
CREATE POLICY "cds_insert" ON public.consultant_document_signatures FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.environmental_consultants ec WHERE ec.id = consultant_id AND ec.user_id = auth.uid()));
CREATE POLICY "cds_select" ON public.consultant_document_signatures FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.organization_id = organization_id)
    OR EXISTS (SELECT 1 FROM public.environmental_consultants ec WHERE ec.id = consultant_id AND ec.user_id = auth.uid())
  );

-- Auto-generate consultant code
CREATE OR REPLACE FUNCTION public.generate_consultant_code()
RETURNS TRIGGER AS $$
DECLARE
  seq_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(NULLIF(SUBSTRING(consultant_code FROM 8), '') AS INTEGER)), 0) + 1
  INTO seq_num
  FROM public.environmental_consultants
  WHERE consultant_code LIKE 'EC-' || TO_CHAR(NOW(), 'YYMM') || '-%';
  NEW.consultant_code := 'EC-' || TO_CHAR(NOW(), 'YYMM') || '-' || LPAD(seq_num::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_consultant_code
  BEFORE INSERT ON public.environmental_consultants
  FOR EACH ROW WHEN (NEW.consultant_code IS NULL)
  EXECUTE FUNCTION public.generate_consultant_code();

CREATE TRIGGER update_environmental_consultants_updated_at
  BEFORE UPDATE ON public.environmental_consultants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
