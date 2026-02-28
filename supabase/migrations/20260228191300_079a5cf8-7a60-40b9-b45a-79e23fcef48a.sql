
-- ═══════════════════════════════════════════════════════
-- منظومة السيفتي الشاملة - الجداول الجديدة
-- ═══════════════════════════════════════════════════════

-- 1. الهيكل الوظيفي للسلامة (Safety Team Roles)
CREATE TABLE public.safety_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id),
  -- For unregistered workers/drivers
  external_name TEXT,
  external_phone TEXT,
  external_id_number TEXT,
  is_registered BOOLEAN DEFAULT true,
  
  role TEXT NOT NULL, -- safety_manager, safety_engineer, safety_supervisor, safety_officer, site_paramedic
  role_ar TEXT NOT NULL,
  specialization TEXT, -- fire, chemical, construction, transport, medical
  certification_number TEXT,
  certification_expiry DATE,
  certification_photo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  assigned_sites TEXT[], -- locations/areas they cover
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.safety_team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members manage safety team" ON public.safety_team_members FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 2. سجل المخاطر (Hazard Register)
CREATE TABLE public.hazard_registers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  reported_by UUID REFERENCES public.profiles(id),
  
  hazard_title TEXT NOT NULL,
  hazard_description TEXT,
  hazard_category TEXT NOT NULL, -- physical, chemical, biological, ergonomic, psychosocial, environmental
  location TEXT,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  photo_urls TEXT[],
  
  -- Risk Assessment Matrix
  likelihood INTEGER NOT NULL DEFAULT 1, -- 1-5
  severity INTEGER NOT NULL DEFAULT 1, -- 1-5
  risk_score INTEGER GENERATED ALWAYS AS (likelihood * severity) STORED,
  risk_level TEXT, -- low, medium, high, critical
  
  -- Controls
  existing_controls TEXT,
  recommended_controls TEXT,
  control_type TEXT, -- elimination, substitution, engineering, administrative, ppe
  responsible_person UUID REFERENCES public.profiles(id),
  target_date DATE,
  
  status TEXT NOT NULL DEFAULT 'identified', -- identified, assessed, controlled, closed, escalated
  review_date DATE,
  
  -- Cross-entity linking
  linked_entity_id UUID,
  linked_entity_type TEXT, -- transporter, generator, recycler, disposal
  linked_shipment_id UUID REFERENCES public.shipments(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hazard_registers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members manage hazards" ON public.hazard_registers FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 3. تتبع معدات الوقاية الشخصية (PPE Tracking)
CREATE TABLE public.ppe_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES public.profiles(id),
  -- For unregistered workers
  external_worker_name TEXT,
  external_worker_phone TEXT,
  is_registered_worker BOOLEAN DEFAULT true,
  
  ppe_type TEXT NOT NULL, -- helmet, gloves, goggles, mask, vest, boots, ear_protection, face_shield, respirator, full_body_suit
  ppe_type_ar TEXT NOT NULL,
  serial_number TEXT,
  brand TEXT,
  size TEXT,
  
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE,
  last_inspection_date DATE,
  condition TEXT DEFAULT 'good', -- good, fair, damaged, expired, replaced
  
  acknowledgment_signed BOOLEAN DEFAULT false,
  acknowledgment_date TIMESTAMPTZ,
  photo_url TEXT,
  notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ppe_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members manage PPE" ON public.ppe_assignments FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 4. تحليل مخاطر الوظيفة (JSA - Job Safety Analysis)
CREATE TABLE public.jsa_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id),
  
  job_title TEXT NOT NULL,
  job_location TEXT,
  department TEXT,
  date_of_analysis DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Steps breakdown as JSON array
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Each step: { step_number, description, hazards, controls, responsible, ppe_required }
  
  overall_risk_level TEXT DEFAULT 'medium', -- low, medium, high, critical
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, pending_approval, approved, archived
  
  -- Cross-entity
  linked_entity_id UUID,
  linked_entity_type TEXT,
  
  review_frequency TEXT DEFAULT 'quarterly', -- monthly, quarterly, semi_annual, annual
  next_review_date DATE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.jsa_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members manage JSA" ON public.jsa_analyses FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 5. محادثات صندوق الأدوات (Toolbox Talks)
CREATE TABLE public.toolbox_talks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  conducted_by UUID REFERENCES public.profiles(id),
  
  topic TEXT NOT NULL,
  topic_category TEXT, -- fire_safety, chemical_handling, ppe_usage, lifting, housekeeping, driving, emergency, heat_stress, confined_space, electrical
  description TEXT,
  duration_minutes INTEGER DEFAULT 10,
  talk_date DATE NOT NULL DEFAULT CURRENT_DATE,
  talk_time TIME,
  location TEXT,
  
  -- Attendees (mix of registered and unregistered)
  attendees JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Each: { name, phone, profile_id?, is_registered, role, signed }
  attendee_count INTEGER DEFAULT 0,
  
  key_points TEXT[],
  materials_urls TEXT[],
  photo_urls TEXT[],
  
  -- Cross-entity: linked org that participated
  linked_entity_id UUID,
  linked_entity_type TEXT,
  
  status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled, completed, cancelled
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.toolbox_talks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members manage toolbox talks" ON public.toolbox_talks FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 6. جولات التفتيش الدورية (Safety Inspections)
CREATE TABLE public.safety_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  inspector_id UUID REFERENCES public.profiles(id),
  
  inspection_type TEXT NOT NULL, -- routine, special, follow_up, pre_operation, post_incident
  inspection_type_ar TEXT,
  area_inspected TEXT NOT NULL,
  inspection_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Checklist items as JSONB
  checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Each: { item, category, status: pass/fail/na, comment, photo_url }
  
  total_items INTEGER DEFAULT 0,
  passed_items INTEGER DEFAULT 0,
  failed_items INTEGER DEFAULT 0,
  compliance_score NUMERIC, -- percentage
  
  findings TEXT,
  corrective_actions TEXT,
  corrective_deadline DATE,
  corrective_responsible UUID REFERENCES public.profiles(id),
  
  -- Cross-entity
  linked_entity_id UUID,
  linked_entity_type TEXT,
  linked_vehicle_id UUID,
  linked_driver_id UUID,
  
  status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled, in_progress, completed, follow_up_required
  follow_up_inspection_id UUID REFERENCES public.safety_inspections(id),
  
  photo_urls TEXT[],
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.safety_inspections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members manage inspections" ON public.safety_inspections FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 7. شهادات السلامة (Safety Certificates)
CREATE TABLE public.safety_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  issued_by UUID REFERENCES public.profiles(id),
  
  certificate_type TEXT NOT NULL, -- ppe_compliance, fire_safety, hazard_control, first_aid, vehicle_safety, driver_safety, toolbox_completion, inspection_clearance, training_completion, site_clearance
  certificate_type_ar TEXT NOT NULL,
  certificate_number TEXT NOT NULL,
  
  -- Recipient (can be person, vehicle, site, or linked entity)
  recipient_type TEXT NOT NULL, -- employee, driver, worker, vehicle, site, organization
  recipient_id UUID,
  recipient_name TEXT NOT NULL,
  recipient_org_id UUID REFERENCES public.organizations(id),
  
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE,
  
  -- Source reference
  source_type TEXT, -- inspection, training, jsa, toolbox_talk, incident_closure
  source_id UUID,
  
  -- Certificate content
  description TEXT,
  findings_summary TEXT,
  compliance_score NUMERIC,
  
  -- Digital verification
  qr_data TEXT,
  verification_code TEXT,
  hash_sha256 TEXT,
  
  status TEXT NOT NULL DEFAULT 'active', -- active, expired, revoked, suspended
  revoked_reason TEXT,
  
  pdf_url TEXT,
  
  -- Cross-entity distribution
  shared_with_entities JSONB DEFAULT '[]'::jsonb,
  -- Each: { entity_id, entity_type, shared_at }
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.safety_certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members manage certificates" ON public.safety_certificates FOR ALL TO authenticated
  USING (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    OR recipient_org_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

-- Indexes for performance
CREATE INDEX idx_safety_team_org ON public.safety_team_members(organization_id);
CREATE INDEX idx_hazard_org ON public.hazard_registers(organization_id);
CREATE INDEX idx_hazard_risk ON public.hazard_registers(risk_score DESC);
CREATE INDEX idx_ppe_org ON public.ppe_assignments(organization_id);
CREATE INDEX idx_ppe_expiry ON public.ppe_assignments(expiry_date);
CREATE INDEX idx_jsa_org ON public.jsa_analyses(organization_id);
CREATE INDEX idx_toolbox_org ON public.toolbox_talks(organization_id);
CREATE INDEX idx_toolbox_date ON public.toolbox_talks(talk_date DESC);
CREATE INDEX idx_inspection_org ON public.safety_inspections(organization_id);
CREATE INDEX idx_inspection_date ON public.safety_inspections(inspection_date DESC);
CREATE INDEX idx_certificate_org ON public.safety_certificates(organization_id);
CREATE INDEX idx_certificate_recipient ON public.safety_certificates(recipient_id);
CREATE INDEX idx_certificate_expiry ON public.safety_certificates(expiry_date);
CREATE INDEX idx_certificate_number ON public.safety_certificates(certificate_number);
