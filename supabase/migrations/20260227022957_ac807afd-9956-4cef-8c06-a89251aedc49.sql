
CREATE TABLE public.organization_attestations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  requested_by UUID NOT NULL,
  attestation_number TEXT NOT NULL UNIQUE,
  verification_code TEXT NOT NULL UNIQUE,
  system_seal_number TEXT NOT NULL,
  organization_name TEXT NOT NULL,
  organization_type TEXT NOT NULL,
  organization_logo_url TEXT,
  digital_declaration_number TEXT,
  commercial_register TEXT,
  tax_number TEXT,
  delegate_name TEXT,
  delegate_position TEXT,
  delegate_national_id TEXT,
  delegate_phone TEXT,
  organization_address TEXT,
  organization_phone TEXT,
  organization_email TEXT,
  terms_accepted BOOLEAN NOT NULL DEFAULT false,
  terms_version TEXT,
  identity_verified BOOLEAN NOT NULL DEFAULT false,
  licenses_valid BOOLEAN NOT NULL DEFAULT false,
  kyc_complete BOOLEAN NOT NULL DEFAULT false,
  signer_signature_url TEXT,
  signer_stamp_url TEXT,
  signer_barcode_data TEXT,
  signer_qr_data TEXT,
  platform_seal_url TEXT,
  platform_endorsed BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'active',
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.organization_attestations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view own attestations"
  ON public.organization_attestations FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Org members can create attestations"
  ON public.organization_attestations FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admin can view all attestations"
  ON public.organization_attestations FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin can update attestations"
  ON public.organization_attestations FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE INDEX idx_org_attestations_org ON public.organization_attestations(organization_id);
CREATE INDEX idx_org_attestations_number ON public.organization_attestations(attestation_number);
CREATE INDEX idx_org_attestations_verification ON public.organization_attestations(verification_code);

CREATE TRIGGER update_organization_attestations_updated_at
  BEFORE UPDATE ON public.organization_attestations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
