-- =============================================
-- Materialized Views للتقارير المحسّنة
-- =============================================

-- ============ 1. إحصائيات الشحنات اليومية ============
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_daily_shipment_stats AS
SELECT 
  DATE(created_at) as report_date,
  generator_id,
  transporter_id,
  recycler_id,
  status,
  waste_type,
  COUNT(*) as shipment_count,
  SUM(COALESCE(quantity, 0)) as total_quantity,
  AVG(COALESCE(quantity, 0)) as avg_quantity
FROM public.shipments
WHERE created_at >= CURRENT_DATE - INTERVAL '365 days'
GROUP BY DATE(created_at), generator_id, transporter_id, recycler_id, status, waste_type
WITH DATA;

CREATE INDEX IF NOT EXISTS idx_mv_daily_stats_date ON public.mv_daily_shipment_stats (report_date DESC);
CREATE INDEX IF NOT EXISTS idx_mv_daily_stats_gen ON public.mv_daily_shipment_stats (generator_id, report_date DESC);
CREATE INDEX IF NOT EXISTS idx_mv_daily_stats_trans ON public.mv_daily_shipment_stats (transporter_id, report_date DESC);
CREATE INDEX IF NOT EXISTS idx_mv_daily_stats_rec ON public.mv_daily_shipment_stats (recycler_id, report_date DESC);

-- ============ 2. ملخص المؤسسات ============
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_organization_summary AS
SELECT 
  o.id as organization_id,
  o.name as organization_name,
  o.organization_type,
  o.is_verified,
  o.city,
  COALESCE(gen.total_generated, 0) as total_generated_shipments,
  COALESCE(trans.total_transported, 0) as total_transported_shipments,
  COALESCE(rec.total_recycled, 0) as total_recycled_shipments,
  COALESCE(gen.generated_quantity, 0) as total_generated_quantity,
  COALESCE(trans.transported_quantity, 0) as total_transported_quantity,
  COALESCE(rec.recycled_quantity, 0) as total_recycled_quantity,
  COALESCE(contracts.active_contracts, 0) as active_contracts_count,
  COALESCE(inv.total_invoices, 0) as total_invoices_count,
  COALESCE(emp.employee_count, 0) as employee_count,
  COALESCE(drv.driver_count, 0) as driver_count,
  NOW() as refreshed_at
FROM public.organizations o
LEFT JOIN (
  SELECT generator_id, COUNT(*) as total_generated, SUM(COALESCE(quantity, 0)) as generated_quantity
  FROM public.shipments GROUP BY generator_id
) gen ON gen.generator_id = o.id
LEFT JOIN (
  SELECT transporter_id, COUNT(*) as total_transported, SUM(COALESCE(quantity, 0)) as transported_quantity
  FROM public.shipments GROUP BY transporter_id
) trans ON trans.transporter_id = o.id
LEFT JOIN (
  SELECT recycler_id, COUNT(*) as total_recycled, SUM(COALESCE(quantity, 0)) as recycled_quantity
  FROM public.shipments GROUP BY recycler_id
) rec ON rec.recycler_id = o.id
LEFT JOIN (
  SELECT organization_id, COUNT(*) FILTER (WHERE status = 'active') as active_contracts
  FROM public.contracts GROUP BY organization_id
) contracts ON contracts.organization_id = o.id
LEFT JOIN (
  SELECT organization_id, COUNT(*) as total_invoices
  FROM public.invoices GROUP BY organization_id
) inv ON inv.organization_id = o.id
LEFT JOIN (
  SELECT organization_id, COUNT(*) as employee_count FROM public.profiles WHERE is_active = true GROUP BY organization_id
) emp ON emp.organization_id = o.id
LEFT JOIN (
  SELECT organization_id, COUNT(*) as driver_count FROM public.drivers GROUP BY organization_id
) drv ON drv.organization_id = o.id
WITH DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_org_summary_id ON public.mv_organization_summary (organization_id);
CREATE INDEX IF NOT EXISTS idx_mv_org_summary_type ON public.mv_organization_summary (organization_type);

-- ============ 3. تحليلات أنواع النفايات ============
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_waste_type_analytics AS
SELECT 
  waste_type,
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as shipment_count,
  SUM(COALESCE(quantity, 0)) as total_quantity,
  AVG(COALESCE(quantity, 0)) as avg_quantity,
  COUNT(DISTINCT generator_id) as unique_generators,
  COUNT(DISTINCT recycler_id) as unique_recyclers,
  COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_count,
  ROUND(COUNT(*) FILTER (WHERE status = 'confirmed')::numeric / NULLIF(COUNT(*), 0) * 100, 2) as completion_rate
FROM public.shipments
WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY waste_type, DATE_TRUNC('month', created_at)
WITH DATA;

CREATE INDEX IF NOT EXISTS idx_mv_waste_type ON public.mv_waste_type_analytics (waste_type);
CREATE INDEX IF NOT EXISTS idx_mv_waste_month ON public.mv_waste_type_analytics (month DESC);

-- ============ 4. لوحة المعلومات الإدارية ============
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_admin_dashboard AS
SELECT 
  (SELECT COUNT(*) FROM public.shipments) as total_shipments,
  (SELECT COUNT(*) FROM public.shipments WHERE status = 'new') as pending_shipments,
  (SELECT COUNT(*) FROM public.shipments WHERE status = 'confirmed') as confirmed_shipments,
  (SELECT SUM(COALESCE(quantity, 0)) FROM public.shipments) as total_quantity,
  (SELECT COUNT(*) FROM public.organizations) as total_organizations,
  (SELECT COUNT(*) FROM public.organizations WHERE is_verified = true) as verified_organizations,
  (SELECT COUNT(*) FROM public.organizations WHERE organization_type = 'generator') as generator_count,
  (SELECT COUNT(*) FROM public.organizations WHERE organization_type = 'transporter') as transporter_count,
  (SELECT COUNT(*) FROM public.organizations WHERE organization_type = 'recycler') as recycler_count,
  (SELECT COUNT(*) FROM public.profiles WHERE is_active = true) as active_users,
  (SELECT COUNT(*) FROM public.drivers) as total_drivers,
  (SELECT COUNT(*) FROM public.drivers WHERE is_available = true) as available_drivers,
  (SELECT COUNT(*) FROM public.contracts WHERE status = 'active') as active_contracts,
  (SELECT SUM(total_amount) FROM public.invoices) as total_invoiced,
  (SELECT SUM(paid_amount) FROM public.invoices) as total_paid,
  (SELECT COUNT(*) FROM public.invoices WHERE status = 'pending') as pending_invoices,
  (SELECT COUNT(*) FROM public.approval_requests WHERE status = 'pending') as pending_approvals,
  (SELECT COUNT(*) FROM public.support_tickets WHERE status IN ('open', 'in_progress')) as open_tickets,
  (SELECT COUNT(*) FROM public.organization_documents WHERE verification_status = 'pending') as pending_documents,
  NOW() as refreshed_at
WITH DATA;

-- ============ 5. تقارير التدوير المجمعة ============
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_recycling_summary AS
SELECT 
  r.recycler_organization_id,
  r.waste_category,
  DATE_TRUNC('month', r.created_at) as month,
  COUNT(r.id) as certificates_issued,
  COUNT(DISTINCT r.shipment_id) as unique_shipments
FROM public.recycling_reports r
WHERE r.created_at >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY r.recycler_organization_id, r.waste_category, DATE_TRUNC('month', r.created_at)
WITH DATA;

CREATE INDEX IF NOT EXISTS idx_mv_recycling_org ON public.mv_recycling_summary (recycler_organization_id, month DESC);

-- ============ 6. إحصائيات الفواتير الشهرية ============
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_monthly_invoice_stats AS
SELECT 
  organization_id,
  DATE_TRUNC('month', created_at) as month,
  invoice_type,
  status,
  COUNT(*) as invoice_count,
  SUM(total_amount) as total_amount,
  SUM(paid_amount) as paid_amount,
  SUM(remaining_amount) as remaining_amount
FROM public.invoices
WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY organization_id, DATE_TRUNC('month', created_at), invoice_type, status
WITH DATA;

CREATE INDEX IF NOT EXISTS idx_mv_invoice_org ON public.mv_monthly_invoice_stats (organization_id, month DESC);

-- ============ وظائف التحديث ============
CREATE OR REPLACE FUNCTION public.refresh_all_materialized_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW public.mv_daily_shipment_stats;
  REFRESH MATERIALIZED VIEW public.mv_organization_summary;
  REFRESH MATERIALIZED VIEW public.mv_waste_type_analytics;
  REFRESH MATERIALIZED VIEW public.mv_admin_dashboard;
  REFRESH MATERIALIZED VIEW public.mv_recycling_summary;
  REFRESH MATERIALIZED VIEW public.mv_monthly_invoice_stats;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_materialized_view(view_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  CASE view_name
    WHEN 'mv_daily_shipment_stats' THEN REFRESH MATERIALIZED VIEW public.mv_daily_shipment_stats;
    WHEN 'mv_organization_summary' THEN REFRESH MATERIALIZED VIEW public.mv_organization_summary;
    WHEN 'mv_waste_type_analytics' THEN REFRESH MATERIALIZED VIEW public.mv_waste_type_analytics;
    WHEN 'mv_admin_dashboard' THEN REFRESH MATERIALIZED VIEW public.mv_admin_dashboard;
    WHEN 'mv_recycling_summary' THEN REFRESH MATERIALIZED VIEW public.mv_recycling_summary;
    WHEN 'mv_monthly_invoice_stats' THEN REFRESH MATERIALIZED VIEW public.mv_monthly_invoice_stats;
    ELSE RAISE EXCEPTION 'Unknown materialized view: %', view_name;
  END CASE;
END;
$$;

-- جدول سجلات التحديث
CREATE TABLE IF NOT EXISTS public.materialized_view_refresh_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  view_name text NOT NULL,
  refreshed_at timestamptz NOT NULL DEFAULT now(),
  duration_ms integer,
  triggered_by text DEFAULT 'manual'
);

CREATE INDEX IF NOT EXISTS idx_mv_refresh_log ON public.materialized_view_refresh_log (view_name, refreshed_at DESC);

ALTER TABLE public.materialized_view_refresh_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view refresh logs" ON public.materialized_view_refresh_log
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

COMMENT ON FUNCTION public.refresh_all_materialized_views IS 'تحديث جميع الـ Materialized Views';
COMMENT ON FUNCTION public.refresh_materialized_view IS 'تحديث view محدد بالاسم';