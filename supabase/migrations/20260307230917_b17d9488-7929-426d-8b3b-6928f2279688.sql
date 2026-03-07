
-- Central Document Registry & Signing Engine
-- Using text fields instead of enums for flexibility

-- Central Document Registry
CREATE TABLE public.document_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_number text NOT NULL DEFAULT ('DOC-' || substr(gen_random_uuid()::text, 1, 8)),
  title text NOT NULL,
  category text NOT NULL DEFAULT 'other',
  sub_category text,
  status text NOT NULL DEFAULT 'draft',
  organization_id uuid NOT NULL,
  created_by uuid,
  source_type text,
  source_id uuid,
  source_table text,
  file_url text,
  file_type text DEFAULT 'pdf',
  file_size_bytes bigint,
  thumbnail_url text,
  party_organization_ids uuid[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  tags text[] DEFAULT '{}',
  expires_at timestamptz,
  total_signatures_required integer DEFAULT 0,
  total_signatures_completed integer DEFAULT 0,
  issued_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_doc_reg_org ON public.document_registry(organization_id);
CREATE INDEX idx_doc_reg_cat ON public.document_registry(category);
CREATE INDEX idx_doc_reg_status ON public.document_registry(status);
CREATE INDEX idx_doc_reg_source ON public.document_registry(source_type, source_id);
CREATE INDEX idx_doc_reg_parties ON public.document_registry USING gin(party_organization_ids);
CREATE INDEX idx_doc_reg_number ON public.document_registry(document_number);
CREATE INDEX idx_doc_reg_created ON public.document_registry(created_at DESC);

-- Document Signing Workflow (links to existing document_signatures for actual sig data)
CREATE TABLE public.doc_registry_signers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.document_registry(id) ON DELETE CASCADE,
  signer_user_id uuid,
  signer_organization_id uuid,
  signer_role text,
  signer_name text,
  action_type text NOT NULL DEFAULT 'sign',
  status text NOT NULL DEFAULT 'pending',
  signature_record_id uuid REFERENCES public.document_signatures(id),
  signed_at timestamptz,
  sign_order integer DEFAULT 0,
  rejection_reason text,
  notification_sent boolean DEFAULT false,
  whatsapp_sent boolean DEFAULT false,
  reminder_count integer DEFAULT 0,
  last_reminder_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_drs_doc ON public.doc_registry_signers(document_id);
CREATE INDEX idx_drs_user ON public.doc_registry_signers(signer_user_id);
CREATE INDEX idx_drs_org ON public.doc_registry_signers(signer_organization_id);
CREATE INDEX idx_drs_pending ON public.doc_registry_signers(signer_user_id) WHERE status = 'pending';

-- RLS
ALTER TABLE public.document_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doc_registry_signers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "doc_reg_select" ON public.document_registry FOR SELECT TO authenticated
  USING (
    organization_id IN (SELECT p.organization_id FROM public.profiles p WHERE p.user_id = auth.uid())
    OR (SELECT p.organization_id FROM public.profiles p WHERE p.user_id = auth.uid()) = ANY(party_organization_ids)
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "doc_reg_insert" ON public.document_registry FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (SELECT p.organization_id FROM public.profiles p WHERE p.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "doc_reg_update" ON public.document_registry FOR UPDATE TO authenticated
  USING (
    organization_id IN (SELECT p.organization_id FROM public.profiles p WHERE p.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "drs_select" ON public.doc_registry_signers FOR SELECT TO authenticated
  USING (
    signer_user_id = auth.uid()
    OR signer_organization_id IN (SELECT p.organization_id FROM public.profiles p WHERE p.user_id = auth.uid())
    OR document_id IN (SELECT dr.id FROM public.document_registry dr WHERE dr.organization_id IN (SELECT p.organization_id FROM public.profiles p WHERE p.user_id = auth.uid()))
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "drs_manage" ON public.doc_registry_signers FOR ALL TO authenticated
  USING (
    signer_user_id = auth.uid()
    OR document_id IN (SELECT dr.id FROM public.document_registry dr WHERE dr.organization_id IN (SELECT p.organization_id FROM public.profiles p WHERE p.user_id = auth.uid()))
    OR public.has_role(auth.uid(), 'admin')
  );

-- Auto-update document status trigger
CREATE OR REPLACE FUNCTION public.update_registry_doc_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_total int; v_completed int; v_rejected int; v_new_status text; v_doc_id uuid;
BEGIN
  v_doc_id := COALESCE(NEW.document_id, OLD.document_id);
  SELECT count(*), count(*) FILTER (WHERE status = 'completed'), count(*) FILTER (WHERE status = 'rejected')
  INTO v_total, v_completed, v_rejected FROM doc_registry_signers WHERE document_id = v_doc_id;

  IF v_rejected > 0 THEN v_new_status := 'draft';
  ELSIF v_completed = v_total AND v_total > 0 THEN v_new_status := 'fully_signed';
  ELSIF v_completed > 0 THEN v_new_status := 'partially_signed';
  ELSIF v_total > 0 THEN v_new_status := 'pending_signatures';
  ELSE v_new_status := 'draft'; END IF;

  UPDATE document_registry SET status = v_new_status, total_signatures_required = v_total,
    total_signatures_completed = v_completed, updated_at = now() WHERE id = v_doc_id;
  RETURN COALESCE(NEW, OLD);
END; $$;

CREATE TRIGGER trg_update_reg_doc_status
AFTER INSERT OR UPDATE OR DELETE ON public.doc_registry_signers
FOR EACH ROW EXECUTE FUNCTION public.update_registry_doc_status();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.document_registry;
ALTER PUBLICATION supabase_realtime ADD TABLE public.doc_registry_signers;
