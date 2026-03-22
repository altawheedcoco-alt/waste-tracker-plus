
-- محفظة السائق المالية
CREATE TABLE public.driver_financial_wallet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE UNIQUE,
  balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  pending_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_earned NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_withdrawn NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EGP',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- معاملات محفظة السائق
CREATE TABLE public.driver_financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL DEFAULT 'earning',
  amount NUMERIC(12,2) NOT NULL,
  balance_after NUMERIC(12,2),
  description TEXT,
  shipment_id UUID REFERENCES public.shipments(id) ON DELETE SET NULL,
  reference_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_dft_driver ON public.driver_financial_transactions(driver_id);
CREATE INDEX idx_dft_type ON public.driver_financial_transactions(transaction_type);

-- مزايدات السائقين على الشحنات
CREATE TABLE public.driver_shipment_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  bid_amount NUMERIC(12,2) NOT NULL,
  estimated_arrival_minutes INTEGER,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(shipment_id, driver_id)
);

CREATE INDEX idx_dsb_shipment ON public.driver_shipment_bids(shipment_id);
CREATE INDEX idx_dsb_driver ON public.driver_shipment_bids(driver_id);

-- RLS
ALTER TABLE public.driver_financial_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_shipment_bids ENABLE ROW LEVEL SECURITY;

-- Wallet: driver reads own
CREATE POLICY "Drivers read own wallet"
  ON public.driver_financial_wallet FOR SELECT TO authenticated
  USING (driver_id IN (SELECT id FROM public.drivers WHERE profile_id = auth.uid()));

-- Transactions: driver reads own
CREATE POLICY "Drivers read own transactions"
  ON public.driver_financial_transactions FOR SELECT TO authenticated
  USING (driver_id IN (SELECT id FROM public.drivers WHERE profile_id = auth.uid()));

-- Bids: driver CRUD own
CREATE POLICY "Drivers manage own bids"
  ON public.driver_shipment_bids FOR ALL TO authenticated
  USING (driver_id IN (SELECT id FROM public.drivers WHERE profile_id = auth.uid()));

-- Bids: orgs read bids on their shipments
CREATE POLICY "Orgs read bids on their shipments"
  ON public.driver_shipment_bids FOR SELECT TO authenticated
  USING (shipment_id IN (SELECT id FROM public.shipments WHERE transporter_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
  )));
