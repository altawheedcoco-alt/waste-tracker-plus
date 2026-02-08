-- تحديث الدالة لتبحث عن المستخدم بالـ email من auth.users
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.organization_id 
  FROM profiles p
  INNER JOIN auth.users u ON u.email = p.email
  WHERE u.id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.user_belongs_to_organization(_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM profiles p
    INNER JOIN auth.users u ON u.email = p.email
    WHERE u.id = auth.uid() 
    AND p.organization_id = _org_id
  )
$$;