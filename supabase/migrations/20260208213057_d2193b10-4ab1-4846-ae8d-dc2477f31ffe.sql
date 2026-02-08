-- دالة للتحقق من وجود شراكة بين منظمتين
CREATE OR REPLACE FUNCTION public.are_partners(_org_id_1 uuid, _org_id_2 uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM verified_partnerships vp
    WHERE vp.status = 'active'
    AND (
      (vp.requester_org_id = _org_id_1 AND vp.partner_org_id = _org_id_2)
      OR (vp.requester_org_id = _org_id_2 AND vp.partner_org_id = _org_id_1)
    )
  );
END;
$$;

-- دالة لجلب قائمة الشركاء المرتبطين للمستخدم الحالي
CREATE OR REPLACE FUNCTION public.get_user_partner_ids()
RETURNS uuid[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result uuid[];
BEGIN
  SELECT ARRAY_AGG(DISTINCT partner_id) INTO result
  FROM (
    SELECT 
      CASE 
        WHEN vp.requester_org_id = p.organization_id THEN vp.partner_org_id
        ELSE vp.requester_org_id
      END as partner_id
    FROM profiles p
    INNER JOIN auth.users u ON u.email = p.email
    INNER JOIN verified_partnerships vp ON (
      vp.requester_org_id = p.organization_id 
      OR vp.partner_org_id = p.organization_id
    )
    WHERE u.id = auth.uid()
    AND vp.status = 'active'
  ) partners;
  
  RETURN COALESCE(result, ARRAY[]::uuid[]);
END;
$$;