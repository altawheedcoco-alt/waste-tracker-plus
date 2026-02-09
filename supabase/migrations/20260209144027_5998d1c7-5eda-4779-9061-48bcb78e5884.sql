
-- Trip Costs table - track costs per shipment/trip
CREATE TABLE public.trip_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  shipment_id UUID REFERENCES public.shipments(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  fuel_cost NUMERIC(12,2) DEFAULT 0,
  toll_fees NUMERIC(12,2) DEFAULT 0,
  maintenance_cost NUMERIC(12,2) DEFAULT 0,
  labor_cost NUMERIC(12,2) DEFAULT 0,
  other_costs NUMERIC(12,2) DEFAULT 0,
  total_cost NUMERIC(12,2) GENERATED ALWAYS AS (fuel_cost + toll_fees + maintenance_cost + labor_cost + other_costs) STORED,
  revenue NUMERIC(12,2) DEFAULT 0,
  profit NUMERIC(12,2) GENERATED ALWAYS AS (revenue - (fuel_cost + toll_fees + maintenance_cost + labor_cost + other_costs)) STORED,
  distance_km NUMERIC(10,2) DEFAULT 0,
  notes TEXT,
  trip_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.trip_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org trip costs"
  ON public.trip_costs FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert own org trip costs"
  ON public.trip_costs FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update own org trip costs"
  ON public.trip_costs FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete own org trip costs"
  ON public.trip_costs FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

-- Vehicle Maintenance table
CREATE TABLE public.vehicle_maintenance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  vehicle_plate VARCHAR(50) NOT NULL,
  maintenance_type VARCHAR(100) NOT NULL,
  description TEXT,
  cost NUMERIC(12,2) DEFAULT 0,
  odometer_km NUMERIC(10,0),
  next_maintenance_km NUMERIC(10,0),
  next_maintenance_date DATE,
  performed_at DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'completed',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vehicle_maintenance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org maintenance"
  ON public.vehicle_maintenance FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert own org maintenance"
  ON public.vehicle_maintenance FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update own org maintenance"
  ON public.vehicle_maintenance FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete own org maintenance"
  ON public.vehicle_maintenance FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

-- Triggers for updated_at
CREATE TRIGGER update_trip_costs_updated_at
  BEFORE UPDATE ON public.trip_costs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vehicle_maintenance_updated_at
  BEFORE UPDATE ON public.vehicle_maintenance
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
