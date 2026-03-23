
-- العقود الحكومية
CREATE TABLE public.municipal_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contract_number TEXT NOT NULL,
  contract_title TEXT NOT NULL,
  contracting_authority TEXT NOT NULL,
  authority_type TEXT DEFAULT 'governorate',
  area_description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  monthly_value NUMERIC DEFAULT 0,
  annual_value NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'active',
  kpi_coverage_target NUMERIC DEFAULT 95,
  kpi_max_complaints INTEGER DEFAULT 10,
  kpi_min_tonnage NUMERIC DEFAULT 0,
  kpi_response_time_hours INTEGER DEFAULT 24,
  actual_coverage NUMERIC DEFAULT 0,
  actual_complaints INTEGER DEFAULT 0,
  actual_tonnage NUMERIC DEFAULT 0,
  sla_compliance_percent NUMERIC DEFAULT 100,
  penalties_total NUMERIC DEFAULT 0,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.municipal_contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_access_municipal_contracts" ON public.municipal_contracts FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- إثبات الأداء الميداني
CREATE TABLE public.proof_of_service (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  trip_id UUID,
  zone_id UUID,
  location_lat NUMERIC,
  location_lng NUMERIC,
  photo_before_url TEXT,
  photo_after_url TEXT,
  supervisor_name TEXT,
  supervisor_signature_url TEXT,
  service_type TEXT DEFAULT 'collection',
  notes TEXT,
  recorded_by UUID,
  recorded_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.proof_of_service ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_access_proof_of_service" ON public.proof_of_service FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- حوادث وسلامة العمال
CREATE TABLE public.worker_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  incident_type TEXT NOT NULL DEFAULT 'work_injury',
  severity TEXT DEFAULT 'minor',
  incident_date DATE NOT NULL DEFAULT CURRENT_DATE,
  location_description TEXT,
  worker_name TEXT,
  worker_id UUID,
  crew_id UUID,
  zone_id UUID,
  description TEXT,
  actions_taken TEXT,
  medical_report_url TEXT,
  status TEXT DEFAULT 'reported',
  days_lost INTEGER DEFAULT 0,
  follow_up_date DATE,
  reported_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.worker_incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_access_worker_incidents" ON public.worker_incidents FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- عُهد المستلزمات
CREATE TABLE public.equipment_custody (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  item_category TEXT DEFAULT 'tools',
  quantity_issued INTEGER DEFAULT 0,
  quantity_returned INTEGER DEFAULT 0,
  quantity_damaged INTEGER DEFAULT 0,
  unit_cost NUMERIC DEFAULT 0,
  issued_to_name TEXT,
  issued_to_worker_id UUID,
  issued_to_crew_id UUID,
  issue_date DATE DEFAULT CURRENT_DATE,
  return_date DATE,
  condition_on_return TEXT,
  notes TEXT,
  issued_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.equipment_custody ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_access_equipment_custody" ON public.equipment_custody FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
