
-- Subscription prepaid wallet per organization
CREATE TABLE IF NOT EXISTS public.subscription_wallet (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE UNIQUE,
  balance numeric NOT NULL DEFAULT 0,
  total_deposited numeric NOT NULL DEFAULT 0,
  total_deducted numeric NOT NULL DEFAULT 0,
  auto_deduct boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_wallet ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own wallet" ON public.subscription_wallet
FOR SELECT TO authenticated
USING (organization_id = (SELECT get_current_user_org_id()));

CREATE POLICY "Admin manages all wallets" ON public.subscription_wallet
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Transaction log for wallet deposits and deductions
CREATE TABLE IF NOT EXISTS public.subscription_wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  transaction_type text NOT NULL CHECK (transaction_type IN ('deposit', 'auto_deduct', 'refund', 'penalty')),
  amount numeric NOT NULL,
  balance_before numeric NOT NULL DEFAULT 0,
  balance_after numeric NOT NULL DEFAULT 0,
  description text,
  seats_count integer,
  months_covered integer,
  payment_reference text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own wallet txns" ON public.subscription_wallet_transactions
FOR SELECT TO authenticated
USING (organization_id = (SELECT get_current_user_org_id()));

CREATE POLICY "Admin manages wallet txns" ON public.subscription_wallet_transactions
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Function: auto-deduct monthly subscription from wallet
CREATE OR REPLACE FUNCTION public.auto_deduct_subscription(org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  wallet_record RECORD;
  seats integer;
  monthly_cost numeric;
  plan_price numeric;
  new_balance numeric;
BEGIN
  -- Get wallet
  SELECT * INTO wallet_record FROM subscription_wallet WHERE organization_id = org_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_wallet');
  END IF;

  IF NOT wallet_record.auto_deduct THEN
    RETURN jsonb_build_object('success', false, 'error', 'auto_deduct_disabled');
  END IF;

  -- Get required seats
  seats := calculate_org_required_seats(org_id);

  -- Get plan price
  SELECT price_egp INTO plan_price
  FROM subscription_plans WHERE is_active = true
  ORDER BY price_egp ASC LIMIT 1;

  IF plan_price IS NULL THEN plan_price := 299; END IF;

  monthly_cost := plan_price * seats;

  -- Check sufficient balance
  IF wallet_record.balance < monthly_cost THEN
    RETURN jsonb_build_object(
      'success', false, 'error', 'insufficient_balance',
      'required', monthly_cost, 'available', wallet_record.balance
    );
  END IF;

  new_balance := wallet_record.balance - monthly_cost;

  -- Deduct
  UPDATE subscription_wallet
  SET balance = new_balance,
      total_deducted = total_deducted + monthly_cost,
      updated_at = now()
  WHERE organization_id = org_id;

  -- Log transaction
  INSERT INTO subscription_wallet_transactions
    (organization_id, transaction_type, amount, balance_before, balance_after, description, seats_count, months_covered)
  VALUES
    (org_id, 'auto_deduct', monthly_cost, wallet_record.balance, new_balance,
     'خصم تلقائي - اشتراك شهري (' || seats || ' مقعد)', seats, 1);

  -- Renew/create subscription
  INSERT INTO user_subscriptions (organization_id, plan_id, status, start_date, expiry_date, total_seats, price_per_seat, total_amount)
  SELECT org_id, id, 'active', now(), now() + interval '30 days', seats, plan_price, monthly_cost
  FROM subscription_plans WHERE is_active = true ORDER BY price_egp ASC LIMIT 1
  ON CONFLICT (organization_id) DO UPDATE SET
    status = 'active',
    start_date = now(),
    expiry_date = now() + interval '30 days',
    total_seats = seats,
    price_per_seat = plan_price,
    total_amount = monthly_cost,
    updated_at = now();

  RETURN jsonb_build_object(
    'success', true, 'deducted', monthly_cost,
    'new_balance', new_balance, 'seats', seats, 'months', 1
  );
END;
$$;

-- Function: deposit into subscription wallet
CREATE OR REPLACE FUNCTION public.deposit_to_subscription_wallet(
  org_id uuid, deposit_amount numeric, pay_ref text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_balance numeric;
  new_balance numeric;
BEGIN
  -- Upsert wallet
  INSERT INTO subscription_wallet (organization_id, balance, total_deposited)
  VALUES (org_id, deposit_amount, deposit_amount)
  ON CONFLICT (organization_id) DO UPDATE SET
    balance = subscription_wallet.balance + deposit_amount,
    total_deposited = subscription_wallet.total_deposited + deposit_amount,
    updated_at = now()
  RETURNING balance - deposit_amount, balance INTO old_balance, new_balance;

  -- Log
  INSERT INTO subscription_wallet_transactions
    (organization_id, transaction_type, amount, balance_before, balance_after, description, payment_reference)
  VALUES
    (org_id, 'deposit', deposit_amount, COALESCE(old_balance, 0), new_balance,
     'إيداع رصيد اشتراكات', pay_ref);

  RETURN jsonb_build_object('success', true, 'new_balance', new_balance);
END;
$$;
