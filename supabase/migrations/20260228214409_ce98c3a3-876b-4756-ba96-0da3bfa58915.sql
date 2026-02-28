
-- =============================================
-- المرحلة 1: الفصل المعماري - الاستشاري vs المكتب
-- =============================================

-- 1.2 جدول المكتب الاستشاري
CREATE TABLE public.consulting_offices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  office_name TEXT NOT NULL,
  office_name_en TEXT,
  license_number TEXT,
  license_issuer TEXT,
  license_expiry DATE,
  commercial_register TEXT,
  tax_id TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  specializations TEXT[] DEFAULT '{}',
  accreditations JSONB DEFAULT '{}',
  director_consultant_id UUID REFERENCES public.environmental_consultants(id),
  director_user_id UUID,
  office_stamp_url TEXT,
  office_signature_url TEXT,
  max_consultants INT DEFAULT 50,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id)
);

-- 1.3 جدول عضوية الاستشاريين في المكتب
CREATE TABLE public.office_consultant_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id UUID NOT NULL REFERENCES public.consulting_offices(id) ON DELETE CASCADE,
  consultant_id UUID NOT NULL REFERENCES public.environmental_consultants(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'consultant'
    CHECK (role IN ('director', 'senior_consultant', 'consultant', 'assistant', 'delegate', 'trainee')),
  role_title_ar TEXT,
  can_sign_independently BOOLEAN DEFAULT true,
  requires_director_approval BOOLEAN DEFAULT false,
  signing_scope TEXT[] DEFAULT '{}',
  excluded_document_types TEXT[] DEFAULT '{}',
  can_view_all_clients BOOLEAN DEFAULT false,
  assigned_client_ids UUID[] DEFAULT '{}',
  delegated_by UUID REFERENCES public.environmental_consultants(id),
  delegation_scope TEXT,
  delegation_expires_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT now(),
  membership_type TEXT DEFAULT 'linked' CHECK (membership_type IN ('linked', 'internal')),
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(office_id, consultant_id)
);

-- 1.4 جدول ربط المكتب/الاستشاري بالجهات (العملاء)
CREATE TABLE public.consultant_client_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultant_id UUID REFERENCES public.environmental_consultants(id),
  office_id UUID REFERENCES public.consulting_offices(id),
  membership_id UUID REFERENCES public.office_consultant_memberships(id),
  client_organization_id UUID NOT NULL REFERENCES public.organizations(id),
  service_type TEXT NOT NULL DEFAULT 'environmental_oversight'
    CHECK (service_type IN (
      'environmental_oversight', 'waste_management', 'compliance_audit',
      'eia_preparation', 'licensing_support', 'training', 'emergency_response'
    )),
  contract_reference TEXT,
  contract_start DATE,
  contract_end DATE,
  signing_authority JSONB DEFAULT '{}',
  data_access_scope JSONB DEFAULT '{}',
  assigned_by UUID,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT at_least_one_provider CHECK (consultant_id IS NOT NULL OR office_id IS NOT NULL)
);

-- 1.5 جدول سياسات التوقيع للمكتب
CREATE TABLE public.office_signing_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id UUID NOT NULL REFERENCES public.consulting_offices(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL
    CHECK (document_type IN (
      'disposal_certificate', 'compliance_report', 'eia_report',
      'inspection_report', 'waste_manifest', 'training_certificate',
      'emergency_plan', 'corrective_action', 'audit_report',
      'environmental_permit', 'monitoring_report', 'risk_assessment'
    )),
  requires_director_approval BOOLEAN DEFAULT false,
  min_seniority_level TEXT DEFAULT 'consultant'
    CHECK (min_seniority_level IN ('director', 'senior_consultant', 'consultant', 'assistant')),
  requires_office_stamp BOOLEAN DEFAULT true,
  co_signature_required BOOLEAN DEFAULT false,
  co_signer_role TEXT,
  show_consultant_name BOOLEAN DEFAULT true,
  show_consultant_license BOOLEAN DEFAULT true,
  show_office_name BOOLEAN DEFAULT true,
  show_office_license BOOLEAN DEFAULT true,
  show_solidarity_clause BOOLEAN DEFAULT true,
  director_notes TEXT,
  director_modified_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(office_id, document_type)
);

-- 1.6 تطوير جدول التوقيعات الموجود بإضافة سياق المكتب
ALTER TABLE public.consultant_document_signatures
  ADD COLUMN IF NOT EXISTS office_id UUID REFERENCES public.consulting_offices(id),
  ADD COLUMN IF NOT EXISTS membership_id UUID REFERENCES public.office_consultant_memberships(id),
  ADD COLUMN IF NOT EXISTS signed_as_role TEXT,
  ADD COLUMN IF NOT EXISTS office_co_signed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS office_stamp_applied BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS director_approval_status TEXT DEFAULT 'not_required'
    CHECK (director_approval_status IN ('not_required', 'pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS director_approved_by UUID,
  ADD COLUMN IF NOT EXISTS director_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS director_notes TEXT,
  ADD COLUMN IF NOT EXISTS solidarity_statement TEXT;

-- =============================================
-- الفهارس
-- =============================================
CREATE INDEX idx_consulting_offices_org ON public.consulting_offices(organization_id);
CREATE INDEX idx_consulting_offices_director ON public.consulting_offices(director_consultant_id);
CREATE INDEX idx_ocm_office ON public.office_consultant_memberships(office_id);
CREATE INDEX idx_ocm_consultant ON public.office_consultant_memberships(consultant_id);
CREATE INDEX idx_ocm_active ON public.office_consultant_memberships(office_id, is_active);
CREATE INDEX idx_cca_consultant ON public.consultant_client_assignments(consultant_id);
CREATE INDEX idx_cca_office ON public.consultant_client_assignments(office_id);
CREATE INDEX idx_cca_client ON public.consultant_client_assignments(client_organization_id);
CREATE INDEX idx_cca_active ON public.consultant_client_assignments(is_active);
CREATE INDEX idx_osp_office ON public.office_signing_policies(office_id);
CREATE INDEX idx_cds_office ON public.consultant_document_signatures(office_id);
CREATE INDEX idx_cds_approval ON public.consultant_document_signatures(director_approval_status);

-- =============================================
-- RLS Policies
-- =============================================

-- consulting_offices
ALTER TABLE public.consulting_offices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Office members can view their office"
  ON public.consulting_offices FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
    )
    OR
    id IN (
      SELECT co.id FROM public.consulting_offices co
      JOIN public.office_consultant_memberships ocm ON ocm.office_id = co.id
      JOIN public.environmental_consultants ec ON ec.id = ocm.consultant_id
      WHERE ec.user_id = auth.uid() AND ocm.is_active = true
    )
  );

CREATE POLICY "Office org members can insert"
  ON public.consulting_offices FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Office director can update"
  ON public.consulting_offices FOR UPDATE TO authenticated
  USING (
    director_user_id = auth.uid()
    OR organization_id IN (
      SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- office_consultant_memberships
ALTER TABLE public.office_consultant_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view memberships in their office"
  ON public.office_consultant_memberships FOR SELECT TO authenticated
  USING (
    office_id IN (
      SELECT id FROM public.consulting_offices
      WHERE organization_id IN (
        SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
    OR consultant_id IN (
      SELECT id FROM public.environmental_consultants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Office org can manage memberships"
  ON public.office_consultant_memberships FOR INSERT TO authenticated
  WITH CHECK (
    office_id IN (
      SELECT id FROM public.consulting_offices
      WHERE organization_id IN (
        SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Office org can update memberships"
  ON public.office_consultant_memberships FOR UPDATE TO authenticated
  USING (
    office_id IN (
      SELECT id FROM public.consulting_offices
      WHERE organization_id IN (
        SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Office org can delete memberships"
  ON public.office_consultant_memberships FOR DELETE TO authenticated
  USING (
    office_id IN (
      SELECT id FROM public.consulting_offices
      WHERE organization_id IN (
        SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

-- consultant_client_assignments
ALTER TABLE public.consultant_client_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Relevant parties can view assignments"
  ON public.consultant_client_assignments FOR SELECT TO authenticated
  USING (
    -- الاستشاري نفسه
    consultant_id IN (
      SELECT id FROM public.environmental_consultants WHERE user_id = auth.uid()
    )
    -- المكتب
    OR office_id IN (
      SELECT id FROM public.consulting_offices
      WHERE organization_id IN (
        SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
    -- الجهة العميلة
    OR client_organization_id IN (
      SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Consultants or offices can create assignments"
  ON public.consultant_client_assignments FOR INSERT TO authenticated
  WITH CHECK (
    consultant_id IN (
      SELECT id FROM public.environmental_consultants WHERE user_id = auth.uid()
    )
    OR office_id IN (
      SELECT id FROM public.consulting_offices
      WHERE organization_id IN (
        SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Consultants or offices can update assignments"
  ON public.consultant_client_assignments FOR UPDATE TO authenticated
  USING (
    consultant_id IN (
      SELECT id FROM public.environmental_consultants WHERE user_id = auth.uid()
    )
    OR office_id IN (
      SELECT id FROM public.consulting_offices
      WHERE organization_id IN (
        SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

-- office_signing_policies
ALTER TABLE public.office_signing_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Office members can view signing policies"
  ON public.office_signing_policies FOR SELECT TO authenticated
  USING (
    office_id IN (
      SELECT id FROM public.consulting_offices
      WHERE organization_id IN (
        SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
    OR office_id IN (
      SELECT co.id FROM public.consulting_offices co
      JOIN public.office_consultant_memberships ocm ON ocm.office_id = co.id
      JOIN public.environmental_consultants ec ON ec.id = ocm.consultant_id
      WHERE ec.user_id = auth.uid() AND ocm.is_active = true
    )
  );

CREATE POLICY "Office director can manage signing policies"
  ON public.office_signing_policies FOR INSERT TO authenticated
  WITH CHECK (
    office_id IN (
      SELECT id FROM public.consulting_offices
      WHERE director_user_id = auth.uid()
      OR organization_id IN (
        SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Office director can update signing policies"
  ON public.office_signing_policies FOR UPDATE TO authenticated
  USING (
    office_id IN (
      SELECT id FROM public.consulting_offices
      WHERE director_user_id = auth.uid()
      OR organization_id IN (
        SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Office director can delete signing policies"
  ON public.office_signing_policies FOR DELETE TO authenticated
  USING (
    office_id IN (
      SELECT id FROM public.consulting_offices
      WHERE director_user_id = auth.uid()
    )
  );

-- =============================================
-- Trigger لتحديث updated_at
-- =============================================
CREATE TRIGGER update_consulting_offices_updated_at
  BEFORE UPDATE ON public.consulting_offices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ocm_updated_at
  BEFORE UPDATE ON public.office_consultant_memberships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cca_updated_at
  BEFORE UPDATE ON public.consultant_client_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_osp_updated_at
  BEFORE UPDATE ON public.office_signing_policies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
