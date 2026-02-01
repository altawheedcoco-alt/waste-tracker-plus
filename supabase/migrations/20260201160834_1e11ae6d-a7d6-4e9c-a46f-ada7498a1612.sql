-- Create contracts table
CREATE TABLE public.contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  partner_organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  partner_name TEXT,
  contract_type TEXT NOT NULL DEFAULT 'service',
  status TEXT NOT NULL DEFAULT 'draft',
  start_date DATE,
  end_date DATE,
  value NUMERIC,
  currency TEXT DEFAULT 'EGP',
  terms TEXT,
  notes TEXT,
  attachment_url TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for faster queries
CREATE INDEX idx_contracts_organization_id ON public.contracts(organization_id);
CREATE INDEX idx_contracts_status ON public.contracts(status);
CREATE INDEX idx_contracts_end_date ON public.contracts(end_date);

-- Enable RLS
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their organization contracts"
  ON public.contracts
  FOR SELECT
  USING (
    organization_id = get_user_org_id_safe(auth.uid()) 
    OR partner_organization_id = get_user_org_id_safe(auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Users can create contracts for their organization"
  ON public.contracts
  FOR INSERT
  WITH CHECK (
    organization_id = get_user_org_id_safe(auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Users can update their organization contracts"
  ON public.contracts
  FOR UPDATE
  USING (
    organization_id = get_user_org_id_safe(auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Users can delete their organization contracts"
  ON public.contracts
  FOR DELETE
  USING (
    organization_id = get_user_org_id_safe(auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Generate contract number trigger
CREATE OR REPLACE FUNCTION public.generate_contract_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.contract_number := 'CNT-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || 
                         LPAD(CAST(FLOOR(RANDOM() * 10000) AS TEXT), 4, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER generate_contract_number_trigger
  BEFORE INSERT ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_contract_number();

-- Update timestamp trigger
CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();