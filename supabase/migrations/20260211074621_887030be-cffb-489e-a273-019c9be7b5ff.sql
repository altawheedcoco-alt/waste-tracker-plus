-- Add owns_transport_fleet flag to disposal_facilities
ALTER TABLE public.disposal_facilities 
ADD COLUMN IF NOT EXISTS owns_transport_fleet boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS transport_price_per_km numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS transport_flat_rate numeric DEFAULT 0;

-- Create disposal_fleet_vehicles table for fleet management
CREATE TABLE IF NOT EXISTS public.disposal_fleet_vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  disposal_facility_id UUID REFERENCES public.disposal_facilities(id),
  plate_number TEXT NOT NULL,
  vehicle_type TEXT DEFAULT 'truck',
  model TEXT,
  year INTEGER,
  capacity_tons NUMERIC DEFAULT 0,
  hazmat_license_number TEXT,
  hazmat_license_expiry DATE,
  maintenance_due_date DATE,
  status TEXT DEFAULT 'available',
  driver_id UUID REFERENCES public.drivers(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.disposal_fleet_vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org fleet vehicles"
  ON public.disposal_fleet_vehicles FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage own org fleet vehicles"
  ON public.disposal_fleet_vehicles FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid()
  ));

-- Create disposal_trips table for trip tracking
CREATE TABLE IF NOT EXISTS public.disposal_trips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  disposal_facility_id UUID REFERENCES public.disposal_facilities(id),
  operation_id UUID REFERENCES public.disposal_operations(id),
  vehicle_id UUID REFERENCES public.disposal_fleet_vehicles(id),
  driver_id UUID REFERENCES public.drivers(id),
  client_name TEXT,
  client_address TEXT,
  pickup_lat NUMERIC,
  pickup_lng NUMERIC,
  facility_lat NUMERIC,
  facility_lng NUMERIC,
  distance_km NUMERIC,
  transport_cost NUMERIC DEFAULT 0,
  disposal_cost NUMERIC DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'planned',
  departed_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  arrived_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.disposal_trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org disposal trips"
  ON public.disposal_trips FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage own org disposal trips"
  ON public.disposal_trips FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid()
  ));
