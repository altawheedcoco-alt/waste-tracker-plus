-- Add verification columns to organization_documents
ALTER TABLE public.organization_documents 
ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'requires_review')),
ADD COLUMN IF NOT EXISTS verified_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS verified_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS verification_notes text,
ADD COLUMN IF NOT EXISTS rejection_reason text,
ADD COLUMN IF NOT EXISTS auto_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_confidence_score numeric,
ADD COLUMN IF NOT EXISTS ai_verification_result jsonb;

-- Create a comprehensive document verification tracking table
CREATE TABLE IF NOT EXISTS public.document_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES public.organization_documents(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  verification_type text NOT NULL CHECK (verification_type IN ('manual', 'auto', 'ai_assisted')),
  verification_action text NOT NULL CHECK (verification_action IN ('verify', 'reject', 'request_revision', 'escalate')),
  previous_status text,
  new_status text NOT NULL,
  verified_by uuid REFERENCES auth.users(id),
  notes text,
  ai_analysis jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.document_verifications ENABLE ROW LEVEL SECURITY;

-- Admin can view all verifications
CREATE POLICY "Admins can view all document verifications"
ON public.document_verifications
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin can insert verifications
CREATE POLICY "Admins can insert document verifications"
ON public.document_verifications
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Organizations can view their own verifications
CREATE POLICY "Organizations can view own document verifications"
ON public.document_verifications
FOR SELECT
USING (organization_id = get_user_org_id_safe(auth.uid()));

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_organization_documents_verification_status 
ON public.organization_documents(verification_status);

CREATE INDEX IF NOT EXISTS idx_document_verifications_document_id 
ON public.document_verifications(document_id);

CREATE INDEX IF NOT EXISTS idx_document_verifications_organization_id 
ON public.document_verifications(organization_id);