
-- Compliance Certificates table for iRecycle ISO-aligned certification
CREATE TABLE public.compliance_certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  certificate_number TEXT NOT NULL UNIQUE,
  certificate_level TEXT NOT NULL CHECK (certificate_level IN ('gold', 'silver', 'bronze')),
  overall_score NUMERIC(5,2) NOT NULL,
  
  -- Score breakdown by axis
  licenses_score NUMERIC(5,2) DEFAULT 0,
  training_score NUMERIC(5,2) DEFAULT 0,
  operations_score NUMERIC(5,2) DEFAULT 0,
  documentation_score NUMERIC(5,2) DEFAULT 0,
  safety_environment_score NUMERIC(5,2) DEFAULT 0,
  
  -- Score details JSON
  score_details JSONB DEFAULT '{}'::jsonb,
  
  -- Validity
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '1 year'),
  is_valid BOOLEAN NOT NULL DEFAULT true,
  revoked_at TIMESTAMPTZ,
  revocation_reason TEXT,
  
  -- Metadata
  issued_by UUID REFERENCES auth.users(id),
  iso_standards TEXT[] DEFAULT ARRAY['ISO 14001:2015', 'ISO 45001:2018'],
  verification_code TEXT NOT NULL UNIQUE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_compliance_certs_org ON public.compliance_certificates(organization_id);
CREATE INDEX idx_compliance_certs_valid ON public.compliance_certificates(is_valid, expires_at);
CREATE INDEX idx_compliance_certs_verify ON public.compliance_certificates(verification_code);

-- Enable RLS
ALTER TABLE public.compliance_certificates ENABLE ROW LEVEL SECURITY;

-- Policies: org members can view their own certificates
CREATE POLICY "Users can view own org certificates"
  ON public.compliance_certificates FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Admins/system can insert
CREATE POLICY "System can insert certificates"
  ON public.compliance_certificates FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Public verification by code
CREATE POLICY "Anyone can verify certificate by code"
  ON public.compliance_certificates FOR SELECT
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_compliance_certificates_updated_at
  BEFORE UPDATE ON public.compliance_certificates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Sequence for certificate numbering
CREATE OR REPLACE FUNCTION public.generate_compliance_cert_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  seq_num INT;
  cert_number TEXT;
BEGIN
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(certificate_number FROM 'IRC-\d{4}-(\d+)') AS INT)
  ), 0) + 1
  INTO seq_num
  FROM compliance_certificates;
  
  cert_number := 'IRC-' || TO_CHAR(NOW(), 'YYMM') || '-' || LPAD(seq_num::TEXT, 6, '0');
  RETURN cert_number;
END;
$$;
