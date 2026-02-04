-- إخفاء Materialized Views من API العام
-- Hide Materialized Views from public API

REVOKE SELECT ON public.mv_daily_shipment_stats FROM anon, authenticated;
REVOKE SELECT ON public.mv_organization_summary FROM anon, authenticated;
REVOKE SELECT ON public.mv_waste_type_analytics FROM anon, authenticated;
REVOKE SELECT ON public.mv_admin_dashboard FROM anon, authenticated;
REVOKE SELECT ON public.mv_recycling_summary FROM anon, authenticated;
REVOKE SELECT ON public.mv_monthly_invoice_stats FROM anon, authenticated;

-- إنشاء وظائف للوصول الآمن للبيانات من الـ Views

-- وظيفة للحصول على إحصائيات لوحة المسؤول
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS TABLE (
  total_shipments bigint,
  pending_shipments bigint,
  confirmed_shipments bigint,
  total_quantity numeric,
  total_organizations bigint,
  verified_organizations bigint,
  generator_count bigint,
  transporter_count bigint,
  recycler_count bigint,
  active_users bigint,
  total_drivers bigint,
  available_drivers bigint,
  active_contracts bigint,
  total_invoiced numeric,
  total_paid numeric,
  pending_invoices bigint,
  pending_approvals bigint,
  open_tickets bigint,
  pending_documents bigint,
  refreshed_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.mv_admin_dashboard
$$;

-- وظيفة للحصول على ملخص المؤسسة
CREATE OR REPLACE FUNCTION public.get_organization_summary(_org_id uuid)
RETURNS TABLE (
  organization_id uuid,
  organization_name text,
  organization_type text,
  is_verified boolean,
  city text,
  total_generated_shipments bigint,
  total_transported_shipments bigint,
  total_recycled_shipments bigint,
  total_generated_quantity numeric,
  total_transported_quantity numeric,
  total_recycled_quantity numeric,
  active_contracts_count bigint,
  total_invoices_count bigint,
  employee_count bigint,
  driver_count bigint,
  refreshed_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.mv_organization_summary WHERE organization_id = _org_id
$$;

-- وظيفة للحصول على إحصائيات الشحنات اليومية
CREATE OR REPLACE FUNCTION public.get_daily_shipment_stats(
  _org_id uuid,
  _start_date date DEFAULT CURRENT_DATE - INTERVAL '30 days',
  _end_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  report_date date,
  generator_id uuid,
  transporter_id uuid,
  recycler_id uuid,
  status text,
  waste_type text,
  shipment_count bigint,
  total_quantity numeric,
  avg_quantity numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.mv_daily_shipment_stats 
  WHERE (generator_id = _org_id OR transporter_id = _org_id OR recycler_id = _org_id)
    AND report_date BETWEEN _start_date AND _end_date
  ORDER BY report_date DESC
$$;

-- وظيفة للحصول على تحليلات أنواع النفايات
CREATE OR REPLACE FUNCTION public.get_waste_type_analytics(_org_id uuid DEFAULT NULL)
RETURNS TABLE (
  waste_type text,
  month timestamptz,
  shipment_count bigint,
  total_quantity numeric,
  avg_quantity numeric,
  unique_generators bigint,
  unique_recyclers bigint,
  confirmed_count bigint,
  completion_rate numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.mv_waste_type_analytics
  ORDER BY month DESC, total_quantity DESC
$$;

-- وظيفة للحصول على إحصائيات الفواتير الشهرية
CREATE OR REPLACE FUNCTION public.get_monthly_invoice_stats(_org_id uuid)
RETURNS TABLE (
  organization_id uuid,
  month timestamptz,
  invoice_type text,
  status text,
  invoice_count bigint,
  total_amount numeric,
  paid_amount numeric,
  remaining_amount numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.mv_monthly_invoice_stats
  WHERE organization_id = _org_id
  ORDER BY month DESC
$$;

-- وظيفة للحصول على ملخص شهادات التدوير
CREATE OR REPLACE FUNCTION public.get_recycling_summary(_org_id uuid)
RETURNS TABLE (
  recycler_organization_id uuid,
  waste_category text,
  month timestamptz,
  certificates_issued bigint,
  unique_shipments bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.mv_recycling_summary
  WHERE recycler_organization_id = _org_id
  ORDER BY month DESC
$$;

COMMENT ON FUNCTION public.get_admin_dashboard_stats IS 'Get pre-computed admin dashboard statistics';
COMMENT ON FUNCTION public.get_organization_summary IS 'Get organization summary from materialized view';
COMMENT ON FUNCTION public.get_daily_shipment_stats IS 'Get daily shipment statistics for an organization';
COMMENT ON FUNCTION public.get_waste_type_analytics IS 'Get waste type analytics data';
COMMENT ON FUNCTION public.get_monthly_invoice_stats IS 'Get monthly invoice statistics for an organization';
COMMENT ON FUNCTION public.get_recycling_summary IS 'Get recycling certificates summary for a recycler';