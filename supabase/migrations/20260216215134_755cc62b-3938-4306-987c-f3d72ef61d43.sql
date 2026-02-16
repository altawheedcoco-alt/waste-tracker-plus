
-- =====================================================
-- Phase 2: Self-Service Collection Portal (Uber-like)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.collection_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  portal_token_id UUID REFERENCES public.portal_access_tokens(id),
  request_type TEXT NOT NULL DEFAULT 'one_time' CHECK (request_type IN ('one_time', 'scheduled', 'emergency')),
  waste_type TEXT NOT NULL,
  waste_description TEXT,
  estimated_weight_kg NUMERIC,
  pickup_address TEXT NOT NULL,
  pickup_latitude NUMERIC,
  pickup_longitude NUMERIC,
  preferred_date DATE,
  preferred_time_slot TEXT CHECK (preferred_time_slot IN ('morning', 'afternoon', 'evening', 'anytime')),
  schedule_frequency TEXT CHECK (schedule_frequency IN ('daily', 'weekly', 'biweekly', 'monthly')),
  schedule_day_of_week INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'assigned', 'en_route', 'arrived', 'collecting', 'completed', 'cancelled', 'rejected')),
  assigned_driver_id UUID REFERENCES public.drivers(id),
  assigned_vehicle TEXT,
  shipment_id UUID REFERENCES public.shipments(id),
  estimated_price NUMERIC,
  final_price NUMERIC,
  currency TEXT DEFAULT 'EGP',
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  rating_comment TEXT,
  eta_minutes INTEGER,
  driver_latitude NUMERIC,
  driver_longitude NUMERIC,
  accepted_at TIMESTAMPTZ,
  assigned_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.collection_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can manage collection requests"
  ON public.collection_requests FOR ALL
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- =====================================================
-- Phase 4: Smart Insurance
-- =====================================================

CREATE TABLE IF NOT EXISTS public.shipment_insurance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  shipment_id UUID REFERENCES public.shipments(id),
  policy_number TEXT NOT NULL,
  insurance_provider TEXT NOT NULL DEFAULT 'iRecycle Insurance',
  coverage_type TEXT NOT NULL DEFAULT 'standard' CHECK (coverage_type IN ('basic', 'standard', 'comprehensive', 'hazardous')),
  waste_type TEXT NOT NULL,
  waste_hazard_level TEXT DEFAULT 'non_hazardous',
  distance_km NUMERIC,
  shipment_weight_kg NUMERIC,
  shipment_value NUMERIC,
  driver_risk_score NUMERIC DEFAULT 50,
  premium_amount NUMERIC NOT NULL,
  coverage_amount NUMERIC NOT NULL,
  deductible_amount NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'EGP',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'claimed', 'expired', 'cancelled')),
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  claim_filed_at TIMESTAMPTZ,
  claim_amount NUMERIC,
  claim_status TEXT CHECK (claim_status IN ('pending', 'approved', 'rejected', 'paid')),
  claim_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shipment_insurance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can manage insurance"
  ON public.shipment_insurance FOR ALL
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- =====================================================
-- Phase 6: Futures Market
-- =====================================================

CREATE TABLE IF NOT EXISTS public.transport_futures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  contract_number TEXT NOT NULL,
  counterparty_id UUID REFERENCES public.organizations(id),
  counterparty_external_id UUID REFERENCES public.external_partners(id),
  counterparty_name TEXT,
  waste_type TEXT NOT NULL,
  route_from TEXT,
  route_to TEXT,
  distance_km NUMERIC,
  fixed_price_per_ton NUMERIC NOT NULL,
  volume_tons_per_month NUMERIC NOT NULL,
  total_contract_value NUMERIC GENERATED ALWAYS AS (fixed_price_per_ton * volume_tons_per_month * 6) STORED,
  contract_duration_months INTEGER NOT NULL DEFAULT 6,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  current_market_price NUMERIC,
  price_difference NUMERIC,
  fuel_surcharge_cap NUMERIC,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'proposed', 'active', 'completed', 'terminated')),
  auto_renew BOOLEAN DEFAULT false,
  penalty_clause TEXT,
  created_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.transport_futures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can manage futures"
  ON public.transport_futures FOR ALL
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- =====================================================
-- Phase 9: E-Wallet & Payment System
-- =====================================================

CREATE TABLE IF NOT EXISTS public.digital_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) UNIQUE,
  balance NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EGP',
  is_active BOOLEAN NOT NULL DEFAULT true,
  credit_limit NUMERIC DEFAULT 0,
  auto_pay_enabled BOOLEAN DEFAULT false,
  auto_pay_threshold NUMERIC DEFAULT 0,
  total_deposited NUMERIC DEFAULT 0,
  total_withdrawn NUMERIC DEFAULT 0,
  total_earned NUMERIC DEFAULT 0,
  total_spent NUMERIC DEFAULT 0,
  last_transaction_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.digital_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can manage wallet"
  ON public.digital_wallets FOR ALL
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id UUID NOT NULL REFERENCES public.digital_wallets(id),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'payment', 'refund', 'earning', 'transfer', 'early_payment_discount')),
  amount NUMERIC NOT NULL,
  balance_before NUMERIC NOT NULL DEFAULT 0,
  balance_after NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'EGP',
  reference_type TEXT CHECK (reference_type IN ('shipment', 'invoice', 'insurance', 'future_contract', 'broker_deal', 'manual')),
  reference_id UUID,
  counterparty_org_id UUID REFERENCES public.organizations(id),
  counterparty_name TEXT,
  description TEXT,
  payment_method TEXT CHECK (payment_method IN ('bank_transfer', 'card', 'mobile_money', 'cash', 'system')),
  payment_proof_url TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'reversed')),
  early_payment_discount_pct NUMERIC,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can manage wallet transactions"
  ON public.wallet_transactions FOR ALL
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- =====================================================
-- Phase 10: Driver Academy
-- =====================================================

CREATE TABLE IF NOT EXISTS public.academy_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  description TEXT,
  description_ar TEXT,
  category TEXT NOT NULL CHECK (category IN ('safety', 'hazardous', 'driving', 'environmental', 'regulations', 'first_aid', 'adr')),
  difficulty_level TEXT NOT NULL DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  total_lessons INTEGER NOT NULL DEFAULT 1,
  passing_score INTEGER NOT NULL DEFAULT 70,
  certificate_type TEXT CHECK (certificate_type IN ('internal', 'ministry_certified', 'adr_certified', 'international')),
  certificate_validity_months INTEGER DEFAULT 12,
  is_mandatory BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  content JSONB DEFAULT '[]',
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.academy_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view courses"
  ON public.academy_courses FOR SELECT USING (true);

CREATE POLICY "Admins can manage courses"
  ON public.academy_courses FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE TABLE IF NOT EXISTS public.driver_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES public.drivers(id),
  course_id UUID NOT NULL REFERENCES public.academy_courses(id),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  status TEXT NOT NULL DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'in_progress', 'completed', 'failed', 'expired')),
  progress_pct NUMERIC NOT NULL DEFAULT 0,
  current_lesson INTEGER DEFAULT 1,
  quiz_score NUMERIC,
  quiz_attempts INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  certificate_issued BOOLEAN DEFAULT false,
  certificate_number TEXT,
  certificate_expiry DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(driver_id, course_id)
);

ALTER TABLE public.driver_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can manage enrollments"
  ON public.driver_enrollments FOR ALL
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_collection_requests_org ON public.collection_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_collection_requests_status ON public.collection_requests(status);
CREATE INDEX IF NOT EXISTS idx_shipment_insurance_org ON public.shipment_insurance(organization_id);
CREATE INDEX IF NOT EXISTS idx_transport_futures_org ON public.transport_futures(organization_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet ON public.wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_driver_enrollments_driver ON public.driver_enrollments(driver_id);

-- Update triggers
CREATE OR REPLACE TRIGGER update_collection_requests_updated_at BEFORE UPDATE ON public.collection_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_shipment_insurance_updated_at BEFORE UPDATE ON public.shipment_insurance FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_transport_futures_updated_at BEFORE UPDATE ON public.transport_futures FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_digital_wallets_updated_at BEFORE UPDATE ON public.digital_wallets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_driver_enrollments_updated_at BEFORE UPDATE ON public.driver_enrollments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
