
-- Document Templates: reusable templates created by generator orgs
CREATE TABLE public.document_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_en TEXT,
  description TEXT,
  template_type TEXT NOT NULL DEFAULT 'shipment_release',
  content_template TEXT,
  is_sequential BOOLEAN NOT NULL DEFAULT false,
  is_mandatory BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  auto_attach BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Template Signatories: who must sign each template
CREATE TABLE public.document_template_signatories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.document_templates(id) ON DELETE CASCADE,
  signatory_type TEXT NOT NULL DEFAULT 'internal',
  role_title TEXT NOT NULL,
  role_title_en TEXT,
  position_id UUID REFERENCES public.organization_positions(id),
  party_type TEXT,
  is_required BOOLEAN NOT NULL DEFAULT true,
  sign_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Shipment Documents: instance of a template attached to a shipment
CREATE TABLE public.shipment_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.document_templates(id),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  document_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  is_mandatory BOOLEAN NOT NULL DEFAULT false,
  is_sequential BOOLEAN NOT NULL DEFAULT false,
  total_signatures_required INT NOT NULL DEFAULT 0,
  completed_signatures INT NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Shipment Document Signatures: individual sign slots on a shipment document
CREATE TABLE public.shipment_doc_signatures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.shipment_documents(id) ON DELETE CASCADE,
  signatory_template_id UUID REFERENCES public.document_template_signatories(id),
  signer_user_id UUID REFERENCES auth.users(id),
  signer_name TEXT NOT NULL,
  signer_title TEXT NOT NULL,
  signer_national_id TEXT,
  party_type TEXT,
  sign_order INT NOT NULL DEFAULT 0,
  is_required BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'pending',
  signature_image_url TEXT,
  signature_method TEXT DEFAULT 'pending',
  signed_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT,
  integrity_hash TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_doc_templates_org ON public.document_templates(organization_id);
CREATE INDEX idx_doc_template_signatories_tpl ON public.document_template_signatories(template_id);
CREATE INDEX idx_shipment_documents_shipment ON public.shipment_documents(shipment_id);
CREATE INDEX idx_shipment_documents_org ON public.shipment_documents(organization_id);
CREATE INDEX idx_shipment_doc_sigs_doc ON public.shipment_doc_signatures(document_id);
CREATE INDEX idx_shipment_doc_sigs_signer ON public.shipment_doc_signatures(signer_user_id);

-- RLS
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_template_signatories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_doc_signatures ENABLE ROW LEVEL SECURITY;

-- Policies: document_templates
CREATE POLICY "Org members can view their templates"
  ON public.document_templates FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Org members can insert templates"
  ON public.document_templates FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Org members can update templates"
  ON public.document_templates FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Org members can delete templates"
  ON public.document_templates FOR DELETE
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- Policies: document_template_signatories
CREATE POLICY "View signatories of own templates"
  ON public.document_template_signatories FOR SELECT
  USING (template_id IN (SELECT id FROM public.document_templates WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())));

CREATE POLICY "Manage signatories insert"
  ON public.document_template_signatories FOR INSERT
  WITH CHECK (template_id IN (SELECT id FROM public.document_templates WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())));

CREATE POLICY "Manage signatories update"
  ON public.document_template_signatories FOR UPDATE
  USING (template_id IN (SELECT id FROM public.document_templates WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())));

CREATE POLICY "Manage signatories delete"
  ON public.document_template_signatories FOR DELETE
  USING (template_id IN (SELECT id FROM public.document_templates WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())));

-- Policies: shipment_documents
CREATE POLICY "View shipment documents for related orgs"
  ON public.shipment_documents FOR SELECT
  USING (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    OR shipment_id IN (
      SELECT id FROM public.shipments WHERE 
        generator_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
        OR transporter_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
        OR recycler_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Org members insert shipment documents"
  ON public.shipment_documents FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Org members update shipment documents"
  ON public.shipment_documents FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Org members delete shipment documents"
  ON public.shipment_documents FOR DELETE
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- Policies: shipment_doc_signatures
CREATE POLICY "View signatures for accessible documents"
  ON public.shipment_doc_signatures FOR SELECT
  USING (document_id IN (
    SELECT id FROM public.shipment_documents WHERE 
      organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
      OR shipment_id IN (
        SELECT id FROM public.shipments WHERE 
          generator_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
          OR transporter_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
          OR recycler_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
      )
  ));

CREATE POLICY "Insert signatures for accessible documents"
  ON public.shipment_doc_signatures FOR INSERT
  WITH CHECK (document_id IN (
    SELECT id FROM public.shipment_documents WHERE 
      organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
      OR shipment_id IN (
        SELECT id FROM public.shipments WHERE 
          generator_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
          OR transporter_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
          OR recycler_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
      )
  ));

CREATE POLICY "Signers can update their signatures"
  ON public.shipment_doc_signatures FOR UPDATE
  USING (
    signer_user_id = auth.uid()
    OR document_id IN (
      SELECT id FROM public.shipment_documents WHERE 
        organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- Auto-update completed_signatures count trigger
CREATE OR REPLACE FUNCTION public.update_shipment_doc_sig_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.shipment_documents
  SET 
    completed_signatures = (
      SELECT COUNT(*) FROM public.shipment_doc_signatures 
      WHERE document_id = COALESCE(NEW.document_id, OLD.document_id) AND status = 'signed'
    ),
    status = CASE
      WHEN (SELECT COUNT(*) FROM public.shipment_doc_signatures 
            WHERE document_id = COALESCE(NEW.document_id, OLD.document_id) AND status = 'signed'
      ) >= total_signatures_required THEN 'completed'
      WHEN (SELECT COUNT(*) FROM public.shipment_doc_signatures 
            WHERE document_id = COALESCE(NEW.document_id, OLD.document_id) AND status = 'signed'
      ) > 0 THEN 'in_progress'
      ELSE 'pending'
    END,
    completed_at = CASE
      WHEN (SELECT COUNT(*) FROM public.shipment_doc_signatures 
            WHERE document_id = COALESCE(NEW.document_id, OLD.document_id) AND status = 'signed'
      ) >= total_signatures_required THEN now()
      ELSE NULL
    END,
    updated_at = now()
  WHERE id = COALESCE(NEW.document_id, OLD.document_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_update_shipment_doc_sig_count
AFTER INSERT OR UPDATE OR DELETE ON public.shipment_doc_signatures
FOR EACH ROW EXECUTE FUNCTION public.update_shipment_doc_sig_count();
