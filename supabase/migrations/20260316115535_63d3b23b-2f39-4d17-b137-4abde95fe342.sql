
-- AI Documents Archive
CREATE TABLE public.ai_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  document_type TEXT NOT NULL DEFAULT 'general',
  html_content TEXT NOT NULL,
  chat_messages JSONB,
  tags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft',
  shared_count INT DEFAULT 0,
  is_template BOOLEAN DEFAULT false,
  template_category TEXT,
  template_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI Document Shares
CREATE TABLE public.ai_document_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.ai_documents(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES public.profiles(id),
  shared_with_org_id UUID REFERENCES public.organizations(id),
  share_type TEXT NOT NULL DEFAULT 'link',
  share_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  is_active BOOLEAN DEFAULT true,
  views_count INT DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.ai_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_document_shares ENABLE ROW LEVEL SECURITY;

-- ai_documents policies
CREATE POLICY "Users can view own org documents"
ON public.ai_documents FOR SELECT TO authenticated
USING (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
));

CREATE POLICY "Users can insert own org documents"
ON public.ai_documents FOR INSERT TO authenticated
WITH CHECK (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
));

CREATE POLICY "Users can update own org documents"
ON public.ai_documents FOR UPDATE TO authenticated
USING (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
));

CREATE POLICY "Users can delete own org documents"
ON public.ai_documents FOR DELETE TO authenticated
USING (created_by = auth.uid());

-- Public templates viewable by all authenticated
CREATE POLICY "All can view templates"
ON public.ai_documents FOR SELECT TO authenticated
USING (is_template = true AND status = 'published');

-- ai_document_shares policies
CREATE POLICY "Users can view own shares"
ON public.ai_document_shares FOR SELECT TO authenticated
USING (shared_by = auth.uid() OR shared_with_org_id IN (
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
));

CREATE POLICY "Users can create shares"
ON public.ai_document_shares FOR INSERT TO authenticated
WITH CHECK (shared_by = auth.uid());

CREATE POLICY "Users can update own shares"
ON public.ai_document_shares FOR UPDATE TO authenticated
USING (shared_by = auth.uid());

-- Indexes
CREATE INDEX idx_ai_documents_org ON public.ai_documents(organization_id);
CREATE INDEX idx_ai_documents_type ON public.ai_documents(document_type);
CREATE INDEX idx_ai_documents_template ON public.ai_documents(is_template) WHERE is_template = true;
CREATE INDEX idx_ai_document_shares_code ON public.ai_document_shares(share_code);
