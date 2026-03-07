
-- Digital Maturity Score tracking
CREATE TABLE public.digital_maturity_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  score_date DATE NOT NULL DEFAULT CURRENT_DATE,
  overall_score NUMERIC(5,2) DEFAULT 0,
  document_digitization_score NUMERIC(5,2) DEFAULT 0,
  workflow_automation_score NUMERIC(5,2) DEFAULT 0,
  e_signature_score NUMERIC(5,2) DEFAULT 0,
  data_integration_score NUMERIC(5,2) DEFAULT 0,
  ai_adoption_score NUMERIC(5,2) DEFAULT 0,
  security_score NUMERIC(5,2) DEFAULT 0,
  maturity_level TEXT DEFAULT 'basic',
  recommendations JSONB DEFAULT '[]'::jsonb,
  breakdown JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, score_date)
);

ALTER TABLE public.digital_maturity_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org maturity scores"
  ON public.digital_maturity_scores FOR SELECT
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert own org maturity scores"
  ON public.digital_maturity_scores FOR INSERT
  TO authenticated
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update own org maturity scores"
  ON public.digital_maturity_scores FOR UPDATE
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

-- Workflow automation rules
CREATE TABLE public.workflow_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL,
  trigger_config JSONB DEFAULT '{}'::jsonb,
  conditions JSONB DEFAULT '[]'::jsonb,
  actions JSONB DEFAULT '[]'::jsonb,
  is_enabled BOOLEAN DEFAULT true,
  execution_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.workflow_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own org workflow rules"
  ON public.workflow_rules FOR ALL
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

-- Workflow execution log
CREATE TABLE public.workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES public.workflow_rules(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,
  trigger_data JSONB DEFAULT '{}'::jsonb,
  actions_executed JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'completed',
  error_message TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org executions"
  ON public.workflow_executions FOR SELECT
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

-- OCR scan results
CREATE TABLE public.ocr_scan_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  document_url TEXT NOT NULL,
  document_name TEXT,
  scan_type TEXT DEFAULT 'general',
  extracted_data JSONB DEFAULT '{}'::jsonb,
  entities JSONB DEFAULT '[]'::jsonb,
  classification TEXT,
  confidence_score NUMERIC(5,2),
  linked_record_type TEXT,
  linked_record_id UUID,
  scanned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ocr_scan_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own org OCR results"
  ON public.ocr_scan_results FOR ALL
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

-- Signature verification (OTP + National ID)
CREATE TABLE public.signature_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signature_id UUID,
  verification_type TEXT NOT NULL,
  verification_data JSONB DEFAULT '{}'::jsonb,
  otp_code TEXT,
  otp_expires_at TIMESTAMPTZ,
  national_id_hash TEXT,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.signature_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own verifications"
  ON public.signature_verifications FOR ALL
  TO authenticated
  USING (true);
