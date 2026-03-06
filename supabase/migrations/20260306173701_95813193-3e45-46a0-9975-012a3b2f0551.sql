-- 1. Add LTRA and IDA to regulator_levels
INSERT INTO regulator_levels (level_code, level_name_ar, level_name_en, parent_level_code, scope, can_issue_penalties, can_suspend_licenses, can_ban_organizations, can_track_vehicles, can_view_all_shipments, can_field_inspect, description_ar)
VALUES 
  ('ltra', 'جهاز تنظيم النقل البري', 'Land Transport Regulatory Authority', NULL, 'national', true, true, true, true, true, true, 'الجهة المسؤولة عن تنظيم ورقابة نشاط النقل البري وإصدار التراخيص اللازمة'),
  ('ida', 'الهيئة العامة للتنمية الصناعية', 'Industrial Development Authority', 'ministry', 'national', true, true, false, false, false, true, 'الجهة المسؤولة عن إصدار التراخيص الصناعية وتصاريح التشغيل للمصانع ومرافق التدوير');

-- 2. Create regulator_jurisdictions table
CREATE TABLE public.regulator_jurisdictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  regulator_level_code text NOT NULL,
  supervised_org_type text NOT NULL,
  supervision_scope text NOT NULL DEFAULT 'full',
  license_types text[] DEFAULT '{}',
  legal_reference text,
  legal_reference_ar text,
  is_primary_authority boolean DEFAULT false,
  can_issue_license boolean DEFAULT false,
  can_revoke_license boolean DEFAULT false,
  can_inspect boolean DEFAULT true,
  can_penalize boolean DEFAULT true,
  hierarchy_priority int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.regulator_jurisdictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read jurisdictions"
  ON public.regulator_jurisdictions FOR SELECT TO authenticated
  USING (true);

-- 3. WMRA: Supreme authority over ALL entity types (hierarchy_priority=100)
INSERT INTO regulator_jurisdictions (regulator_level_code, supervised_org_type, supervision_scope, license_types, legal_reference, legal_reference_ar, is_primary_authority, can_issue_license, can_revoke_license, hierarchy_priority)
VALUES
  ('wmra', 'generator', 'full', ARRAY['wmra_permit','waste_management_permit'], 'Law 202/2020 Art. 28-35', 'قانون 202 لسنة 2020 - المواد 28-35', true, true, true, 100),
  ('wmra', 'transporter', 'full', ARRAY['transport_permit','hazardous_transport'], 'Law 202/2020 Art. 36-42', 'قانون 202 لسنة 2020 - المواد 36-42', false, true, true, 100),
  ('wmra', 'recycler', 'full', ARRAY['recycling_permit','waste_processing'], 'Law 202/2020 Art. 43-50', 'قانون 202 لسنة 2020 - المواد 43-50', true, true, true, 100),
  ('wmra', 'disposal', 'full', ARRAY['disposal_permit','landfill_license'], 'Law 202/2020 Art. 51-58', 'قانون 202 لسنة 2020 - المواد 51-58', true, true, true, 100),
  ('wmra', 'consultant', 'full', ARRAY['environmental_consultant'], 'Law 202/2020 Art. 60', 'قانون 202 لسنة 2020 - المادة 60', true, true, true, 100),
  ('wmra', 'consulting_office', 'full', ARRAY['consulting_office_license'], 'Law 202/2020 Art. 60', 'قانون 202 لسنة 2020 - المادة 60', true, true, true, 100),
  ('wmra', 'iso_body', 'full', ARRAY['accreditation_certificate'], 'Law 202/2020 Art. 62', 'قانون 202 لسنة 2020 - المادة 62', false, false, false, 100);

-- EEAA: Environmental oversight (hierarchy_priority=90)
INSERT INTO regulator_jurisdictions (regulator_level_code, supervised_org_type, supervision_scope, license_types, legal_reference, legal_reference_ar, is_primary_authority, can_issue_license, can_revoke_license, hierarchy_priority)
VALUES
  ('eeaa', 'generator', 'environmental', ARRAY['environmental_approval','eia_certificate'], 'Law 4/1994 Art. 19-29', 'قانون 4 لسنة 1994 - المواد 19-29', false, true, true, 90),
  ('eeaa', 'recycler', 'environmental', ARRAY['environmental_approval','emissions_permit'], 'Law 4/1994 Art. 30-40', 'قانون 4 لسنة 1994 - المواد 30-40', false, true, true, 90),
  ('eeaa', 'disposal', 'environmental', ARRAY['environmental_approval','disposal_eia'], 'Law 4/1994 Art. 41-50', 'قانون 4 لسنة 1994 - المواد 41-50', false, true, true, 90);

-- LTRA: Transport oversight (hierarchy_priority=95)
INSERT INTO regulator_jurisdictions (regulator_level_code, supervised_org_type, supervision_scope, license_types, legal_reference, legal_reference_ar, is_primary_authority, can_issue_license, can_revoke_license, hierarchy_priority)
VALUES
  ('ltra', 'transporter', 'transport', ARRAY['transport_license','vehicle_registration','driver_license','hazmat_transport_cert'], 'LTRA Law', 'قانون جهاز تنظيم النقل البري ولوائحه التنفيذية', true, true, true, 95);

-- IDA: Industrial oversight (hierarchy_priority=85)
INSERT INTO regulator_jurisdictions (regulator_level_code, supervised_org_type, supervision_scope, license_types, legal_reference, legal_reference_ar, is_primary_authority, can_issue_license, can_revoke_license, hierarchy_priority)
VALUES
  ('ida', 'recycler', 'industrial', ARRAY['industrial_license','factory_operation_permit','industrial_safety'], 'Industrial Development Law', 'قانون التنمية الصناعية ولوائحه التنفيذية', true, true, true, 85),
  ('ida', 'disposal', 'industrial', ARRAY['industrial_license'], 'Industrial Development Law', 'قانون التنمية الصناعية', false, true, false, 85);

-- 4. Add issuing_authority_code to legal_licenses
ALTER TABLE legal_licenses ADD COLUMN IF NOT EXISTS issuing_authority_code text;

-- 5. Indexes
CREATE INDEX idx_regulator_jurisdictions_level ON regulator_jurisdictions(regulator_level_code);
CREATE INDEX idx_regulator_jurisdictions_org_type ON regulator_jurisdictions(supervised_org_type);
CREATE INDEX idx_legal_licenses_authority_code ON legal_licenses(issuing_authority_code);