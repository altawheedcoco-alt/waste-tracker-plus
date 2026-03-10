
-- Price Quotations System
CREATE TABLE public.quotations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quotation_number TEXT NOT NULL,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id),
  
  -- Client info (registered or unregistered)
  client_type TEXT NOT NULL DEFAULT 'unregistered' CHECK (client_type IN ('registered', 'unregistered')),
  client_organization_id UUID REFERENCES public.organizations(id),
  client_name TEXT,
  client_email TEXT,
  client_phone TEXT,
  client_address TEXT,
  client_tax_number TEXT,
  
  -- Quotation details
  title TEXT NOT NULL,
  description TEXT,
  entity_type TEXT NOT NULL,
  template_id TEXT,
  
  -- Financial
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,2) DEFAULT 14,
  tax_amount NUMERIC(12,2) DEFAULT 0,
  discount_amount NUMERIC(12,2) DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'EGP',
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired', 'cancelled')),
  valid_until TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  viewed_at TIMESTAMP WITH TIME ZONE,
  responded_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  -- Terms
  terms_and_conditions TEXT,
  notes TEXT,
  payment_terms TEXT,
  delivery_terms TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.quotation_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  item_order INTEGER NOT NULL DEFAULT 1,
  description TEXT NOT NULL,
  unit TEXT DEFAULT 'وحدة',
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;

-- RLS: Users can manage quotations from their organization
CREATE POLICY "Users can view own org quotations" ON public.quotations
  FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
    OR client_organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create quotations for own org" ON public.quotations
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own org quotations" ON public.quotations
  FOR UPDATE TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
    OR client_organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own org draft quotations" ON public.quotations
  FOR DELETE TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
    AND status = 'draft'
  );

-- Quotation items follow parent
CREATE POLICY "Users can manage quotation items" ON public.quotation_items
  FOR ALL TO authenticated
  USING (
    quotation_id IN (
      SELECT id FROM public.quotations WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
      )
    )
  );

-- Sequence for quotation numbers
CREATE SEQUENCE IF NOT EXISTS quotation_number_seq START 1000;

-- Index for performance
CREATE INDEX idx_quotations_org ON public.quotations(organization_id);
CREATE INDEX idx_quotations_client_org ON public.quotations(client_organization_id);
CREATE INDEX idx_quotations_status ON public.quotations(status);
CREATE INDEX idx_quotation_items_quotation ON public.quotation_items(quotation_id);
