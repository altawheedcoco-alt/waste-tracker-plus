
-- 1. Vehicle Compliance Profile
CREATE TABLE public.vehicle_compliance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  plate_number TEXT NOT NULL,
  vehicle_type TEXT NOT NULL DEFAULT 'truck',
  -- Hazmat license
  hazmat_license_number TEXT,
  hazmat_license_expiry DATE,
  hazmat_license_url TEXT,
  -- Placards & safety
  has_hazard_placards BOOLEAN DEFAULT false,
  placard_types TEXT[] DEFAULT '{}',
  has_fire_extinguisher BOOLEAN DEFAULT false,
  has_sand_box BOOLEAN DEFAULT false,
  has_spill_kit BOOLEAN DEFAULT false,
  has_first_aid_kit BOOLEAN DEFAULT false,
  -- GPS
  gps_device_id UUID REFERENCES public.gps_devices(id) ON DELETE SET NULL,
  gps_registered_with_authority BOOLEAN DEFAULT false,
  -- Vehicle license
  vehicle_license_expiry DATE,
  vehicle_license_url TEXT,
  -- Insurance
  insurance_number TEXT,
  insurance_expiry DATE,
  insurance_url TEXT,
  -- Status
  compliance_status TEXT NOT NULL DEFAULT 'pending' CHECK (compliance_status IN ('compliant', 'non_compliant', 'pending', 'expired')),
  last_inspection_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vehicle_compliance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members manage vehicle compliance" ON public.vehicle_compliance
  FOR ALL USING (organization_id IN (
    SELECT uo.organization_id FROM public.user_organizations uo WHERE uo.user_id = auth.uid()
  ));

-- 2. Driver Compliance Documents
CREATE TABLE public.driver_compliance_docs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL CHECK (doc_type IN (
    'professional_license', 'hazmat_training_cert', 'criminal_record',
    'medical_fitness', 'hazmat_handling_permit', 'defensive_driving_cert'
  )),
  doc_number TEXT,
  issue_date DATE,
  expiry_date DATE,
  issuing_authority TEXT,
  document_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('valid', 'expired', 'expiring_soon', 'pending', 'rejected')),
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.driver_compliance_docs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members manage driver compliance docs" ON public.driver_compliance_docs
  FOR ALL USING (organization_id IN (
    SELECT uo.organization_id FROM public.user_organizations uo WHERE uo.user_id = auth.uid()
  ));

-- 3. Transport Incidents / Spill Reports
CREATE TABLE public.transport_incidents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES public.vehicle_compliance(id) ON DELETE SET NULL,
  shipment_id UUID REFERENCES public.shipments(id) ON DELETE SET NULL,
  incident_type TEXT NOT NULL CHECK (incident_type IN ('spill', 'accident', 'breakdown', 'route_deviation', 'other')),
  severity TEXT NOT NULL DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT,
  -- Location
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  location_address TEXT,
  -- Time
  incident_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  -- Media
  photo_urls TEXT[] DEFAULT '{}',
  -- Response
  immediate_actions TEXT,
  corrective_actions TEXT,
  authority_notified BOOLEAN DEFAULT false,
  authority_reference TEXT,
  -- Reporter
  reported_by UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.transport_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members manage transport incidents" ON public.transport_incidents
  FOR ALL USING (organization_id IN (
    SELECT uo.organization_id FROM public.user_organizations uo WHERE uo.user_id = auth.uid()
  ));

-- Auto-update timestamps
CREATE TRIGGER update_vehicle_compliance_updated_at BEFORE UPDATE ON public.vehicle_compliance
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_driver_compliance_docs_updated_at BEFORE UPDATE ON public.driver_compliance_docs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transport_incidents_updated_at BEFORE UPDATE ON public.transport_incidents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-update vehicle compliance status
CREATE OR REPLACE FUNCTION public.update_vehicle_compliance_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.hazmat_license_expiry IS NOT NULL AND NEW.hazmat_license_expiry < CURRENT_DATE THEN
    NEW.compliance_status := 'expired';
  ELSIF NEW.vehicle_license_expiry IS NOT NULL AND NEW.vehicle_license_expiry < CURRENT_DATE THEN
    NEW.compliance_status := 'expired';
  ELSIF NEW.has_hazard_placards AND NEW.has_fire_extinguisher AND NEW.has_spill_kit
    AND NEW.hazmat_license_number IS NOT NULL AND NEW.hazmat_license_expiry > CURRENT_DATE THEN
    NEW.compliance_status := 'compliant';
  ELSE
    NEW.compliance_status := 'non_compliant';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER auto_vehicle_compliance_status BEFORE INSERT OR UPDATE ON public.vehicle_compliance
  FOR EACH ROW EXECUTE FUNCTION public.update_vehicle_compliance_status();

-- Auto-update driver doc status
CREATE OR REPLACE FUNCTION public.update_driver_doc_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expiry_date IS NULL THEN
    NEW.status := 'valid';
  ELSIF NEW.expiry_date < CURRENT_DATE THEN
    NEW.status := 'expired';
  ELSIF NEW.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN
    NEW.status := 'expiring_soon';
  ELSE
    NEW.status := 'valid';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER auto_driver_doc_status BEFORE INSERT OR UPDATE ON public.driver_compliance_docs
  FOR EACH ROW EXECUTE FUNCTION public.update_driver_doc_status();
