-- إضافة جدول لحفظ التعديلات المنفصلة على العقود
CREATE TABLE public.contract_custom_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.contract_templates(id),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id),
  version_name TEXT NOT NULL,
  version_number INTEGER NOT NULL DEFAULT 1,
  custom_header_text TEXT,
  custom_introduction_text TEXT,
  custom_terms_template TEXT,
  custom_obligations_party_one TEXT,
  custom_obligations_party_two TEXT,
  custom_payment_terms TEXT,
  custom_duration_clause TEXT,
  custom_termination_clause TEXT,
  custom_dispute_resolution TEXT,
  custom_closing_text TEXT,
  custom_notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إضافة حقول التحقق للعقود
ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS verification_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS verification_qr_url TEXT,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS waste_type TEXT,
ADD COLUMN IF NOT EXISTS waste_category TEXT,
ADD COLUMN IF NOT EXISTS legal_references JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS clause_count INTEGER DEFAULT 0;

-- إنشاء جدول للتحقق من العقود
CREATE TABLE public.contract_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  verification_code TEXT NOT NULL,
  verified_by_ip TEXT,
  verified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  verification_result BOOLEAN NOT NULL DEFAULT true,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء فهرس للبحث السريع برمز التحقق
CREATE INDEX IF NOT EXISTS idx_contracts_verification_code ON public.contracts(verification_code);
CREATE INDEX IF NOT EXISTS idx_contract_verifications_code ON public.contract_verifications(verification_code);
CREATE INDEX IF NOT EXISTS idx_contract_custom_versions_org ON public.contract_custom_versions(organization_id);

-- تفعيل RLS
ALTER TABLE public.contract_custom_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_verifications ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للنسخ المخصصة
CREATE POLICY "Users can view their organization custom versions"
ON public.contract_custom_versions FOR SELECT
USING (organization_id = get_user_org_id_safe(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can create custom versions for their organization"
ON public.contract_custom_versions FOR INSERT
WITH CHECK (organization_id = get_user_org_id_safe(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update their organization custom versions"
ON public.contract_custom_versions FOR UPDATE
USING (organization_id = get_user_org_id_safe(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can delete their organization custom versions"
ON public.contract_custom_versions FOR DELETE
USING (organization_id = get_user_org_id_safe(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

-- سياسات التحقق (القراءة متاحة للجميع للتحقق العام)
CREATE POLICY "Anyone can verify contracts"
ON public.contract_verifications FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can log verifications"
ON public.contract_verifications FOR INSERT
WITH CHECK (true);

-- دالة لتوليد رمز التحقق
CREATE OR REPLACE FUNCTION generate_contract_verification_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  timestamp_part TEXT;
  random_part TEXT;
  checksum INTEGER;
BEGIN
  timestamp_part := upper(to_hex(extract(epoch from now())::bigint));
  random_part := upper(substr(md5(random()::text), 1, 6));
  checksum := (extract(epoch from now())::bigint % 97);
  RETURN 'EG-WMRA-' || timestamp_part || '-' || random_part || '-' || lpad(checksum::text, 2, '0');
END;
$$;

-- تريجر لتوليد رمز التحقق تلقائياً عند إنشاء عقد
CREATE OR REPLACE FUNCTION set_contract_verification_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.verification_code IS NULL THEN
    NEW.verification_code := generate_contract_verification_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_contract_verification_code
BEFORE INSERT ON public.contracts
FOR EACH ROW
EXECUTE FUNCTION set_contract_verification_code();

-- تريجر لتحديث updated_at
CREATE TRIGGER update_contract_custom_versions_updated_at
BEFORE UPDATE ON public.contract_custom_versions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();