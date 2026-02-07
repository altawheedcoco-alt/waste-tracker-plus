-- Create table for organization signatures (multiple per organization)
CREATE TABLE public.organization_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  signature_name VARCHAR(255) NOT NULL,
  signature_name_en VARCHAR(255),
  signer_name VARCHAR(255) NOT NULL,
  signer_position VARCHAR(255),
  signer_national_id VARCHAR(50),
  signer_phone VARCHAR(50),
  signer_email VARCHAR(255),
  signature_image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  valid_from DATE,
  valid_until DATE,
  authorization_document_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create table for organization stamps (multiple per organization)
CREATE TABLE public.organization_stamps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  stamp_name VARCHAR(255) NOT NULL,
  stamp_name_en VARCHAR(255),
  stamp_type VARCHAR(50) NOT NULL DEFAULT 'official', -- official, department, branch
  stamp_image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  valid_from DATE,
  valid_until DATE,
  department VARCHAR(255),
  branch VARCHAR(255),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create table for document endorsements (tracking which documents were signed/stamped)
CREATE TABLE public.document_endorsements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type VARCHAR(100) NOT NULL, -- certificate, report, contract, receipt
  document_id UUID NOT NULL,
  document_number VARCHAR(100) NOT NULL,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  signature_id UUID REFERENCES public.organization_signatures(id),
  stamp_id UUID REFERENCES public.organization_stamps(id),
  endorsement_type VARCHAR(50) NOT NULL DEFAULT 'signed_and_stamped', -- signed, stamped, signed_and_stamped
  endorsed_by UUID REFERENCES auth.users(id),
  endorsed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT,
  biometric_verified BOOLEAN DEFAULT false,
  verification_code VARCHAR(50) NOT NULL UNIQUE,
  qr_code_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create table for system endorsements (the platform's own approval)
CREATE TABLE public.system_endorsements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_endorsement_id UUID NOT NULL REFERENCES public.document_endorsements(id) ON DELETE CASCADE,
  system_seal_number VARCHAR(100) NOT NULL UNIQUE,
  system_seal_hash TEXT NOT NULL, -- SHA-256 hash of document content
  endorsed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  platform_version VARCHAR(50) DEFAULT '1.0.0',
  legal_disclaimer TEXT NOT NULL DEFAULT 'هذا المستند صادر إلكترونياً من منصة آي ريسايكل لإدارة المخلفات. المنصة غير مسؤولة عن صحة البيانات المدخلة من قبل الأطراف المشاركة. يمكن التحقق من صحة المستند عبر رمز QR أو صفحة التحقق الرسمية.',
  verification_url TEXT,
  is_valid BOOLEAN DEFAULT true,
  revoked_at TIMESTAMPTZ,
  revocation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.organization_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_stamps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_endorsements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_endorsements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organization_signatures
CREATE POLICY "Users can view their organization signatures"
  ON public.organization_signatures FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their organization signatures"
  ON public.organization_signatures FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for organization_stamps
CREATE POLICY "Users can view their organization stamps"
  ON public.organization_stamps FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their organization stamps"
  ON public.organization_stamps FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for document_endorsements
CREATE POLICY "Users can view endorsements for their organization"
  ON public.document_endorsements FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create endorsements for their organization"
  ON public.document_endorsements FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for system_endorsements (read-only for all authenticated users)
CREATE POLICY "Anyone can view system endorsements for verification"
  ON public.system_endorsements FOR SELECT
  TO authenticated
  USING (true);

-- Indexes for better performance
CREATE INDEX idx_org_signatures_org_id ON public.organization_signatures(organization_id);
CREATE INDEX idx_org_signatures_active ON public.organization_signatures(is_active, is_primary);
CREATE INDEX idx_org_stamps_org_id ON public.organization_stamps(organization_id);
CREATE INDEX idx_org_stamps_active ON public.organization_stamps(is_active, is_primary);
CREATE INDEX idx_doc_endorsements_org_id ON public.document_endorsements(organization_id);
CREATE INDEX idx_doc_endorsements_doc ON public.document_endorsements(document_type, document_id);
CREATE INDEX idx_doc_endorsements_verification ON public.document_endorsements(verification_code);
CREATE INDEX idx_system_endorsements_seal ON public.system_endorsements(system_seal_number);

-- Function to generate unique system seal number
CREATE OR REPLACE FUNCTION public.generate_system_seal_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  seal_number TEXT;
  year_month TEXT;
  seq_num INT;
BEGIN
  year_month := TO_CHAR(NOW(), 'YYMM');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(system_seal_number FROM 10 FOR 6) AS INT)
  ), 0) + 1
  INTO seq_num
  FROM public.system_endorsements
  WHERE system_seal_number LIKE 'IRS-' || year_month || '-%';
  
  seal_number := 'IRS-' || year_month || '-' || LPAD(seq_num::TEXT, 6, '0');
  
  RETURN seal_number;
END;
$$;

-- Function to generate verification code
CREATE OR REPLACE FUNCTION public.generate_verification_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN UPPER(
    SUBSTRING(MD5(gen_random_uuid()::TEXT || NOW()::TEXT) FROM 1 FOR 4) || '-' ||
    SUBSTRING(MD5(gen_random_uuid()::TEXT) FROM 1 FOR 4) || '-' ||
    SUBSTRING(MD5(gen_random_uuid()::TEXT) FROM 1 FOR 4)
  );
END;
$$;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_organization_signatures_updated_at
  BEFORE UPDATE ON public.organization_signatures
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_stamps_updated_at
  BEFORE UPDATE ON public.organization_stamps
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();