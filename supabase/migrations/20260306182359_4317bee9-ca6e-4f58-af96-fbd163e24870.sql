
-- License Renewal Requests table
CREATE TABLE public.license_renewal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  regulator_organization_id UUID NOT NULL REFERENCES public.organizations(id),
  regulator_level_code TEXT NOT NULL REFERENCES public.regulator_levels(level_code),
  license_id UUID REFERENCES public.legal_licenses(id),
  request_type TEXT NOT NULL DEFAULT 'renewal', -- 'renewal', 'new_license', 'registration'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'under_review', 'documents_required', 'fees_pending', 'fees_paid', 'processing', 'approved', 'rejected'
  license_type TEXT, -- e.g. 'waste_transport_permit', 'environmental_approval'
  current_license_number TEXT,
  current_license_expiry DATE,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  fee_amount NUMERIC(12,2),
  fee_paid_at TIMESTAMPTZ,
  fee_payment_method TEXT, -- 'wallet', 'manual'
  fee_payment_proof_url TEXT,
  fee_confirmed_by UUID REFERENCES auth.users(id),
  documents JSONB DEFAULT '[]',
  notes TEXT,
  rejection_reason TEXT,
  auto_requested BOOLEAN DEFAULT false,
  new_license_number TEXT,
  new_license_expiry DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Regulatory Attestations table
CREATE TABLE public.regulatory_attestations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attestation_number TEXT NOT NULL UNIQUE,
  renewal_request_id UUID REFERENCES public.license_renewal_requests(id),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  regulator_organization_id UUID NOT NULL REFERENCES public.organizations(id),
  regulator_level_code TEXT NOT NULL REFERENCES public.regulator_levels(level_code),
  attestation_type TEXT NOT NULL, -- 'fee_payment_processing', 'registration_confirmation'
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'expired', 'revoked'
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until TIMESTAMPTZ NOT NULL,
  max_validity_days INTEGER NOT NULL DEFAULT 15,
  organization_data JSONB NOT NULL DEFAULT '{}', -- snapshot of org legal data at issuance
  issued_by UUID REFERENCES auth.users(id),
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES auth.users(id),
  revocation_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.license_renewal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regulatory_attestations ENABLE ROW LEVEL SECURITY;

-- RLS: Organizations can see their own requests
CREATE POLICY "orgs_view_own_renewal_requests" ON public.license_renewal_requests
  FOR SELECT TO authenticated
  USING (
    organization_id IN (SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid())
    OR regulator_organization_id IN (SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid())
  );

-- RLS: Organizations can insert their own requests
CREATE POLICY "orgs_insert_own_renewal_requests" ON public.license_renewal_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid())
  );

-- RLS: Regulators can update requests they manage
CREATE POLICY "regulators_update_renewal_requests" ON public.license_renewal_requests
  FOR UPDATE TO authenticated
  USING (
    regulator_organization_id IN (SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid())
    OR organization_id IN (SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid())
  );

-- RLS: Attestations viewable by both org and regulator
CREATE POLICY "view_own_attestations" ON public.regulatory_attestations
  FOR SELECT TO authenticated
  USING (
    organization_id IN (SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid())
    OR regulator_organization_id IN (SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid())
  );

-- RLS: Only regulators can issue attestations
CREATE POLICY "regulators_insert_attestations" ON public.regulatory_attestations
  FOR INSERT TO authenticated
  WITH CHECK (
    regulator_organization_id IN (SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid())
  );

-- RLS: Regulators can update their attestations
CREATE POLICY "regulators_update_attestations" ON public.regulatory_attestations
  FOR UPDATE TO authenticated
  USING (
    regulator_organization_id IN (SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid())
  );

-- Index for performance
CREATE INDEX idx_renewal_requests_org ON public.license_renewal_requests(organization_id);
CREATE INDEX idx_renewal_requests_regulator ON public.license_renewal_requests(regulator_organization_id);
CREATE INDEX idx_renewal_requests_status ON public.license_renewal_requests(status);
CREATE INDEX idx_attestations_org ON public.regulatory_attestations(organization_id);
CREATE INDEX idx_attestations_number ON public.regulatory_attestations(attestation_number);

-- Function to generate attestation number
CREATE OR REPLACE FUNCTION public.generate_attestation_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  seq_num INTEGER;
  year_str TEXT;
BEGIN
  year_str := to_char(now(), 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(attestation_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO seq_num
  FROM public.regulatory_attestations
  WHERE attestation_number LIKE 'ATT-' || year_str || '-%';
  RETURN 'ATT-' || year_str || '-' || LPAD(seq_num::TEXT, 5, '0');
END;
$$;
