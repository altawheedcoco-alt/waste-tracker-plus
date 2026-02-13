
CREATE OR REPLACE FUNCTION public.switch_organization(_user_id uuid, _organization_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _profile_id uuid;
BEGIN
  -- Get profile_id from auth user_id
  SELECT id INTO _profile_id FROM public.profiles WHERE user_id = _user_id;
  
  IF _profile_id IS NULL THEN
    RETURN false;
  END IF;

  -- Check if admin (admins can switch to any org)
  IF EXISTS (
    SELECT 1 FROM public.user_organizations
    WHERE user_id = _profile_id AND role_in_organization = 'admin'
  ) THEN
    UPDATE public.profiles
    SET active_organization_id = _organization_id,
        organization_id = _organization_id,
        updated_at = now()
    WHERE user_id = _user_id;
    RETURN true;
  END IF;

  -- Verify user has access to this organization
  IF NOT EXISTS (
    SELECT 1 FROM public.user_organizations
    WHERE user_id = _profile_id AND organization_id = _organization_id AND is_active = true
  ) THEN
    RETURN false;
  END IF;
  
  -- Update active_organization_id in profiles
  UPDATE public.profiles
  SET 
    active_organization_id = _organization_id,
    organization_id = _organization_id,
    updated_at = now()
  WHERE user_id = _user_id;
  
  RETURN true;
END;
$$;
