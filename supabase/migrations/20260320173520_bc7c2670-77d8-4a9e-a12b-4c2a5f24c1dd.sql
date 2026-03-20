
-- جدول سلاسل التوقيع المتعدد (بدون قيود ترتيب أو زمن)
CREATE TABLE IF NOT EXISTS public.signing_chains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id TEXT NOT NULL,
  document_type TEXT NOT NULL DEFAULT 'general',
  document_title TEXT NOT NULL,
  document_url TEXT,
  initiated_by UUID REFERENCES auth.users(id),
  initiated_org_id UUID REFERENCES public.organizations(id),
  status TEXT NOT NULL DEFAULT 'active',
  total_signers INTEGER NOT NULL DEFAULT 0,
  completed_signers INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- خطوات السلسلة (كل موقع في السلسلة — بدون ترتيب إجباري)
CREATE TABLE IF NOT EXISTS public.signing_chain_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chain_id UUID NOT NULL REFERENCES public.signing_chains(id) ON DELETE CASCADE,
  signer_org_id UUID REFERENCES public.organizations(id),
  signer_user_id UUID REFERENCES auth.users(id),
  signer_name TEXT,
  step_order INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  signed_at TIMESTAMPTZ,
  signature_id UUID,
  signature_url TEXT,
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- رحلة المستند (كل حدث يمر به المستند)
CREATE TABLE IF NOT EXISTS public.document_journey_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id TEXT NOT NULL,
  document_type TEXT NOT NULL DEFAULT 'general',
  event_type TEXT NOT NULL,
  event_title TEXT NOT NULL,
  event_description TEXT,
  actor_user_id UUID,
  actor_org_id UUID,
  actor_name TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- فهارس
CREATE INDEX idx_signing_chains_doc ON public.signing_chains(document_id, document_type);
CREATE INDEX idx_signing_chains_org ON public.signing_chains(initiated_org_id);
CREATE INDEX idx_signing_chain_steps_chain ON public.signing_chain_steps(chain_id);
CREATE INDEX idx_signing_chain_steps_signer ON public.signing_chain_steps(signer_org_id);
CREATE INDEX idx_document_journey_doc ON public.document_journey_events(document_id, document_type);
CREATE INDEX idx_document_journey_time ON public.document_journey_events(created_at DESC);

-- RLS
ALTER TABLE public.signing_chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signing_chain_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_journey_events ENABLE ROW LEVEL SECURITY;

-- سياسات signing_chains
CREATE POLICY "Users can view chains involving their org"
  ON public.signing_chains FOR SELECT TO authenticated
  USING (
    initiated_org_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
    OR id IN (SELECT chain_id FROM public.signing_chain_steps WHERE signer_org_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()))
  );

CREATE POLICY "Users can create chains for their org"
  ON public.signing_chains FOR INSERT TO authenticated
  WITH CHECK (initiated_org_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update chains they initiated"
  ON public.signing_chains FOR UPDATE TO authenticated
  USING (initiated_org_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()));

-- سياسات signing_chain_steps
CREATE POLICY "Users can view steps in their chains"
  ON public.signing_chain_steps FOR SELECT TO authenticated
  USING (
    chain_id IN (SELECT id FROM public.signing_chains WHERE initiated_org_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()))
    OR signer_org_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert steps in chains they own"
  ON public.signing_chain_steps FOR INSERT TO authenticated
  WITH CHECK (
    chain_id IN (SELECT id FROM public.signing_chains WHERE initiated_org_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()))
  );

CREATE POLICY "Signers can update their own steps"
  ON public.signing_chain_steps FOR UPDATE TO authenticated
  USING (
    signer_org_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
    OR chain_id IN (SELECT id FROM public.signing_chains WHERE initiated_org_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()))
  );

-- سياسات document_journey_events
CREATE POLICY "Users can view journey events for related docs"
  ON public.document_journey_events FOR SELECT TO authenticated
  USING (
    actor_org_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
    OR document_id IN (
      SELECT id::text FROM public.signing_requests 
      WHERE sender_organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
      OR recipient_organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Authenticated users can insert journey events"
  ON public.document_journey_events FOR INSERT TO authenticated
  WITH CHECK (true);

-- تحديث تلقائي لـ updated_at
CREATE TRIGGER update_signing_chains_updated_at
  BEFORE UPDATE ON public.signing_chains
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_signing_chain_steps_updated_at
  BEFORE UPDATE ON public.signing_chain_steps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.signing_chains;
ALTER PUBLICATION supabase_realtime ADD TABLE public.signing_chain_steps;
ALTER PUBLICATION supabase_realtime ADD TABLE public.document_journey_events;
