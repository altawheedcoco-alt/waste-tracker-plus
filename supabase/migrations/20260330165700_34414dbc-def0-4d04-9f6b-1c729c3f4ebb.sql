
-- Performance indexes for heavy tables
CREATE INDEX IF NOT EXISTS idx_notifications_user_org ON public.notifications (user_id, organization_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_shipments_status_date ON public.shipments (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shipments_driver ON public.shipments (driver_id, status) WHERE driver_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_activity_logs_org_created ON public.activity_logs (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ledger_org_date ON public.accounting_ledger (organization_id, entry_date DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_org ON public.profiles (organization_id) WHERE organization_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_org_positions_org ON public.organization_positions (organization_id, is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_ai_usage_org_date ON public.ai_usage_log (organization_id, created_at DESC);
