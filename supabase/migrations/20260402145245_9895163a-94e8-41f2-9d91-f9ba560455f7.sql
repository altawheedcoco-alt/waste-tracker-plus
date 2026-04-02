
-- جدول فحص المركبات (DVIR - Driver Vehicle Inspection Report)
CREATE TABLE public.vehicle_inspections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  inspector_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  vehicle_plate TEXT NOT NULL,
  inspection_type TEXT NOT NULL DEFAULT 'pre_trip',
  status TEXT NOT NULL DEFAULT 'passed',
  odometer_reading NUMERIC,
  fuel_level TEXT,
  inspection_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  defects_found JSONB DEFAULT '[]'::jsonb,
  photos JSONB DEFAULT '[]'::jsonb,
  gps_location JSONB,
  notes TEXT,
  next_inspection_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vehicle_inspections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org inspections"
  ON public.vehicle_inspections FOR SELECT TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can create inspections for their org"
  ON public.vehicle_inspections FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update their org inspections"
  ON public.vehicle_inspections FOR UPDATE TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));
