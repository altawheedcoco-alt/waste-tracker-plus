
-- Table for shared documents between organizations
CREATE TABLE public.shared_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Sender info
  sender_organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  sender_user_id UUID NOT NULL,
  -- Recipient info
  recipient_organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  -- Document info
  document_type TEXT NOT NULL DEFAULT 'file', -- file, receipt, certificate, invoice, shipment, contract, report
  document_title TEXT NOT NULL,
  document_description TEXT,
  -- File reference (if uploaded file)
  file_url TEXT,
  file_name TEXT,
  file_size BIGINT,
  file_type TEXT,
  -- Reference to existing document (if sharing platform document)
  reference_id TEXT, -- ID of the receipt/certificate/invoice etc.
  reference_type TEXT, -- receipt, certificate, invoice, shipment, contract
  -- Status
  status TEXT NOT NULL DEFAULT 'sent', -- sent, viewed, downloaded, archived
  viewed_at TIMESTAMPTZ,
  viewed_by UUID,
  -- Message
  message TEXT,
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shared_documents ENABLE ROW LEVEL SECURITY;

-- Sender can view their sent documents
CREATE POLICY "Senders can view their shared documents"
ON public.shared_documents
FOR SELECT
TO authenticated
USING (
  public.user_belongs_to_org(auth.uid(), sender_organization_id)
);

-- Recipients can view documents shared with them
CREATE POLICY "Recipients can view documents shared with them"
ON public.shared_documents
FOR SELECT
TO authenticated
USING (
  public.user_belongs_to_org(auth.uid(), recipient_organization_id)
);

-- Users can insert documents from their organization
CREATE POLICY "Users can share documents from their org"
ON public.shared_documents
FOR INSERT
TO authenticated
WITH CHECK (
  public.user_belongs_to_org(auth.uid(), sender_organization_id)
);

-- Recipients can update status (mark as viewed/downloaded)
CREATE POLICY "Recipients can update document status"
ON public.shared_documents
FOR UPDATE
TO authenticated
USING (
  public.user_belongs_to_org(auth.uid(), recipient_organization_id)
)
WITH CHECK (
  public.user_belongs_to_org(auth.uid(), recipient_organization_id)
);

-- Senders can delete their shared documents
CREATE POLICY "Senders can delete their shared documents"
ON public.shared_documents
FOR DELETE
TO authenticated
USING (
  public.user_belongs_to_org(auth.uid(), sender_organization_id)
);

-- Index for fast lookups
CREATE INDEX idx_shared_docs_sender ON public.shared_documents(sender_organization_id);
CREATE INDEX idx_shared_docs_recipient ON public.shared_documents(recipient_organization_id);
CREATE INDEX idx_shared_docs_created ON public.shared_documents(created_at DESC);
CREATE INDEX idx_shared_docs_reference ON public.shared_documents(reference_id, reference_type);

-- Trigger for updated_at
CREATE TRIGGER update_shared_documents_updated_at
  BEFORE UPDATE ON public.shared_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for shared files
INSERT INTO storage.buckets (id, name, public) VALUES ('shared-documents', 'shared-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Authenticated users can upload shared documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'shared-documents');

CREATE POLICY "Users can view shared documents they have access to"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'shared-documents');
