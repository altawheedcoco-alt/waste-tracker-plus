
-- =============================================
-- 1. SMART DRIVER ASSIGNMENT
-- =============================================
CREATE TABLE IF NOT EXISTS public.driver_assignment_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_id uuid REFERENCES public.shipments(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES public.drivers(id),
  organization_id uuid REFERENCES public.organizations(id),
  assignment_type text NOT NULL DEFAULT 'manual', -- manual, auto_nearest, auto_optimal
  distance_km numeric,
  score numeric, -- compatibility score
  reason text,
  status text DEFAULT 'assigned', -- assigned, accepted, rejected, expired
  assigned_at timestamptz DEFAULT now(),
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.driver_assignment_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can view assignment logs" ON public.driver_assignment_logs FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Org members can insert assignment logs" ON public.driver_assignment_logs FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- =============================================
-- 2. PREDICTIVE FLEET MAINTENANCE
-- =============================================
CREATE TABLE IF NOT EXISTS public.vehicle_maintenance (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES public.drivers(id),
  vehicle_plate text NOT NULL,
  maintenance_type text NOT NULL, -- oil_change, tire_rotation, brake_inspection, engine_check, full_service
  status text DEFAULT 'scheduled', -- scheduled, in_progress, completed, overdue
  scheduled_date date NOT NULL,
  completed_date date,
  cost numeric DEFAULT 0,
  odometer_km numeric,
  next_due_km numeric,
  next_due_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vehicle_maintenance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can manage maintenance" ON public.vehicle_maintenance FOR ALL
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.vehicle_telemetry (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  vehicle_plate text NOT NULL,
  driver_id uuid REFERENCES public.drivers(id),
  total_km numeric DEFAULT 0,
  total_trips integer DEFAULT 0,
  total_load_tons numeric DEFAULT 0,
  avg_fuel_consumption numeric,
  last_maintenance_km numeric DEFAULT 0,
  last_maintenance_date date,
  health_score numeric DEFAULT 100, -- 0-100
  risk_level text DEFAULT 'low', -- low, medium, high, critical
  alerts jsonb DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, vehicle_plate)
);

ALTER TABLE public.vehicle_telemetry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can manage telemetry" ON public.vehicle_telemetry FOR ALL
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- =============================================
-- 3. FRAUD DETECTION
-- =============================================
CREATE TABLE IF NOT EXISTS public.fraud_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  shipment_id uuid REFERENCES public.shipments(id),
  alert_type text NOT NULL, -- weight_anomaly, route_deviation, duplicate_shipment, suspicious_timing, price_anomaly
  severity text DEFAULT 'medium', -- low, medium, high, critical
  description text NOT NULL,
  evidence jsonb,
  status text DEFAULT 'open', -- open, investigating, resolved, dismissed
  resolved_by uuid REFERENCES public.profiles(id),
  resolved_at timestamptz,
  resolution_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fraud_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can view fraud alerts" ON public.fraud_alerts FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Org members can update fraud alerts" ON public.fraud_alerts FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- =============================================
-- 4. WASTE MARKETPLACE
-- =============================================
CREATE TABLE IF NOT EXISTS public.marketplace_listings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  listing_number text NOT NULL DEFAULT '',
  title text NOT NULL,
  waste_type text NOT NULL,
  waste_description text,
  quantity numeric NOT NULL,
  unit text DEFAULT 'طن',
  pickup_address text,
  pickup_city text,
  pickup_latitude numeric,
  pickup_longitude numeric,
  preferred_date date,
  deadline date,
  min_price numeric,
  max_price numeric,
  listing_type text DEFAULT 'transport_request', -- transport_request, waste_sale, waste_purchase
  status text DEFAULT 'open', -- open, bidding, awarded, completed, cancelled, expired
  awarded_to uuid REFERENCES public.organizations(id),
  special_requirements text,
  hazardous boolean DEFAULT false,
  images text[],
  views_count integer DEFAULT 0,
  bids_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view open listings" ON public.marketplace_listings FOR SELECT USING (true);
CREATE POLICY "Org members can create listings" ON public.marketplace_listings FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Org members can update own listings" ON public.marketplace_listings FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- Generate listing numbers
CREATE OR REPLACE FUNCTION public.generate_listing_number()
RETURNS trigger AS $$
BEGIN
  NEW.listing_number := 'MKT-' || to_char(now(), 'YYYYMMDD') || '-' || substr(NEW.id::text, 1, 4);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_listing_number
  BEFORE INSERT ON public.marketplace_listings
  FOR EACH ROW EXECUTE FUNCTION public.generate_listing_number();

CREATE TABLE IF NOT EXISTS public.marketplace_bids (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id uuid NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  bidder_organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  price numeric NOT NULL,
  estimated_pickup_date date,
  notes text,
  vehicle_type text,
  status text DEFAULT 'pending', -- pending, accepted, rejected, withdrawn
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.marketplace_bids ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Listing owners and bidders can view bids" ON public.marketplace_bids FOR SELECT
  USING (
    bidder_organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    OR listing_id IN (SELECT id FROM public.marketplace_listings WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  );
CREATE POLICY "Org members can create bids" ON public.marketplace_bids FOR INSERT
  WITH CHECK (bidder_organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Bidders can update own bids" ON public.marketplace_bids FOR UPDATE
  USING (bidder_organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- Update bids count trigger
CREATE OR REPLACE FUNCTION public.update_bids_count()
RETURNS trigger AS $$
BEGIN
  UPDATE public.marketplace_listings
  SET bids_count = (SELECT count(*) FROM public.marketplace_bids WHERE listing_id = COALESCE(NEW.listing_id, OLD.listing_id))
  WHERE id = COALESCE(NEW.listing_id, OLD.listing_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_update_bids_count
  AFTER INSERT OR DELETE ON public.marketplace_bids
  FOR EACH ROW EXECUTE FUNCTION public.update_bids_count();
