-- إنشاء دالة للتحقق من organization_id للمستخدم الحالي
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id 
  FROM profiles 
  WHERE id = auth.uid()
$$;

-- إنشاء دالة للتحقق من أن المستخدم ينتمي لمنظمة معينة
CREATE OR REPLACE FUNCTION public.user_belongs_to_organization(_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE id = auth.uid() 
    AND organization_id = _org_id
  )
$$;

-- حذف السياسات القديمة
DROP POLICY IF EXISTS "Organizations can create partnership requests" ON verified_partnerships;
DROP POLICY IF EXISTS "Organizations can view their partnerships" ON verified_partnerships;
DROP POLICY IF EXISTS "Organizations can update their partnerships" ON verified_partnerships;
DROP POLICY IF EXISTS "Organizations can delete their partnerships" ON verified_partnerships;

-- إنشاء سياسات جديدة باستخدام الدوال
CREATE POLICY "Users can create partnerships for their org"
ON verified_partnerships FOR INSERT
TO authenticated
WITH CHECK (
  public.user_belongs_to_organization(requester_org_id)
);

CREATE POLICY "Users can view their org partnerships"
ON verified_partnerships FOR SELECT
TO authenticated
USING (
  public.user_belongs_to_organization(requester_org_id) 
  OR public.user_belongs_to_organization(partner_org_id)
);

CREATE POLICY "Users can update their org partnerships"
ON verified_partnerships FOR UPDATE
TO authenticated
USING (
  public.user_belongs_to_organization(requester_org_id) 
  OR public.user_belongs_to_organization(partner_org_id)
);

CREATE POLICY "Users can delete their org partnerships"
ON verified_partnerships FOR DELETE
TO authenticated
USING (
  public.user_belongs_to_organization(requester_org_id)
);