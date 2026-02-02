-- Create deposits table for tracking all deposit transactions
CREATE TABLE public.deposits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  partner_organization_id UUID REFERENCES public.organizations(id),
  external_partner_id UUID REFERENCES public.external_partners(id),
  
  -- Deposit details
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EGP',
  deposit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Depositor information
  depositor_name TEXT NOT NULL,
  depositor_title TEXT,
  depositor_position TEXT,
  depositor_phone TEXT,
  
  -- Bank/Transfer details
  transfer_method TEXT NOT NULL DEFAULT 'bank_transfer', -- bank_transfer, wallet, instapay, cash, check, other
  bank_name TEXT,
  account_number TEXT,
  branch_name TEXT,
  reference_number TEXT,
  
  -- Receipt image
  receipt_url TEXT,
  
  -- AI extracted data
  ai_extracted_data JSONB,
  ai_confidence_score NUMERIC,
  
  -- Notes
  notes TEXT,
  
  -- Metadata
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their organization deposits"
  ON public.deposits FOR SELECT
  USING (
    organization_id = get_user_org_id_safe(auth.uid()) 
    OR partner_organization_id = get_user_org_id_safe(auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Users can create deposits for their organization"
  ON public.deposits FOR INSERT
  WITH CHECK (
    organization_id = get_user_org_id_safe(auth.uid()) 
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Users can update their organization deposits"
  ON public.deposits FOR UPDATE
  USING (
    organization_id = get_user_org_id_safe(auth.uid()) 
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Users can delete their organization deposits"
  ON public.deposits FOR DELETE
  USING (
    organization_id = get_user_org_id_safe(auth.uid()) 
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Create storage bucket for deposit receipts
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'deposit-receipts', 
  'deposit-receipts', 
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for deposit receipts
CREATE POLICY "Users can upload deposit receipts"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'deposit-receipts' 
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can view their organization deposit receipts"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'deposit-receipts' 
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can delete their deposit receipts"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'deposit-receipts' 
    AND auth.uid() IS NOT NULL
  );

-- Add index for faster queries
CREATE INDEX idx_deposits_organization_id ON public.deposits(organization_id);
CREATE INDEX idx_deposits_partner_organization_id ON public.deposits(partner_organization_id);
CREATE INDEX idx_deposits_external_partner_id ON public.deposits(external_partner_id);
CREATE INDEX idx_deposits_deposit_date ON public.deposits(deposit_date DESC);

-- Enable realtime for deposits
ALTER PUBLICATION supabase_realtime ADD TABLE public.deposits;