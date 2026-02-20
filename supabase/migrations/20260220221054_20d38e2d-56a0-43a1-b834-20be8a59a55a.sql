
DROP FUNCTION IF EXISTS public.get_user_organizations(uuid);

CREATE FUNCTION public.get_user_organizations(_user_id uuid)
RETURNS TABLE(
  organization_id uuid,
  organization_name text,
  organization_type text,
  role_in_organization text,
  is_primary boolean,
  is_active boolean,
  is_verified boolean,
  logo_url text
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    o.id as organization_id,
    o.name as organization_name,
    o.organization_type::text,
    uo.role_in_organization,
    uo.is_primary,
    uo.is_active,
    o.is_verified,
    o.logo_url
  FROM public.user_organizations uo
  JOIN public.organizations o ON o.id = uo.organization_id
  WHERE uo.user_id = _user_id AND uo.is_active = true
  ORDER BY uo.is_primary DESC, o.name ASC;
$$;
