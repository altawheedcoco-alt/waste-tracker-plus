-- =============================================
-- فهارس مركبة للاستعلامات المتكررة
-- Composite Indexes for Frequent Queries
-- =============================================

-- ============ جدول الشحنات (shipments) ============
CREATE INDEX IF NOT EXISTS idx_shipments_status_created 
ON public.shipments (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_shipments_generator_status 
ON public.shipments (generator_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_shipments_transporter_status 
ON public.shipments (transporter_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_shipments_recycler_status 
ON public.shipments (recycler_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_shipments_driver_status 
ON public.shipments (driver_id, status, created_at DESC) 
WHERE driver_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_shipments_waste_type_status 
ON public.shipments (waste_type, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_shipments_pending_auto_approve 
ON public.shipments (status, auto_approve_at) 
WHERE status = 'new' OR status = 'approved';

-- ============ جدول الفواتير (invoices) ============
CREATE INDEX IF NOT EXISTS idx_invoices_org_status_date 
ON public.invoices (organization_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_invoices_partner_status 
ON public.invoices (partner_organization_id, status, due_date);

CREATE INDEX IF NOT EXISTS idx_invoices_overdue 
ON public.invoices (status, due_date) 
WHERE status IN ('pending', 'partial');

CREATE INDEX IF NOT EXISTS idx_invoices_type_status 
ON public.invoices (invoice_type, status, created_at DESC);

-- ============ جدول الإشعارات (notifications) ============
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON public.notifications (user_id, is_read, created_at DESC) 
WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_notifications_user_type 
ON public.notifications (user_id, type, created_at DESC);

-- ============ جدول العقود (contracts) ============
CREATE INDEX IF NOT EXISTS idx_contracts_org_status 
ON public.contracts (organization_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contracts_partner_status 
ON public.contracts (partner_organization_id, status) 
WHERE partner_organization_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contracts_expiring 
ON public.contracts (status, end_date) 
WHERE status = 'active';

-- ============ جدول السائقين (drivers) ============
CREATE INDEX IF NOT EXISTS idx_drivers_org_available 
ON public.drivers (organization_id, is_available, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_drivers_license_expiry 
ON public.drivers (license_expiry, is_available) 
WHERE license_expiry IS NOT NULL;

-- ============ جدول الإيداعات (deposits) ============
CREATE INDEX IF NOT EXISTS idx_deposits_org_date 
ON public.deposits (organization_id, deposit_date DESC);

CREATE INDEX IF NOT EXISTS idx_deposits_partner_date 
ON public.deposits (partner_organization_id, deposit_date DESC) 
WHERE partner_organization_id IS NOT NULL;

-- ============ جدول المستندات (organization_documents) ============
CREATE INDEX IF NOT EXISTS idx_documents_org_status 
ON public.organization_documents (organization_id, verification_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_documents_pending 
ON public.organization_documents (verification_status, created_at DESC) 
WHERE verification_status = 'pending';

-- ============ جدول طلبات الموافقة (approval_requests) ============
CREATE INDEX IF NOT EXISTS idx_approvals_status_date 
ON public.approval_requests (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_approvals_org_status 
ON public.approval_requests (requester_organization_id, status, created_at DESC);

-- ============ جدول تذاكر الدعم (support_tickets) ============
CREATE INDEX IF NOT EXISTS idx_tickets_status_priority 
ON public.support_tickets (status, priority, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tickets_org_status 
ON public.support_tickets (organization_id, status, created_at DESC);

-- ============ جدول سجل المواقع (driver_location_logs) ============
CREATE INDEX IF NOT EXISTS idx_location_logs_driver_time 
ON public.driver_location_logs (driver_id, recorded_at DESC);

-- ============ جدول الملفات الشخصية (profiles) ============
CREATE INDEX IF NOT EXISTS idx_profiles_org_active 
ON public.profiles (organization_id, is_active, created_at DESC) 
WHERE is_active = true;

-- ============ جدول تقارير إعادة التدوير (recycling_reports) ============
CREATE INDEX IF NOT EXISTS idx_reports_org_date 
ON public.recycling_reports (recycler_organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reports_shipment 
ON public.recycling_reports (shipment_id);

-- ============ جدول سجل النشاط (activity_logs) ============
CREATE INDEX IF NOT EXISTS idx_activity_user_date 
ON public.activity_logs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_org_date 
ON public.activity_logs (organization_id, created_at DESC);

-- ============ جدول الرسائل المباشرة (direct_messages) ============
CREATE INDEX IF NOT EXISTS idx_messages_receiver_read 
ON public.direct_messages (receiver_organization_id, is_read, created_at DESC);

-- ============ توثيق الفهارس ============
COMMENT ON INDEX idx_shipments_status_created IS 'Composite index for dashboard shipment queries';
COMMENT ON INDEX idx_notifications_user_unread IS 'Partial index for unread notifications badge';
COMMENT ON INDEX idx_invoices_overdue IS 'Partial index for overdue invoice alerts';
COMMENT ON INDEX idx_contracts_expiring IS 'Partial index for contract expiry notifications';