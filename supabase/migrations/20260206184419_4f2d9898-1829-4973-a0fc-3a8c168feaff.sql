-- Create account_periods table for tracking accounting cycles
CREATE TABLE public.account_periods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  partner_organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  external_partner_id UUID REFERENCES public.external_partners(id) ON DELETE CASCADE,
  period_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  opening_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  closing_balance NUMERIC(12,2),
  total_shipments_value NUMERIC(12,2) DEFAULT 0,
  total_deposits NUMERIC(12,2) DEFAULT 0,
  total_shipments_count INTEGER DEFAULT 0,
  total_deposits_count INTEGER DEFAULT 0,
  carry_over_balance BOOLEAN DEFAULT false,
  closed_at TIMESTAMP WITH TIME ZONE,
  closed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure either partner_organization_id or external_partner_id is set
  CONSTRAINT account_periods_partner_check CHECK (
    (partner_organization_id IS NOT NULL AND external_partner_id IS NULL) OR
    (partner_organization_id IS NULL AND external_partner_id IS NOT NULL)
  )
);

-- Enable Row Level Security
ALTER TABLE public.account_periods ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their organization periods"
ON public.account_periods
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can create periods for their organization"
ON public.account_periods
FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update their organization periods"
ON public.account_periods
FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can delete their organization periods"
ON public.account_periods
FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Create index for faster lookups
CREATE INDEX idx_account_periods_org ON public.account_periods(organization_id);
CREATE INDEX idx_account_periods_partner ON public.account_periods(partner_organization_id);
CREATE INDEX idx_account_periods_external ON public.account_periods(external_partner_id);
CREATE INDEX idx_account_periods_status ON public.account_periods(status);
CREATE INDEX idx_account_periods_dates ON public.account_periods(start_date, end_date);

-- Add trigger for updated_at
CREATE TRIGGER update_account_periods_updated_at
BEFORE UPDATE ON public.account_periods
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();