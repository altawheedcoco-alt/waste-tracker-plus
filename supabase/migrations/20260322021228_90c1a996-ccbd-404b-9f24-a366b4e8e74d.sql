-- Table to log document access events
CREATE TABLE IF NOT EXISTS public.document_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.organization_documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.document_access_log ENABLE ROW LEVEL SECURITY;

-- Org members can insert logs
CREATE POLICY "Members can insert doc access logs"
ON public.document_access_log FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.organization_members WHERE user_id = auth.uid() AND organization_id = document_access_log.organization_id)
);

-- Org head/assistant can view logs
CREATE POLICY "Heads can view doc access logs"
ON public.document_access_log FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.organization_members WHERE user_id = auth.uid() AND organization_id = document_access_log.organization_id AND member_role IN ('entity_head', 'assistant'))
);