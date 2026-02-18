
-- Function to check if a user has an active subscription
-- System admins (role = 'admin') are always exempt
CREATE OR REPLACE FUNCTION public.has_active_subscription(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- System admins are always exempt
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = _user_id AND role = 'admin'
    )
    OR
    -- Check for active subscription
    EXISTS (
      SELECT 1 FROM public.user_subscriptions
      WHERE user_id = _user_id 
        AND status IN ('active', 'grace_period')
        AND (expiry_date IS NULL OR expiry_date > now())
    )
$$;

-- Function to check if an environmental consultant has active subscription
CREATE OR REPLACE FUNCTION public.consultant_has_active_subscription(_consultant_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_active_subscription(_consultant_user_id)
$$;
