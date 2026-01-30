-- Add representative fields to organizations table
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS representative_name TEXT,
ADD COLUMN IF NOT EXISTS representative_national_id TEXT,
ADD COLUMN IF NOT EXISTS representative_phone TEXT,
ADD COLUMN IF NOT EXISTS representative_email TEXT,
ADD COLUMN IF NOT EXISTS representative_position TEXT,
ADD COLUMN IF NOT EXISTS delegate_name TEXT,
ADD COLUMN IF NOT EXISTS delegate_national_id TEXT,
ADD COLUMN IF NOT EXISTS delegate_phone TEXT,
ADD COLUMN IF NOT EXISTS delegate_email TEXT,
ADD COLUMN IF NOT EXISTS agent_name TEXT,
ADD COLUMN IF NOT EXISTS agent_national_id TEXT,
ADD COLUMN IF NOT EXISTS agent_phone TEXT,
ADD COLUMN IF NOT EXISTS agent_email TEXT;

-- Create storage bucket for organization documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'organization-documents',
  'organization-documents',
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create table for organization documents
CREATE TABLE IF NOT EXISTS public.organization_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'commercial_register', 'environmental_license', 'representative_id', 'delegate_authorization', 'other'
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on organization_documents
ALTER TABLE public.organization_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for organization_documents
CREATE POLICY "Users can view own organization documents"
ON public.organization_documents
FOR SELECT
USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can upload to own organization"
ON public.organization_documents
FOR INSERT
WITH CHECK (
  organization_id = get_user_organization_id(auth.uid()) AND
  (has_role(auth.uid(), 'company_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "Admins can view all documents"
ON public.organization_documents
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Company admins can delete own documents"
ON public.organization_documents
FOR DELETE
USING (
  organization_id = get_user_organization_id(auth.uid()) AND
  has_role(auth.uid(), 'company_admin'::app_role)
);

-- Storage policies for organization-documents bucket
CREATE POLICY "Users can view own organization files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'organization-documents' AND
  (
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.organizations WHERE id = get_user_organization_id(auth.uid())
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "Users can upload to own organization folder"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'organization-documents' AND
  (storage.foldername(name))[1] = get_user_organization_id(auth.uid())::text AND
  (has_role(auth.uid(), 'company_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "Users can delete own organization files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'organization-documents' AND
  (storage.foldername(name))[1] = get_user_organization_id(auth.uid())::text AND
  has_role(auth.uid(), 'company_admin'::app_role)
);