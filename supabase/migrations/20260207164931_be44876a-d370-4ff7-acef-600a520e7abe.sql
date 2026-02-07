
-- Entity Documents Archive System
-- Stores all documents linked to organizations or external partners

CREATE TABLE public.entity_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Entity reference (either partner organization or external partner)
  partner_organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  external_partner_id UUID REFERENCES public.external_partners(id) ON DELETE SET NULL,
  
  -- Document categorization
  document_type TEXT NOT NULL CHECK (document_type IN (
    'award_letter', 'contract', 'correspondence', 'invoice', 
    'receipt', 'deposit_proof', 'weight_slip', 'certificate',
    'license', 'registration', 'other'
  )),
  document_category TEXT NOT NULL CHECK (document_category IN (
    'documents', 'financials', 'operations', 'legal', 'other'
  )),
  
  -- Document details
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT, -- mime type
  file_size INTEGER, -- in bytes
  
  -- Reference to source records (optional)
  shipment_id UUID REFERENCES public.shipments(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  deposit_id UUID REFERENCES public.deposits(id) ON DELETE SET NULL,
  award_letter_id UUID REFERENCES public.award_letters(id) ON DELETE SET NULL,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  
  -- Metadata
  document_date DATE, -- The date on the document itself
  reference_number TEXT,
  tags TEXT[],
  
  -- Upload info
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  uploaded_by_role TEXT, -- driver, employee, admin
  
  -- Search optimization
  search_text TSVECTOR,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for full-text search
CREATE INDEX idx_entity_documents_search ON public.entity_documents USING GIN(search_text);
CREATE INDEX idx_entity_documents_org ON public.entity_documents(organization_id);
CREATE INDEX idx_entity_documents_partner ON public.entity_documents(partner_organization_id);
CREATE INDEX idx_entity_documents_external ON public.entity_documents(external_partner_id);
CREATE INDEX idx_entity_documents_type ON public.entity_documents(document_type);
CREATE INDEX idx_entity_documents_category ON public.entity_documents(document_category);
CREATE INDEX idx_entity_documents_date ON public.entity_documents(document_date);
CREATE INDEX idx_entity_documents_created ON public.entity_documents(created_at);

-- Enable RLS
ALTER TABLE public.entity_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view documents in their organization"
ON public.entity_documents FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can insert documents in their organization"
ON public.entity_documents FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update documents in their organization"
ON public.entity_documents FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can delete documents in their organization"
ON public.entity_documents FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Function to auto-update search_text
CREATE OR REPLACE FUNCTION public.update_entity_document_search()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_text := to_tsvector('arabic', 
    COALESCE(NEW.title, '') || ' ' || 
    COALESCE(NEW.description, '') || ' ' ||
    COALESCE(NEW.reference_number, '') || ' ' ||
    COALESCE(NEW.file_name, '') || ' ' ||
    COALESCE(array_to_string(NEW.tags, ' '), '')
  );
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_entity_document_search
BEFORE INSERT OR UPDATE ON public.entity_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_entity_document_search();

-- Create storage bucket for entity documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'entity-documents',
  'entity-documents',
  false,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for entity-documents bucket
CREATE POLICY "Users can view entity documents in their organization"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'entity-documents' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND organization_id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Users can upload entity documents in their organization"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'entity-documents' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND organization_id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Users can delete entity documents in their organization"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'entity-documents' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND organization_id::text = (storage.foldername(name))[1]
  )
);
