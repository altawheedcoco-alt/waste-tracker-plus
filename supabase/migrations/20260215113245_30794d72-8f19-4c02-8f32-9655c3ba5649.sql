
-- Permit signatory roles: customizable per organization
CREATE TABLE public.permit_signatory_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role_title TEXT NOT NULL, -- e.g. مدير المخازن, مسؤول الأمن
  role_key TEXT NOT NULL, -- e.g. warehouse_manager, security_officer
  is_required BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, role_key)
);

-- Main permits table
CREATE TABLE public.permits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permit_number TEXT NOT NULL UNIQUE,
  permit_type TEXT NOT NULL DEFAULT 'waste_exit', -- waste_exit, person_access, transport, general
  status TEXT NOT NULL DEFAULT 'draft', -- draft, pending_signatures, active, expired, cancelled
  issuer_organization_id UUID NOT NULL REFERENCES public.organizations(id),
  shipment_id UUID REFERENCES public.shipments(id),
  -- Person/driver details (for person permits)
  person_name TEXT,
  person_id_number TEXT,
  person_role TEXT,
  driver_id UUID REFERENCES public.drivers(id),
  vehicle_plate TEXT,
  -- Waste details
  waste_type TEXT,
  waste_description TEXT,
  estimated_quantity NUMERIC,
  quantity_unit TEXT DEFAULT 'ton',
  -- Validity
  valid_from TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ,
  -- Details
  purpose TEXT,
  notes TEXT,
  special_instructions TEXT,
  -- QR/verification
  verification_code TEXT UNIQUE,
  qr_data JSONB,
  -- Metadata
  created_by UUID REFERENCES public.profiles(id),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Permit signatures (multi-party signing)
CREATE TABLE public.permit_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permit_id UUID NOT NULL REFERENCES public.permits(id) ON DELETE CASCADE,
  signatory_role_id UUID REFERENCES public.permit_signatory_roles(id),
  role_title TEXT NOT NULL, -- snapshot of role title at signing time
  signer_profile_id UUID REFERENCES public.profiles(id),
  signer_name TEXT NOT NULL,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  signature_image_url TEXT,
  stamp_image_url TEXT,
  signed_at TIMESTAMPTZ DEFAULT now(),
  ip_address TEXT,
  device_info TEXT,
  integrity_hash TEXT,
  status TEXT DEFAULT 'signed', -- signed, rejected
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.permit_signatory_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permit_signatures ENABLE ROW LEVEL SECURITY;

-- RLS policies for permit_signatory_roles
CREATE POLICY "Org members can view their signatory roles"
  ON public.permit_signatory_roles FOR SELECT TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org admins can manage signatory roles"
  ON public.permit_signatory_roles FOR ALL TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  ))
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  ));

-- RLS policies for permits
CREATE POLICY "Org members can view permits"
  ON public.permits FOR SELECT TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  ) OR issuer_organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org members can create permits"
  ON public.permits FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org members can update permits"
  ON public.permits FOR UPDATE TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  ));

-- RLS policies for permit_signatures
CREATE POLICY "View permit signatures"
  ON public.permit_signatures FOR SELECT TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Sign permits"
  ON public.permit_signatures FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  ));

-- Auto-generate permit number
CREATE OR REPLACE FUNCTION public.generate_permit_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.permit_number IS NULL OR NEW.permit_number = '' THEN
    NEW.permit_number := 'PRM-' || to_char(now(), 'YYMM') || '-' || upper(substr(gen_random_uuid()::text, 1, 6));
  END IF;
  IF NEW.verification_code IS NULL THEN
    NEW.verification_code := upper(substr(md5(gen_random_uuid()::text), 1, 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_generate_permit_number
  BEFORE INSERT ON public.permits
  FOR EACH ROW EXECUTE FUNCTION public.generate_permit_number();

-- Default signatory roles seed function
CREATE OR REPLACE FUNCTION public.seed_default_permit_roles(org_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO public.permit_signatory_roles (organization_id, role_title, role_key, sort_order, is_required)
  VALUES
    (org_id, 'مدير المخازن', 'warehouse_manager', 1, true),
    (org_id, 'مدير المشتريات', 'procurement_manager', 2, false),
    (org_id, 'مدير الساحة', 'yard_manager', 3, false),
    (org_id, 'مدير الحركة', 'movement_manager', 4, false),
    (org_id, 'مسؤول الميزان', 'scale_operator', 5, false),
    (org_id, 'مسؤول الأمن', 'security_officer', 6, true)
  ON CONFLICT (organization_id, role_key) DO NOTHING;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Update timestamp trigger
CREATE TRIGGER update_permits_updated_at
  BEFORE UPDATE ON public.permits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_permit_roles_updated_at
  BEFORE UPDATE ON public.permit_signatory_roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
