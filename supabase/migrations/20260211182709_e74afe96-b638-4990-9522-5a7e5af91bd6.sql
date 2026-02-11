
-- Table: Authorized Signatories (المفوضون بالتوقيع)
CREATE TABLE public.authorized_signatories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  job_title TEXT,
  national_id TEXT,
  authority_level TEXT NOT NULL DEFAULT 'standard',
  can_sign_shipments BOOLEAN DEFAULT true,
  can_sign_contracts BOOLEAN DEFAULT false,
  can_sign_invoices BOOLEAN DEFAULT false,
  can_sign_certificates BOOLEAN DEFAULT false,
  signature_image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  activated_at TIMESTAMPTZ DEFAULT now(),
  deactivated_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Table: Signature Audit Log (سجل التدقيق الأمني)
CREATE TABLE public.signature_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  signature_id UUID REFERENCES public.document_signatures(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  actor_user_id UUID REFERENCES auth.users(id),
  actor_name TEXT,
  actor_ip TEXT,
  actor_user_agent TEXT,
  actor_device TEXT,
  document_type TEXT,
  document_id UUID,
  organization_id UUID REFERENCES public.organizations(id),
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enhance existing document_signatures table
ALTER TABLE public.document_signatures 
  ADD COLUMN IF NOT EXISTS signatory_id UUID REFERENCES public.authorized_signatories(id),
  ADD COLUMN IF NOT EXISTS signer_title TEXT,
  ADD COLUMN IF NOT EXISTS signer_national_id TEXT,
  ADD COLUMN IF NOT EXISTS signature_text TEXT,
  ADD COLUMN IF NOT EXISTS stamp_image_url TEXT,
  ADD COLUMN IF NOT EXISTS user_agent TEXT,
  ADD COLUMN IF NOT EXISTS document_hash TEXT,
  ADD COLUMN IF NOT EXISTS signature_hash TEXT,
  ADD COLUMN IF NOT EXISTS platform_seal_number TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'signed',
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS revoked_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS revoke_reason TEXT;

-- Enable RLS
ALTER TABLE public.authorized_signatories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signature_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Org members can view signatories" ON public.authorized_signatories
  FOR SELECT TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Org members can manage signatories" ON public.authorized_signatories
  FOR ALL TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ))
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Org members can view audit log" ON public.signature_audit_log
  FOR SELECT TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert audit log" ON public.signature_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Indexes
CREATE INDEX idx_signatories_org ON public.authorized_signatories(organization_id);
CREATE INDEX idx_signatories_user ON public.authorized_signatories(user_id);
CREATE INDEX idx_signature_audit_sig ON public.signature_audit_log(signature_id);
CREATE INDEX idx_signature_audit_doc ON public.signature_audit_log(document_type, document_id);

-- Updated at trigger
CREATE TRIGGER update_authorized_signatories_updated_at
  BEFORE UPDATE ON public.authorized_signatories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-generate platform seal number
CREATE OR REPLACE FUNCTION public.generate_seal_number()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  seal TEXT;
  seq INT;
BEGIN
  SELECT COUNT(*) + 1 INTO seq FROM public.document_signatures;
  seal := 'IRS-' || to_char(now(), 'YYMM') || '-' || lpad(seq::text, 6, '0');
  RETURN seal;
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_seal_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.platform_seal_number IS NULL THEN
    NEW.platform_seal_number := public.generate_seal_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_seal_number
  BEFORE INSERT ON public.document_signatures
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_seal_number();
