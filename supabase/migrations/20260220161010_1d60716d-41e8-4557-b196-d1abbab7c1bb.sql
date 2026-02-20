
-- =============================================
-- Transport Office / Fleet Agency System
-- =============================================

-- 1. Fleet vehicles available for hire from transport offices
CREATE TABLE public.fleet_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  plate_number TEXT NOT NULL,
  vehicle_type TEXT NOT NULL DEFAULT 'truck',
  capacity_tons NUMERIC(10,2),
  brand TEXT,
  model TEXT,
  year INTEGER,
  photo_url TEXT,
  license_expiry DATE,
  insurance_expiry DATE,
  is_available BOOLEAN DEFAULT true,
  daily_rate NUMERIC(10,2),
  per_trip_rate NUMERIC(10,2),
  notes TEXT,
  driver_name TEXT,
  driver_phone TEXT,
  driver_license_expiry DATE,
  waste_types_allowed TEXT[] DEFAULT '{}',
  service_areas TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Vehicle booking requests
CREATE TABLE public.vehicle_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.fleet_vehicles(id) ON DELETE CASCADE,
  fleet_owner_org_id UUID NOT NULL REFERENCES public.organizations(id),
  requester_org_id UUID NOT NULL REFERENCES public.organizations(id),
  shipment_id UUID REFERENCES public.shipments(id),
  booking_type TEXT NOT NULL DEFAULT 'single_trip',
  status TEXT NOT NULL DEFAULT 'pending',
  start_date DATE NOT NULL,
  end_date DATE,
  pickup_location TEXT,
  delivery_location TEXT,
  waste_type TEXT,
  estimated_weight NUMERIC(10,2),
  agreed_price NUMERIC(10,2),
  currency TEXT DEFAULT 'EGP',
  requester_notes TEXT,
  owner_notes TEXT,
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Transport office platform contracts
CREATE TABLE public.transport_office_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contract_number TEXT NOT NULL UNIQUE,
  contract_type TEXT NOT NULL DEFAULT 'standard',
  status TEXT NOT NULL DEFAULT 'pending',
  commission_rate NUMERIC(5,2) DEFAULT 5.00,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  max_vehicles INTEGER,
  terms_accepted BOOLEAN DEFAULT false,
  terms_accepted_at TIMESTAMPTZ,
  signed_by TEXT,
  notes TEXT,
  attachment_url TEXT,
  created_by UUID,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_fleet_vehicles_org ON public.fleet_vehicles(organization_id);
CREATE INDEX idx_fleet_vehicles_available ON public.fleet_vehicles(is_available, status);
CREATE INDEX idx_vehicle_bookings_vehicle ON public.vehicle_bookings(vehicle_id);
CREATE INDEX idx_vehicle_bookings_requester ON public.vehicle_bookings(requester_org_id);
CREATE INDEX idx_vehicle_bookings_status ON public.vehicle_bookings(status);
CREATE INDEX idx_transport_office_contracts_org ON public.transport_office_contracts(organization_id);

-- Enable RLS
ALTER TABLE public.fleet_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_office_contracts ENABLE ROW LEVEL SECURITY;

-- RLS: fleet_vehicles - owners manage
CREATE POLICY "Fleet owners manage their vehicles"
  ON public.fleet_vehicles FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
  ));

-- RLS: fleet_vehicles - public browsing for available
CREATE POLICY "Available vehicles visible to authenticated"
  ON public.fleet_vehicles FOR SELECT
  TO authenticated
  USING (is_available = true AND status = 'active');

-- RLS: vehicle_bookings - requester
CREATE POLICY "Requester manages own bookings"
  ON public.vehicle_bookings FOR ALL
  USING (requester_org_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
  ));

-- RLS: vehicle_bookings - fleet owner
CREATE POLICY "Fleet owner manages bookings for their vehicles"
  ON public.vehicle_bookings FOR ALL
  USING (fleet_owner_org_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
  ));

-- RLS: transport_office_contracts - org
CREATE POLICY "Transport office manages own contracts"
  ON public.transport_office_contracts FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
  ));

-- RLS: transport_office_contracts - admin
CREATE POLICY "Admins manage all transport contracts"
  ON public.transport_office_contracts FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE TRIGGER update_fleet_vehicles_updated_at
  BEFORE UPDATE ON public.fleet_vehicles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vehicle_bookings_updated_at
  BEFORE UPDATE ON public.vehicle_bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transport_office_contracts_updated_at
  BEFORE UPDATE ON public.transport_office_contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
