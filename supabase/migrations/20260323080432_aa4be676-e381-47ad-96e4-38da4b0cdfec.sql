
-- 1. جدول عمال التحميل
CREATE TABLE public.loading_workers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  national_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
  daily_rate NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.loading_workers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can manage loading workers"
  ON public.loading_workers FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 2. جدول جدولة رحلات السائقين
CREATE TABLE public.driver_trip_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES public.profiles(id),
  vehicle_id UUID,
  trip_date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_time TIME,
  end_time TIME,
  route_description TEXT,
  pickup_locations JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  assigned_workers UUID[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.driver_trip_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can manage trip schedules"
  ON public.driver_trip_schedules FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 3. جدول سجلات الوقود
CREATE TABLE public.fuel_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  vehicle_id UUID,
  driver_id UUID REFERENCES public.profiles(id),
  shipment_id UUID REFERENCES public.shipments(id),
  fuel_date DATE NOT NULL DEFAULT CURRENT_DATE,
  fuel_type TEXT DEFAULT 'diesel' CHECK (fuel_type IN ('diesel', 'gasoline', 'gas', 'electric')),
  liters NUMERIC NOT NULL,
  cost_per_liter NUMERIC NOT NULL,
  total_cost NUMERIC GENERATED ALWAYS AS (liters * cost_per_liter) STORED,
  odometer_reading NUMERIC,
  station_name TEXT,
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.fuel_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can manage fuel records"
  ON public.fuel_records FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
