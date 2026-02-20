
-- Add seats tracking to user_subscriptions
ALTER TABLE public.user_subscriptions 
ADD COLUMN IF NOT EXISTS linked_orgs_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_seats integer NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_amount numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS price_per_seat numeric NOT NULL DEFAULT 0;

-- Function to calculate required seats for an organization
CREATE OR REPLACE FUNCTION public.calculate_org_required_seats(org_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 1 + COALESCE(
    (SELECT COUNT(*)::integer 
     FROM verified_partnerships 
     WHERE requester_org_id = org_id 
     AND status = 'active'),
    0
  );
$$;

-- Function to check if org subscription covers all linked partners
CREATE OR REPLACE FUNCTION public.is_org_subscription_valid(org_id uuid)
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
    AND us.total_seats >= public.calculate_org_required_seats(org_id)
    AND us.expiry_date > now()
  );
$$;

-- Function to check if a specific org can operate (has someone paying for it)
-- An org can operate if:
-- 1. It has its own valid subscription, OR
-- 2. At least one partner org that registered it has a valid subscription covering it
CREATE OR REPLACE FUNCTION public.can_org_operate(org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Check own subscription
    EXISTS (
      SELECT 1 FROM user_subscriptions us
      WHERE us.organization_id = org_id
      AND us.status IN ('active', 'grace_period')
      AND us.expiry_date > now()
    )
    OR
    -- Check if any requester org has valid subscription covering this org
    EXISTS (
      SELECT 1 FROM verified_partnerships vp
      JOIN user_subscriptions us ON us.organization_id = vp.requester_org_id
      WHERE vp.partner_org_id = org_id
      AND vp.status = 'active'
      AND us.status IN ('active', 'grace_period')
      AND us.expiry_date > now()
      AND us.total_seats >= public.calculate_org_required_seats(vp.requester_org_id)
    );
$$;
