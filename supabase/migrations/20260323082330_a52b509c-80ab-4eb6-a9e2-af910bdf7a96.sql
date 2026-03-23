
-- ═══════════════ طواقم الكنس والنظافة ═══════════════
CREATE TABLE public.sweeping_crews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  crew_name TEXT NOT NULL,
  crew_code TEXT,
  crew_type TEXT NOT NULL DEFAULT 'manual_sweeping',
  zone_id UUID REFERENCES public.service_zones(id) ON DELETE SET NULL,
  supervisor_name TEXT,
  supervisor_phone TEXT,
  worker_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  shift_start TEXT DEFAULT '06:00',
  shift_end TEXT DEFAULT '14:00',
  equipment_summary TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.sweeping_crews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_access_sweeping_crews" ON public.sweeping_crews
  FOR ALL TO authenticated
  USING (organization_id IN (SELECT id FROM public.organizations WHERE id = organization_id))
  WITH CHECK (organization_id IN (SELECT id FROM public.organizations WHERE id = organization_id));

-- ═══════════════ معدات الكنس والنظافة ═══════════════
CREATE TABLE public.sweeping_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  equipment_name TEXT NOT NULL,
  equipment_code TEXT,
  equipment_type TEXT NOT NULL DEFAULT 'broom',
  brand TEXT,
  model TEXT,
  purchase_date DATE,
  purchase_cost NUMERIC(12,2),
  condition TEXT NOT NULL DEFAULT 'good',
  assigned_crew_id UUID REFERENCES public.sweeping_crews(id) ON DELETE SET NULL,
  assigned_zone_id UUID REFERENCES public.service_zones(id) ON DELETE SET NULL,
  fuel_type TEXT,
  plate_number TEXT,
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.sweeping_equipment ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_access_sweeping_equipment" ON public.sweeping_equipment
  FOR ALL TO authenticated
  USING (organization_id IN (SELECT id FROM public.organizations WHERE id = organization_id))
  WITH CHECK (organization_id IN (SELECT id FROM public.organizations WHERE id = organization_id));

-- ═══════════════ حضور وانصراف العمال اليومي ═══════════════
CREATE TABLE public.daily_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  crew_id UUID REFERENCES public.sweeping_crews(id) ON DELETE SET NULL,
  attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  worker_name TEXT NOT NULL,
  worker_code TEXT,
  worker_role TEXT NOT NULL DEFAULT 'sweeper',
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'present',
  overtime_hours NUMERIC(4,2) DEFAULT 0,
  daily_rate NUMERIC(10,2),
  deductions NUMERIC(10,2) DEFAULT 0,
  bonus NUMERIC(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.daily_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_access_daily_attendance" ON public.daily_attendance
  FOR ALL TO authenticated
  USING (organization_id IN (SELECT id FROM public.organizations WHERE id = organization_id))
  WITH CHECK (organization_id IN (SELECT id FROM public.organizations WHERE id = organization_id));

-- ═══════════════ محطات الترحيل ═══════════════
CREATE TABLE public.transfer_stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  station_name TEXT NOT NULL,
  station_code TEXT,
  station_type TEXT NOT NULL DEFAULT 'primary',
  address TEXT,
  governorate TEXT,
  city TEXT,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  capacity_tons_per_day NUMERIC(10,2),
  current_load_tons NUMERIC(10,2) DEFAULT 0,
  operating_hours_start TEXT DEFAULT '06:00',
  operating_hours_end TEXT DEFAULT '22:00',
  contact_person TEXT,
  contact_phone TEXT,
  has_weighbridge BOOLEAN DEFAULT false,
  has_sorting_line BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.transfer_stations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_access_transfer_stations" ON public.transfer_stations
  FOR ALL TO authenticated
  USING (organization_id IN (SELECT id FROM public.organizations WHERE id = organization_id))
  WITH CHECK (organization_id IN (SELECT id FROM public.organizations WHERE id = organization_id));

-- ═══════════════ إضافة أعمدة للجداول الموجودة ═══════════════

-- تحسين جدول street_bins بأعمدة الواقع المصري
ALTER TABLE public.street_bins 
  ADD COLUMN IF NOT EXISTS material TEXT DEFAULT 'metal',
  ADD COLUMN IF NOT EXISTS color TEXT DEFAULT 'green',
  ADD COLUMN IF NOT EXISTS condition TEXT DEFAULT 'good',
  ADD COLUMN IF NOT EXISTS installation_date DATE,
  ADD COLUMN IF NOT EXISTS last_painted_at DATE,
  ADD COLUMN IF NOT EXISTS needs_replacement BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS assigned_crew_id UUID REFERENCES public.sweeping_crews(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS collection_frequency TEXT DEFAULT 'daily',
  ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- تحسين جدول collection_trips بتفاصيل تشغيلية
ALTER TABLE public.collection_trips 
  ADD COLUMN IF NOT EXISTS crew_id UUID REFERENCES public.sweeping_crews(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS trip_type TEXT DEFAULT 'bin_collection',
  ADD COLUMN IF NOT EXISTS vehicle_plate TEXT,
  ADD COLUMN IF NOT EXISTS transfer_station_id UUID REFERENCES public.transfer_stations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS bags_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS photo_before_url TEXT,
  ADD COLUMN IF NOT EXISTS photo_after_url TEXT,
  ADD COLUMN IF NOT EXISTS supervisor_approved BOOLEAN DEFAULT false;

-- تحسين جدول service_zones بتفاصيل التشغيل
ALTER TABLE public.service_zones
  ADD COLUMN IF NOT EXISTS streets_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_waste_estimate_tons NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS assigned_crews_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS transfer_station_id UUID REFERENCES public.transfer_stations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS contract_start_date DATE,
  ADD COLUMN IF NOT EXISTS contract_end_date DATE,
  ADD COLUMN IF NOT EXISTS contract_value NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS payment_frequency TEXT DEFAULT 'monthly';
