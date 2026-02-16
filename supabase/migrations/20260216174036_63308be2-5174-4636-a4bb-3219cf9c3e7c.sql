
CREATE TABLE public.driver_wallet (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  redeemed_points INTEGER DEFAULT 0,
  level TEXT DEFAULT 'bronze',
  streak_days INTEGER DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(driver_id)
);

CREATE TABLE public.driver_wallet_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  transaction_type TEXT NOT NULL,
  source TEXT NOT NULL,
  description TEXT,
  shipment_id UUID REFERENCES public.shipments(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.driver_emergencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  emergency_type TEXT NOT NULL,
  description TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  location_address TEXT,
  shipment_id UUID REFERENCES public.shipments(id),
  status TEXT DEFAULT 'active',
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  photos TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.driver_daily_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,
  total_deliveries INTEGER DEFAULT 0,
  total_weight NUMERIC(10,2) DEFAULT 0,
  total_distance_km NUMERIC(10,2) DEFAULT 0,
  avg_delivery_time_min INTEGER DEFAULT 0,
  on_time_deliveries INTEGER DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  performance_score INTEGER DEFAULT 0,
  fuel_efficiency_score INTEGER DEFAULT 0,
  summary_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(driver_id, report_date)
);

ALTER TABLE public.driver_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_emergencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_daily_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "driver_wallet_select" ON public.driver_wallet
  FOR SELECT USING (driver_id IN (SELECT id FROM public.drivers WHERE profile_id = auth.uid()));

CREATE POLICY "driver_wallet_admin" ON public.driver_wallet
  FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "wallet_tx_select" ON public.driver_wallet_transactions
  FOR SELECT USING (driver_id IN (SELECT id FROM public.drivers WHERE profile_id = auth.uid()));

CREATE POLICY "wallet_tx_insert" ON public.driver_wallet_transactions
  FOR INSERT WITH CHECK (
    driver_id IN (SELECT id FROM public.drivers WHERE profile_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "emergency_all" ON public.driver_emergencies
  FOR ALL USING (
    driver_id IN (SELECT id FROM public.drivers WHERE profile_id = auth.uid())
    OR organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "reports_select" ON public.driver_daily_reports
  FOR SELECT USING (driver_id IN (SELECT id FROM public.drivers WHERE profile_id = auth.uid()));

CREATE POLICY "reports_manage" ON public.driver_daily_reports
  FOR ALL USING (
    driver_id IN (SELECT id FROM public.drivers WHERE profile_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );
