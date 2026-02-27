
-- جدول تتبع نتائج فحص معايير الاعتماد التلقائي
CREATE TABLE public.endorsement_criteria_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_type TEXT NOT NULL,
  document_id TEXT NOT NULL,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  
  -- نتائج المعايير الستة
  all_signatures_complete BOOLEAN DEFAULT false,
  licenses_valid BOOLEAN DEFAULT false,
  signers_kyc_verified BOOLEAN DEFAULT false,
  document_hash_intact BOOLEAN DEFAULT false,
  no_active_violations BOOLEAN DEFAULT false,
  within_time_frame BOOLEAN DEFAULT false,
  
  -- تفاصيل كل معيار
  criteria_details JSONB DEFAULT '{}',
  
  -- النتيجة النهائية
  all_criteria_met BOOLEAN DEFAULT false,
  endorsement_status TEXT NOT NULL DEFAULT 'pending' CHECK (endorsement_status IN ('pending', 'approved', 'blocked', 'manual_review')),
  blocked_reason TEXT,
  
  -- ربط بالاعتماد إذا تم
  endorsement_id UUID REFERENCES public.document_endorsements(id),
  system_endorsement_id UUID REFERENCES public.system_endorsements(id),
  
  -- من قام بالفحص
  checked_by TEXT DEFAULT 'system',
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- فهارس
CREATE INDEX idx_endorsement_checks_doc ON public.endorsement_criteria_checks(document_type, document_id);
CREATE INDEX idx_endorsement_checks_org ON public.endorsement_criteria_checks(organization_id);
CREATE INDEX idx_endorsement_checks_status ON public.endorsement_criteria_checks(endorsement_status);

-- RLS
ALTER TABLE public.endorsement_criteria_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org endorsement checks"
ON public.endorsement_criteria_checks FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "System can insert endorsement checks"
ON public.endorsement_criteria_checks FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "System can update endorsement checks"
ON public.endorsement_criteria_checks FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- Trigger لتحديث updated_at
CREATE TRIGGER update_endorsement_criteria_checks_updated_at
BEFORE UPDATE ON public.endorsement_criteria_checks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
