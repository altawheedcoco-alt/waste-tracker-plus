
-- 1. Create helper function to get user's org id safely (if not exists)
CREATE OR REPLACE FUNCTION public.get_user_org_id_safe(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- 2. Fix work_orders policies (remove circular reference to work_order_recipients)
DROP POLICY IF EXISTS "Creator org can manage work orders" ON public.work_orders;
DROP POLICY IF EXISTS "Recipients can view work orders" ON public.work_orders;

CREATE POLICY "Creator org can manage work orders"
ON public.work_orders FOR ALL
USING (organization_id = get_user_org_id_safe(auth.uid()));

-- Use security definer function to check recipient without recursion
CREATE OR REPLACE FUNCTION public.is_work_order_recipient(_work_order_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.work_order_recipients
    WHERE work_order_id = _work_order_id
    AND recipient_organization_id = _org_id
  )
$$;

CREATE POLICY "Recipients can view work orders"
ON public.work_orders FOR SELECT
USING (is_work_order_recipient(id, get_user_org_id_safe(auth.uid())));

-- 3. Fix work_order_recipients policies (remove circular reference to work_orders)
DROP POLICY IF EXISTS "Creator org manages recipients" ON public.work_order_recipients;
DROP POLICY IF EXISTS "Recipient org can view and respond" ON public.work_order_recipients;

-- Use security definer function to check work order ownership without recursion
CREATE OR REPLACE FUNCTION public.is_work_order_owner(_work_order_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.work_orders
    WHERE id = _work_order_id
    AND organization_id = _org_id
  )
$$;

CREATE POLICY "Creator org manages recipients"
ON public.work_order_recipients FOR ALL
USING (is_work_order_owner(work_order_id, get_user_org_id_safe(auth.uid())));

CREATE POLICY "Recipient org can view and respond"
ON public.work_order_recipients FOR ALL
USING (recipient_organization_id = get_user_org_id_safe(auth.uid()));

-- 4. Fix environmental_consultants policies (remove circular reference)
DROP POLICY IF EXISTS "ec_select_by_org" ON public.environmental_consultants;

CREATE OR REPLACE FUNCTION public.is_consultant_assigned_to_org(_consultant_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.consultant_organization_assignments
    WHERE consultant_id = _consultant_id
    AND organization_id = _org_id
    AND is_active = true
  )
$$;

CREATE POLICY "ec_select_by_org"
ON public.environmental_consultants FOR SELECT
USING (is_consultant_assigned_to_org(id, get_user_org_id_safe(auth.uid())));

-- 5. Fix consultant_organization_assignments policies (fix self-compare bug + remove recursion)
DROP POLICY IF EXISTS "coa_select" ON public.consultant_organization_assignments;
DROP POLICY IF EXISTS "coa_insert" ON public.consultant_organization_assignments;
DROP POLICY IF EXISTS "coa_update" ON public.consultant_organization_assignments;
DROP POLICY IF EXISTS "coa_delete" ON public.consultant_organization_assignments;

CREATE OR REPLACE FUNCTION public.is_consultant_user(_consultant_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.environmental_consultants
    WHERE id = _consultant_id AND user_id = _user_id
  )
$$;

CREATE POLICY "coa_select"
ON public.consultant_organization_assignments FOR SELECT
USING (
  organization_id = get_user_org_id_safe(auth.uid())
  OR is_consultant_user(consultant_id, auth.uid())
);

CREATE POLICY "coa_insert"
ON public.consultant_organization_assignments FOR INSERT
WITH CHECK (organization_id = get_user_org_id_safe(auth.uid()));

CREATE POLICY "coa_update"
ON public.consultant_organization_assignments FOR UPDATE
USING (organization_id = get_user_org_id_safe(auth.uid()));

CREATE POLICY "coa_delete"
ON public.consultant_organization_assignments FOR DELETE
USING (organization_id = get_user_org_id_safe(auth.uid()));
