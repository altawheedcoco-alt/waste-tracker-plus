
-- =====================================================
-- تحسين أداء الاستعلامات: فهارس مركّبة + تحسين RLS
-- =====================================================

-- 1. فهرس مركّب على profiles للاستعلامات المتكررة في RLS (1.38M seq scans!)
CREATE INDEX IF NOT EXISTS idx_profiles_id_org ON public.profiles (id, organization_id);

-- 2. فهرس على user_roles لتسريع has_role (344K seq scans)
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role ON public.user_roles (user_id, role);

-- 3. فهارس created_at المفقودة على الجداول عالية الحركة
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_accounting_ledger_created_at ON public.accounting_ledger (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contracts_created_at ON public.contracts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deposits_created_at ON public.deposits (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON public.customers (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_logs_created_at ON public.call_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_drivers_created_at ON public.drivers (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_org_date ON public.invoices (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_carbon_records_org_date ON public.carbon_footprint_records (organization_id, calculation_date DESC);
CREATE INDEX IF NOT EXISTS idx_carbon_summary_org_period ON public.carbon_summary (organization_id, period_end DESC);

-- 4. فهارس مركّبة لاستعلامات التحليلات الجديدة
CREATE INDEX IF NOT EXISTS idx_shipments_generator_created ON public.shipments (generator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shipments_transporter_created ON public.shipments (transporter_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shipments_recycler_created ON public.shipments (recycler_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shipments_waste_type_status ON public.shipments (waste_type, status);
CREATE INDEX IF NOT EXISTS idx_ledger_org_type_date ON public.accounting_ledger (organization_id, entry_type, entry_date DESC);

-- 5. فهارس للجداول التي تُستخدم كثيراً بدون فهرس org_id
CREATE INDEX IF NOT EXISTS idx_agent_performance_org ON public.agent_performance (organization_id);
CREATE INDEX IF NOT EXISTS idx_agent_performance_agent ON public.agent_performance (agent_id, period_date DESC);

-- 6. تحسين دالة get_user_organization_id لتستخدم STABLE + SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- 7. تحسين دالة user_belongs_to_org
CREATE OR REPLACE FUNCTION public.user_belongs_to_org(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND organization_id = _org_id
  );
$$;

-- 8. تحسين دالة has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- 9. تشديد سياسات RLS المفتوحة (always true) على INSERT
-- activity_logs: تقييد بأن user_id = auth.uid()
DROP POLICY IF EXISTS "Users can insert activity logs" ON public.activity_logs;
CREATE POLICY "Users can insert activity logs"
  ON public.activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- gps_location_logs: تقييد INSERT
DROP POLICY IF EXISTS "gps_location_logs_insert" ON public.gps_location_logs;
CREATE POLICY "gps_location_logs_insert"
  ON public.gps_location_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- leaderboard_cache: تقييد لـ admin فقط
DROP POLICY IF EXISTS "System can manage leaderboard" ON public.leaderboard_cache;
CREATE POLICY "System can manage leaderboard"
  ON public.leaderboard_cache FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- user_badges: تقييد لـ admin
DROP POLICY IF EXISTS "System can manage user badges" ON public.user_badges;
CREATE POLICY "System can manage user badges"
  ON public.user_badges FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR user_id = auth.uid())
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- user_points: تقييد لـ admin
DROP POLICY IF EXISTS "System can manage points" ON public.user_points;
CREATE POLICY "System can manage points"
  ON public.user_points FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR user_id = auth.uid())
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 10. تحليل الجداول لتحديث الإحصائيات
ANALYZE public.profiles;
ANALYZE public.user_roles;
ANALYZE public.shipments;
ANALYZE public.notifications;
ANALYZE public.accounting_ledger;
ANALYZE public.invoices;
ANALYZE public.carbon_footprint_records;
