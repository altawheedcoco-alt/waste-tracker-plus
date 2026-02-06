-- Add signature permissions and settings
-- 1. Add signature_authorized column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS can_sign_documents boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS signature_authority_level text DEFAULT 'none';

-- 2. Create table for document signatures with full audit trail
CREATE TABLE IF NOT EXISTS public.document_signatures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_type text NOT NULL,
  document_id UUID NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  signed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  signer_name text NOT NULL,
  signer_role text,
  
  signature_method text NOT NULL,
  signature_image_url text,
  
  biometric_verified boolean DEFAULT false,
  biometric_type text,
  biometric_verification_id text,
  
  stamp_applied boolean DEFAULT false,
  stamp_verified_biometrically boolean DEFAULT false,
  
  ip_address text,
  device_info text,
  timestamp_signed timestamptz NOT NULL DEFAULT now(),
  
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Create organization signature settings table
CREATE TABLE IF NOT EXISTS public.organization_signature_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE UNIQUE,
  
  require_biometric_for_stamp boolean DEFAULT false,
  allow_stamp_without_biometric boolean DEFAULT true,
  
  allow_uploaded_signature boolean DEFAULT true,
  allow_drawn_signature boolean DEFAULT true,
  require_biometric_for_signature boolean DEFAULT false,
  
  default_signature_method text DEFAULT 'drawn',
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.document_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_signature_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_signatures
CREATE POLICY "Users can view signatures for their organization"
ON public.document_signatures FOR SELECT
USING (
  public.user_belongs_to_org(auth.uid(), organization_id)
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Authorized users can create signatures"
ON public.document_signatures FOR INSERT
WITH CHECK (
  public.user_belongs_to_org(auth.uid(), organization_id)
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND can_sign_documents = true
    )
    OR public.has_role(auth.uid(), 'admin')
  )
);

-- RLS Policies for signature settings
CREATE POLICY "Users can view their org signature settings"
ON public.organization_signature_settings FOR SELECT
USING (
  public.user_belongs_to_org(auth.uid(), organization_id)
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Organization members can manage signature settings"
ON public.organization_signature_settings FOR ALL
USING (
  public.user_belongs_to_org(auth.uid(), organization_id)
  OR public.has_role(auth.uid(), 'admin')
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_document_signatures_document 
ON public.document_signatures(document_type, document_id);

CREATE INDEX IF NOT EXISTS idx_document_signatures_org 
ON public.document_signatures(organization_id);