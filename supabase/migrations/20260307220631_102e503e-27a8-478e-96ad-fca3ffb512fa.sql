
-- =============================================
-- 1. جدولة الورديات وتوزيع المهام
-- =============================================
CREATE TABLE public.driver_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  shift_date DATE NOT NULL,
  start_time TIME NOT NULL DEFAULT '08:00',
  end_time TIME NOT NULL DEFAULT '17:00',
  shift_type TEXT NOT NULL DEFAULT 'morning',
  status TEXT NOT NULL DEFAULT 'scheduled',
  assigned_vehicle_id UUID REFERENCES public.fleet_vehicles(id),
  assigned_zone TEXT,
  max_shipments INTEGER DEFAULT 10,
  actual_shipments INTEGER DEFAULT 0,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(driver_id, shift_date, shift_type)
);

ALTER TABLE public.driver_shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_manage_shifts" ON public.driver_shifts
  FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()));

-- =============================================
-- 2. SLA ومقاييس الخدمة
-- =============================================
CREATE TABLE public.partner_sla_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  partner_organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  period_month DATE NOT NULL,
  total_shipments INTEGER DEFAULT 0,
  on_time_pickups INTEGER DEFAULT 0,
  on_time_deliveries INTEGER DEFAULT 0,
  avg_pickup_delay_minutes INTEGER DEFAULT 0,
  avg_delivery_delay_minutes INTEGER DEFAULT 0,
  weight_accuracy_percentage NUMERIC(5,2) DEFAULT 100,
  damage_incidents INTEGER DEFAULT 0,
  complaints_count INTEGER DEFAULT 0,
  sla_score NUMERIC(5,2) DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, partner_organization_id, period_month)
);

ALTER TABLE public.partner_sla_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_view_sla" ON public.partner_sla_metrics
  FOR SELECT TO authenticated
  USING (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
    OR partner_organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "org_members_manage_sla" ON public.partner_sla_metrics
  FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "org_members_update_sla" ON public.partner_sla_metrics
  FOR UPDATE TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()));

-- =============================================
-- 3. إدارة الحاويات والأصول
-- =============================================
CREATE TABLE public.fleet_containers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  container_code TEXT NOT NULL,
  container_type TEXT NOT NULL DEFAULT 'standard',
  capacity_liters NUMERIC(10,2),
  current_location TEXT,
  current_latitude NUMERIC(10,7),
  current_longitude NUMERIC(10,7),
  assigned_vehicle_id UUID REFERENCES public.fleet_vehicles(id),
  assigned_generator_id UUID REFERENCES public.organizations(id),
  status TEXT NOT NULL DEFAULT 'available',
  condition TEXT DEFAULT 'good',
  last_cleaned_at TIMESTAMPTZ,
  last_maintenance_at TIMESTAMPTZ,
  next_maintenance_at TIMESTAMPTZ,
  purchase_date DATE,
  purchase_cost NUMERIC(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, container_code)
);

ALTER TABLE public.fleet_containers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_manage_containers" ON public.fleet_containers
  FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()));

-- =============================================
-- 4. سجل إعادة التعيين عند الأعطال
-- =============================================
CREATE TABLE public.vehicle_reassignment_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  original_vehicle_id UUID NOT NULL REFERENCES public.fleet_vehicles(id),
  replacement_vehicle_id UUID REFERENCES public.fleet_vehicles(id),
  shipment_id UUID REFERENCES public.shipments(id),
  reason TEXT NOT NULL DEFAULT 'breakdown',
  status TEXT NOT NULL DEFAULT 'pending',
  original_driver_id UUID REFERENCES public.drivers(id),
  replacement_driver_id UUID REFERENCES public.drivers(id),
  reassigned_by UUID,
  reassigned_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vehicle_reassignment_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_manage_reassignment" ON public.vehicle_reassignment_log
  FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()));
