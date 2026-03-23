
-- 1. إضافة نوع الجهة الجديد
ALTER TYPE public.organization_type ADD VALUE IF NOT EXISTS 'municipal_contractor';

-- 2. جدول مناطق الخدمة (الأحياء/المدن)
CREATE TABLE public.service_zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  zone_name TEXT NOT NULL,
  zone_code TEXT,
  governorate TEXT,
  city TEXT,
  district TEXT,
  area_km2 NUMERIC,
  population_estimate INTEGER,
  bin_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  contract_reference TEXT,
  boundary_geojson JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.service_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members manage service zones"
  ON public.service_zones FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 3. سجل الصناديق والحاويات الميدانية
CREATE TABLE public.street_bins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  zone_id UUID REFERENCES public.service_zones(id) ON DELETE SET NULL,
  bin_code TEXT NOT NULL,
  bin_type TEXT DEFAULT 'standard' CHECK (bin_type IN ('standard', 'large_container', 'underground', 'smart', 'recycling_station')),
  capacity_liters INTEGER DEFAULT 1100,
  latitude NUMERIC,
  longitude NUMERIC,
  address TEXT,
  landmark TEXT,
  fill_level_percent INTEGER DEFAULT 0,
  last_collected_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'damaged', 'missing', 'maintenance', 'decommissioned')),
  has_sensor BOOLEAN DEFAULT false,
  sensor_id TEXT,
  photo_url TEXT,
  installed_at DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.street_bins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members manage street bins"
  ON public.street_bins FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 4. مسارات الجمع اليومية
CREATE TABLE public.collection_routes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  zone_id UUID REFERENCES public.service_zones(id) ON DELETE SET NULL,
  route_name TEXT NOT NULL,
  route_code TEXT,
  route_type TEXT DEFAULT 'bin_collection' CHECK (route_type IN ('bin_collection', 'street_sweeping', 'door_to_door', 'transfer_station', 'special')),
  assigned_vehicle_id UUID,
  assigned_driver_id UUID REFERENCES public.profiles(id),
  schedule_days TEXT[] DEFAULT '{}',
  start_time TIME DEFAULT '05:00',
  end_time TIME DEFAULT '13:00',
  estimated_bins INTEGER DEFAULT 0,
  estimated_distance_km NUMERIC,
  waypoints JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.collection_routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members manage collection routes"
  ON public.collection_routes FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 5. سجل رحلات الجمع الفعلية
CREATE TABLE public.collection_trips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  route_id UUID REFERENCES public.collection_routes(id) ON DELETE SET NULL,
  zone_id UUID REFERENCES public.service_zones(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES public.profiles(id),
  trip_date DATE NOT NULL DEFAULT CURRENT_DATE,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  bins_collected INTEGER DEFAULT 0,
  total_bins INTEGER DEFAULT 0,
  weight_tons NUMERIC,
  distance_km NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'incomplete')),
  completion_percent NUMERIC DEFAULT 0,
  gps_track JSONB,
  photo_proofs TEXT[] DEFAULT '{}',
  issues TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.collection_trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members manage collection trips"
  ON public.collection_trips FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 6. شكاوى المواطنين
CREATE TABLE public.citizen_complaints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  zone_id UUID REFERENCES public.service_zones(id) ON DELETE SET NULL,
  complaint_number TEXT NOT NULL DEFAULT ('CMP-' || LPAD(floor(random() * 999999)::text, 6, '0')),
  citizen_name TEXT,
  citizen_phone TEXT,
  complaint_type TEXT NOT NULL CHECK (complaint_type IN ('missed_collection', 'overflowing_bin', 'damaged_bin', 'street_dirty', 'bad_smell', 'illegal_dumping', 'noise', 'worker_behavior', 'schedule_change', 'other')),
  description TEXT,
  location_text TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  photo_urls TEXT[] DEFAULT '{}',
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in_progress', 'resolved', 'closed', 'rejected')),
  assigned_to UUID REFERENCES public.profiles(id),
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  response_time_minutes INTEGER,
  satisfaction_rating INTEGER,
  source TEXT DEFAULT 'platform' CHECK (source IN ('platform', 'hotline', 'field', 'government', 'social_media')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.citizen_complaints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members manage complaints"
  ON public.citizen_complaints FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 7. سجل الغرامات والجزاءات
CREATE TABLE public.contract_penalties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  zone_id UUID REFERENCES public.service_zones(id),
  trip_id UUID REFERENCES public.collection_trips(id),
  complaint_id UUID REFERENCES public.citizen_complaints(id),
  penalty_type TEXT NOT NULL CHECK (penalty_type IN ('missed_collection', 'late_collection', 'incomplete_coverage', 'citizen_complaint', 'equipment_damage', 'safety_violation', 'reporting_delay', 'other')),
  amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  penalty_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'appealed', 'waived', 'paid')),
  issued_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contract_penalties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members manage penalties"
  ON public.contract_penalties FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
