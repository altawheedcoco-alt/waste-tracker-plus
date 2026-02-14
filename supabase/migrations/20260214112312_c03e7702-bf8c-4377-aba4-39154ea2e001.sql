
-- Subscription plans
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description TEXT,
  price_egp NUMERIC(10,2) NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 30,
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User subscriptions
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'expired', 'cancelled', 'grace_period')),
  start_date TIMESTAMPTZ,
  expiry_date TIMESTAMPTZ,
  last_payment_date TIMESTAMPTZ,
  auto_renew BOOLEAN DEFAULT false,
  grace_period_hours INTEGER DEFAULT 24,
  payment_method TEXT,
  paymob_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payment transactions log
CREATE TABLE public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES public.user_subscriptions(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'EGP',
  payment_method TEXT NOT NULL,
  payment_provider TEXT DEFAULT 'paymob',
  provider_transaction_id TEXT,
  provider_order_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'refunded', 'voided')),
  error_message TEXT,
  card_last_four TEXT,
  card_brand TEXT,
  wallet_phone TEXT,
  receipt_url TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Paymob configuration
CREATE TABLE public.paymob_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT false,
  card_integration_id TEXT,
  wallet_integration_id TEXT,
  kiosk_integration_id TEXT,
  iframe_id TEXT,
  hmac_secret TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id)
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paymob_config ENABLE ROW LEVEL SECURITY;

-- Plans: public read
CREATE POLICY "Anyone can view active plans" ON public.subscription_plans
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage plans" ON public.subscription_plans
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Subscriptions: user can see own
CREATE POLICY "Users can view own subscription" ON public.user_subscriptions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can manage subscriptions" ON public.user_subscriptions
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Transactions: user can see own
CREATE POLICY "Users can view own transactions" ON public.payment_transactions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can insert transactions" ON public.payment_transactions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Paymob config: admin only
CREATE POLICY "Admins can manage paymob config" ON public.paymob_config
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Indexes
CREATE INDEX idx_user_subscriptions_user ON public.user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX idx_user_subscriptions_expiry ON public.user_subscriptions(expiry_date);
CREATE INDEX idx_payment_transactions_user ON public.payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX idx_payment_transactions_provider ON public.payment_transactions(provider_transaction_id);

-- Triggers
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_paymob_config_updated_at BEFORE UPDATE ON public.paymob_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default plan
INSERT INTO public.subscription_plans (name, name_ar, description, price_egp, duration_days, features) VALUES
('الخطة الشهرية', 'الخطة الشهرية', 'اشتراك شهري يشمل جميع المميزات', 299.00, 30, '["وصول كامل للوحة التحكم", "إشعارات فورية", "تقارير شهرية", "دعم فني"]'),
('الخطة السنوية', 'الخطة السنوية', 'اشتراك سنوي بخصم 20%', 2870.00, 365, '["جميع مميزات الخطة الشهرية", "خصم 20%", "أولوية الدعم الفني", "تقارير متقدمة"]');
