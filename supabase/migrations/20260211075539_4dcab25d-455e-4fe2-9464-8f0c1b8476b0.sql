
-- PDF Archive for legal document retention (Base64 storage)
CREATE TABLE public.pdf_archives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  document_type TEXT NOT NULL, -- 'disposal_certificate', 'invoice', 'account_statement', 'weight_ticket'
  document_number TEXT NOT NULL,
  related_operation_id UUID,
  related_shipment_id UUID,
  file_name TEXT NOT NULL,
  pdf_base64 TEXT NOT NULL,
  file_size_bytes BIGINT,
  checksum TEXT, -- SHA-256 hash for integrity verification
  archived_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pdf_archives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org archives"
  ON public.pdf_archives FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert archives for their org"
  ON public.pdf_archives FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE INDEX idx_pdf_archives_org ON public.pdf_archives(organization_id);
CREATE INDEX idx_pdf_archives_doc_type ON public.pdf_archives(document_type, document_number);
