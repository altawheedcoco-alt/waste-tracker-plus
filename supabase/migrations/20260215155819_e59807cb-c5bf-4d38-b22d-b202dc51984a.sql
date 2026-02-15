CREATE OR REPLACE FUNCTION public.switch_organization(_user_id uuid, _organization_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify profile exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = _user_id) THEN
    RETURN false;
  END IF;

  -- Check if system admin (via user_roles table - most authoritative)
  IF EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
  ) THEN
    -- Admin can switch to ANY organization regardless of membership
    UPDATE public.profiles
    SET active_organization_id = _organization_id,
        organization_id = _organization_id,
        updated_at = now()
    WHERE user_id = _user_id;
    RETURN true;
  END IF;

  -- For non-admins: check membership using auth user_id
  IF NOT EXISTS (
    SELECT 1 FROM public.user_organizations
    WHERE user_id = _user_id AND organization_id = _organization_id AND is_active = true
  ) THEN
    RETURN false;
  END IF;
  
  -- Update active organization
  UPDATE public.profiles
  SET 
    active_organization_id = _organization_id,
    organization_id = _organization_id,
    updated_at = now()
  WHERE user_id = _user_id;
  
  RETURN true;
END;
$$;