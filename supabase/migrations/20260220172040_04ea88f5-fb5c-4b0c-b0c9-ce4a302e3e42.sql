
-- Track overdue subscription amounts per organization
CREATE TABLE IF NOT EXISTS public.subscription_arrears (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  months_overdue integer NOT NULL DEFAULT 0,
  monthly_rate numeric NOT NULL DEFAULT 0,
  subtotal numeric NOT NULL DEFAULT 0,
  penalty_rate numeric NOT NULL DEFAULT 0.02, -- 2% late fee
  penalty_amount numeric NOT NULL DEFAULT 0,
  total_due numeric NOT NULL DEFAULT 0,
  last_calculated_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id)
);

ALTER TABLE public.subscription_arrears ENABLE ROW LEVEL SECURITY;

-- Org members can view their own arrears
CREATE POLICY "Users can view own org arrears"
ON public.subscription_arrears FOR SELECT
TO authenticated
USING (organization_id = (SELECT get_current_user_org_id()));

-- System admin can view all
CREATE POLICY "Admin can view all arrears"
ON public.subscription_arrears FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only system can insert/update (via edge functions)
CREATE POLICY "System can manage arrears"
ON public.subscription_arrears FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Update can_org_operate to differentiate dashboard vs shipment access
-- Dashboard access: org must have paid its OWN subscription
CREATE OR REPLACE FUNCTION public.can_org_access_dashboard(org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_subscriptions us
    WHERE us.organization_id = org_id
    AND us.status IN ('active', 'grace_period')
    AND us.expiry_date > now()
  );
$$;

-- Shipment operations: org can operate if it paid OR any partner paid for it
-- (keep existing can_org_operate function as is - it already handles this)

-- Function to calculate arrears for an org
CREATE OR REPLACE FUNCTION public.calculate_org_arrears(org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_expiry timestamptz;
  months_count integer;
  monthly_price numeric;
  sub_total numeric;
  penalty numeric;
  total numeric;
BEGIN
  -- Get the last subscription expiry date
  SELECT expiry_date, price_per_seat
  INTO last_expiry, monthly_price
  FROM user_subscriptions
  WHERE organization_id = org_id
  ORDER BY expiry_date DESC NULLS LAST
  LIMIT 1;

  -- If never subscribed, count from org creation
  IF last_expiry IS NULL THEN
    SELECT created_at INTO last_expiry
    FROM organizations WHERE id = org_id;
    
    -- Default monthly price from cheapest active plan
    SELECT price_egp INTO monthly_price
    FROM subscription_plans
    WHERE is_active = true
    ORDER BY price_egp ASC LIMIT 1;
  END IF;

  IF monthly_price IS NULL THEN
    monthly_price := 299;
  END IF;

  -- Calculate months overdue
  IF last_expiry >= now() THEN
    RETURN jsonb_build_object(
      'months_overdue', 0, 'monthly_rate', monthly_price,
      'subtotal', 0, 'penalty_amount', 0, 'total_due', 0
    );
  END IF;

  months_count := GREATEST(1, CEIL(EXTRACT(EPOCH FROM (now() - last_expiry)) / (30 * 86400))::integer);
  
  -- Calculate with required seats
  sub_total := monthly_price * months_count * calculate_org_required_seats(org_id);
  penalty := sub_total * 0.02; -- 2% late fee
  total := sub_total + penalty;

  RETURN jsonb_build_object(
    'months_overdue', months_count,
    'monthly_rate', monthly_price,
    'seats', calculate_org_required_seats(org_id),
    'subtotal', sub_total,
    'penalty_rate', 0.02,
    'penalty_amount', penalty,
    'total_due', total
  );
END;
$$;
