-- إنشاء جميع الدوال اللازمة لنظام عزل الشركاء

-- 1. دالة للتحقق من وجود شراكة بين منظمتين
CREATE OR REPLACE FUNCTION public.are_partners(_org_id_1 uuid, _org_id_2 uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- إذا كان أحدهما null ارجع false
  IF _org_id_1 IS NULL OR _org_id_2 IS NULL THEN
    RETURN false;
  END IF;
  
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

-- 2. دالة لجلب organization_id للمستخدم الحالي
CREATE OR REPLACE FUNCTION public.get_current_user_org_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result uuid;
BEGIN
  SELECT p.organization_id INTO result
  FROM profiles p
  INNER JOIN auth.users u ON u.email = p.email
  WHERE u.id = auth.uid();
  
  RETURN result;
END;
$$;

-- 3. دالة للتحقق من إمكانية رؤية منظمة معينة
CREATE OR REPLACE FUNCTION public.can_view_organization(_org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_org_id uuid;
BEGIN
  IF _org_id IS NULL THEN
    RETURN false;
  END IF;
  
  user_org_id := public.get_current_user_org_id();
  
  -- المستخدم يرى منظمته
  IF user_org_id = _org_id THEN
    RETURN true;
  END IF;
  
  -- أو يرى شريك مرتبط
  RETURN public.are_partners(user_org_id, _org_id);
END;
$$;

-- 4. دالة للتحقق من إمكانية رؤية شحنة
CREATE OR REPLACE FUNCTION public.can_view_shipment(
  _generator_id uuid,
  _transporter_id uuid,
  _recycler_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_org_id uuid;
BEGIN
  user_org_id := public.get_current_user_org_id();
  
  IF user_org_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- المستخدم طرف في الشحنة
  IF user_org_id = _generator_id OR user_org_id = _transporter_id OR user_org_id = _recycler_id THEN
    RETURN true;
  END IF;
  
  -- أو شريك لأحد أطراف الشحنة
  RETURN (
    (_generator_id IS NOT NULL AND public.are_partners(user_org_id, _generator_id))
    OR (_transporter_id IS NOT NULL AND public.are_partners(user_org_id, _transporter_id))
    OR (_recycler_id IS NOT NULL AND public.are_partners(user_org_id, _recycler_id))
  );
END;
$$;