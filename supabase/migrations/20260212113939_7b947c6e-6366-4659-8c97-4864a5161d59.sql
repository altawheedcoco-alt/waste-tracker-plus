
-- =============================================
-- SCALE OPTIMIZATION: Print System for 1000s of orgs
-- =============================================

-- 1) Additional indexes for high-volume queries
CREATE INDEX IF NOT EXISTS idx_print_log_user ON public.document_print_log (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_print_log_doc_type ON public.document_print_log (organization_id, document_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_print_log_action ON public.document_print_log (organization_id, action_type, created_at DESC);

-- 2) Security definer helper to avoid RLS subquery overhead at scale
CREATE OR REPLACE FUNCTION public.get_user_org_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.profiles WHERE id = _user_id LIMIT 1;
$$;

-- 3) Replace slow subquery RLS policies with fast function-based policies

-- document_print_log
DROP POLICY IF EXISTS "Users can view their org print logs" ON public.document_print_log;
DROP POLICY IF EXISTS "Users can insert print logs" ON public.document_print_log;

CREATE POLICY "Users can view their org print logs"
  ON public.document_print_log FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id(auth.uid()));

CREATE POLICY "Users can insert print logs"
  ON public.document_print_log FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id(auth.uid()));

-- Admin full access
CREATE POLICY "Admin full access to print logs"
  ON public.document_print_log FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- entity_print_preferences
DROP POLICY IF EXISTS "Users can view their org print prefs" ON public.entity_print_preferences;
DROP POLICY IF EXISTS "Users can manage their org print prefs" ON public.entity_print_preferences;

CREATE POLICY "Users can view their org print prefs"
  ON public.entity_print_preferences FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id(auth.uid()));

CREATE POLICY "Users can manage their org print prefs"
  ON public.entity_print_preferences FOR ALL TO authenticated
  USING (organization_id = public.get_user_org_id(auth.uid()));

CREATE POLICY "Admin full access to print prefs"
  ON public.entity_print_preferences FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
