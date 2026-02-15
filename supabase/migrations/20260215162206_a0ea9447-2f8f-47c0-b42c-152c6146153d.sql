
-- ============================================
-- تحسين أداء قاعدة البيانات - Performance Optimization v3
-- ============================================

-- 1) دوال مُحسّنة SECURITY DEFINER لتقليل subqueries في RLS
CREATE OR REPLACE FUNCTION public.get_current_user_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

-- 2) فهارس مركبة محسّنة

-- notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
ON public.notifications (user_id, is_read, created_at DESC);

-- partner_links
CREATE INDEX IF NOT EXISTS idx_partner_links_org_active 
ON public.partner_links (organization_id, status) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_partner_links_partner_active 
ON public.partner_links (partner_organization_id, status) WHERE status = 'active';

-- verified_partnerships
CREATE INDEX IF NOT EXISTS idx_vp_requester_active 
ON public.verified_partnerships (requester_org_id, status) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_vp_partner_active 
ON public.verified_partnerships (partner_org_id, status) WHERE status = 'active';

-- shipment_receipts
CREATE INDEX IF NOT EXISTS idx_shipment_receipts_transporter 
ON public.shipment_receipts (transporter_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_shipment_receipts_generator 
ON public.shipment_receipts (generator_id, created_at DESC);

-- activity_logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_org_action_time 
ON public.activity_logs (organization_id, action_type, created_at DESC);

-- shipments: فهارس مركبة
CREATE INDEX IF NOT EXISTS idx_shipments_generator_status 
ON public.shipments (generator_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_shipments_transporter_status 
ON public.shipments (transporter_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_shipments_recycler_status 
ON public.shipments (recycler_id, status, created_at DESC);

-- recycling_reports
CREATE INDEX IF NOT EXISTS idx_recycling_reports_recycler 
ON public.recycling_reports (recycler_organization_id, created_at DESC);

-- invoices
CREATE INDEX IF NOT EXISTS idx_invoices_partner_org 
ON public.invoices (partner_organization_id, created_at DESC) 
WHERE partner_organization_id IS NOT NULL;

-- deposits
CREATE INDEX IF NOT EXISTS idx_deposits_org_partner_date 
ON public.deposits (organization_id, partner_organization_id, deposit_date DESC);

-- 3) ANALYZE الجداول الحرجة
ANALYZE public.profiles;
ANALYZE public.user_roles;
ANALYZE public.user_organizations;
ANALYZE public.shipments;
ANALYZE public.notifications;
ANALYZE public.organizations;
ANALYZE public.partner_links;
ANALYZE public.activity_logs;
ANALYZE public.accounting_ledger;
ANALYZE public.delivery_declarations;
