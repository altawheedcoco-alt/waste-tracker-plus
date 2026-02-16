
-- Broker Transactions: tracks buy-from-generator, sell-to-recycler deals
CREATE TABLE public.broker_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'sale')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_transit', 'delivered', 'completed', 'cancelled')),
  counterparty_organization_id UUID REFERENCES public.organizations(id),
  counterparty_external_id UUID REFERENCES public.external_partners(id),
  counterparty_name TEXT,
  waste_type TEXT NOT NULL,
  waste_description TEXT,
  quantity_tons NUMERIC NOT NULL DEFAULT 0,
  actual_quantity_tons NUMERIC,
  quality_grade TEXT CHECK (quality_grade IN ('A', 'B', 'C', 'D', 'mixed')),
  price_per_ton NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC GENERATED ALWAYS AS (COALESCE(actual_quantity_tons, quantity_tons) * price_per_ton) STORED,
  currency TEXT DEFAULT 'EGP',
  shipment_id UUID REFERENCES public.shipments(id),
  exchange_listing_id UUID,
  invoice_id UUID REFERENCES public.invoices(id),
  location_governorate TEXT,
  pickup_address TEXT,
  delivery_address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

CREATE TABLE public.broker_deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  deal_name TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'partial', 'closed', 'cancelled')),
  purchase_transaction_id UUID REFERENCES public.broker_transactions(id),
  purchase_price_per_ton NUMERIC NOT NULL DEFAULT 0,
  purchase_quantity_tons NUMERIC NOT NULL DEFAULT 0,
  purchase_total NUMERIC GENERATED ALWAYS AS (purchase_quantity_tons * purchase_price_per_ton) STORED,
  sale_transaction_id UUID REFERENCES public.broker_transactions(id),
  sale_price_per_ton NUMERIC NOT NULL DEFAULT 0,
  sale_quantity_tons NUMERIC NOT NULL DEFAULT 0,
  sale_total NUMERIC GENERATED ALWAYS AS (sale_quantity_tons * sale_price_per_ton) STORED,
  transport_cost NUMERIC DEFAULT 0,
  other_costs NUMERIC DEFAULT 0,
  waste_type TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

CREATE TABLE public.broker_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  period_month TEXT NOT NULL,
  total_purchases NUMERIC DEFAULT 0,
  total_sales NUMERIC DEFAULT 0,
  total_profit NUMERIC DEFAULT 0,
  total_volume_tons NUMERIC DEFAULT 0,
  deal_count INT DEFAULT 0,
  avg_margin_percent NUMERIC DEFAULT 0,
  top_waste_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, period_month)
);

ALTER TABLE public.broker_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_performance ENABLE ROW LEVEL SECURITY;

-- RLS: broker_transactions
CREATE POLICY "broker_tx_select" ON public.broker_transactions FOR SELECT USING (
  organization_id IN (SELECT uo.organization_id FROM public.user_organizations uo WHERE uo.user_id = auth.uid())
  OR counterparty_organization_id IN (SELECT uo.organization_id FROM public.user_organizations uo WHERE uo.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
);
CREATE POLICY "broker_tx_insert" ON public.broker_transactions FOR INSERT
  WITH CHECK (organization_id IN (SELECT uo.organization_id FROM public.user_organizations uo WHERE uo.user_id = auth.uid()));
CREATE POLICY "broker_tx_update" ON public.broker_transactions FOR UPDATE
  USING (organization_id IN (SELECT uo.organization_id FROM public.user_organizations uo WHERE uo.user_id = auth.uid()));

-- RLS: broker_deals
CREATE POLICY "broker_deals_select" ON public.broker_deals FOR SELECT USING (
  organization_id IN (SELECT uo.organization_id FROM public.user_organizations uo WHERE uo.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
);
CREATE POLICY "broker_deals_insert" ON public.broker_deals FOR INSERT
  WITH CHECK (organization_id IN (SELECT uo.organization_id FROM public.user_organizations uo WHERE uo.user_id = auth.uid()));
CREATE POLICY "broker_deals_update" ON public.broker_deals FOR UPDATE
  USING (organization_id IN (SELECT uo.organization_id FROM public.user_organizations uo WHERE uo.user_id = auth.uid()));

-- RLS: broker_performance
CREATE POLICY "broker_perf_select" ON public.broker_performance FOR SELECT USING (
  organization_id IN (SELECT uo.organization_id FROM public.user_organizations uo WHERE uo.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
);
CREATE POLICY "broker_perf_insert" ON public.broker_performance FOR INSERT
  WITH CHECK (organization_id IN (SELECT uo.organization_id FROM public.user_organizations uo WHERE uo.user_id = auth.uid()));
CREATE POLICY "broker_perf_update" ON public.broker_performance FOR UPDATE
  USING (organization_id IN (SELECT uo.organization_id FROM public.user_organizations uo WHERE uo.user_id = auth.uid()));

-- Triggers
CREATE TRIGGER update_broker_transactions_updated_at BEFORE UPDATE ON public.broker_transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_broker_deals_updated_at BEFORE UPDATE ON public.broker_deals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_broker_performance_updated_at BEFORE UPDATE ON public.broker_performance FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_broker_transactions_org ON public.broker_transactions(organization_id);
CREATE INDEX idx_broker_transactions_type ON public.broker_transactions(transaction_type);
CREATE INDEX idx_broker_deals_org ON public.broker_deals(organization_id);
CREATE INDEX idx_broker_performance_org_month ON public.broker_performance(organization_id, period_month);
