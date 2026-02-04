-- =============================================
-- Performance Optimization: Indexes & RLS
-- =============================================

-- 1. SHIPMENTS TABLE INDEXES (Most queried table)
-- =============================================

-- Index for status filtering (very common)
CREATE INDEX IF NOT EXISTS idx_shipments_status ON public.shipments(status);

-- Index for date range queries
CREATE INDEX IF NOT EXISTS idx_shipments_created_at ON public.shipments(created_at DESC);

-- Composite indexes for organization lookups with status
CREATE INDEX IF NOT EXISTS idx_shipments_generator_status ON public.shipments(generator_id, status);
CREATE INDEX IF NOT EXISTS idx_shipments_transporter_status ON public.shipments(transporter_id, status);
CREATE INDEX IF NOT EXISTS idx_shipments_recycler_status ON public.shipments(recycler_id, status);

-- Index for driver assignment queries
CREATE INDEX IF NOT EXISTS idx_shipments_driver_id ON public.shipments(driver_id) WHERE driver_id IS NOT NULL;

-- Index for waste type filtering
CREATE INDEX IF NOT EXISTS idx_shipments_waste_type ON public.shipments(waste_type);

-- 2. CONTRACTS TABLE INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_contracts_org_status ON public.contracts(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_contracts_end_date ON public.contracts(end_date) WHERE end_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contracts_partner_org ON public.contracts(partner_organization_id) WHERE partner_organization_id IS NOT NULL;

-- 3. INVOICES TABLE INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_invoices_org_status ON public.invoices(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_partner_org ON public.invoices(partner_organization_id) WHERE partner_organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON public.invoices(created_at DESC);

-- 4. NOTIFICATIONS TABLE INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);

-- 5. DRIVERS TABLE INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_drivers_org_available ON public.drivers(organization_id, is_available);
CREATE INDEX IF NOT EXISTS idx_drivers_profile_id ON public.drivers(profile_id);

-- 6. PROFILES TABLE INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_org_active ON public.profiles(organization_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 7. ORGANIZATIONS TABLE INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_organizations_type ON public.organizations(organization_type);
CREATE INDEX IF NOT EXISTS idx_organizations_verified ON public.organizations(is_verified) WHERE is_verified = true;
CREATE INDEX IF NOT EXISTS idx_organizations_client_code ON public.organizations(client_code);

-- 8. API KEYS & LOGS INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_api_keys_org_active ON public.api_keys(organization_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON public.api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_request_logs_key_time ON public.api_request_logs(api_key_id, created_at DESC);

-- 9. SUPPORT TICKETS INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_support_tickets_org_status ON public.support_tickets(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned ON public.support_tickets(assigned_to) WHERE assigned_to IS NOT NULL;

-- 10. DEPOSITS & PAYMENTS INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_deposits_org_date ON public.deposits(organization_id, deposit_date DESC);
CREATE INDEX IF NOT EXISTS idx_deposits_partner ON public.deposits(partner_organization_id) WHERE partner_organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_org_date ON public.payments(organization_id, payment_date DESC);

-- 11. ACTIVITY LOGS INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_activity_logs_org_time ON public.activity_logs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_time ON public.activity_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type ON public.activity_logs(action_type);

-- 12. DOCUMENT VERIFICATIONS INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_org_documents_org_status ON public.organization_documents(organization_id, verification_status);
CREATE INDEX IF NOT EXISTS idx_org_documents_type ON public.organization_documents(document_type);

-- 13. RECYCLING REPORTS INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_recycling_reports_recycler ON public.recycling_reports(recycler_organization_id);
CREATE INDEX IF NOT EXISTS idx_recycling_reports_shipment ON public.recycling_reports(shipment_id);

-- 14. CHAT MESSAGES INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_chat_messages_room_time ON public.chat_messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user ON public.chat_participants(user_id);

-- 15. EXTERNAL PARTNERS INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_external_partners_org ON public.external_partners(organization_id);
CREATE INDEX IF NOT EXISTS idx_external_partners_type ON public.external_partners(partner_type);

-- 16. USER ROLES INDEX
-- =============================================

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- 17. DRIVER LOCATION LOGS INDEXES (for tracking queries)
-- =============================================

CREATE INDEX IF NOT EXISTS idx_driver_location_driver_time ON public.driver_location_logs(driver_id, recorded_at DESC);

-- 18. APPROVAL REQUESTS INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON public.approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_org ON public.approval_requests(requester_organization_id);

-- =============================================
-- OPTIMIZED SECURITY DEFINER FUNCTIONS FOR RLS
-- =============================================

-- Function to check if user belongs to organization (cached lookup)
CREATE OR REPLACE FUNCTION public.user_belongs_to_org(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id
      AND organization_id = _org_id
      AND is_active = true
  )
$$;

-- Function to get user's organization IDs (for multi-org users)
CREATE OR REPLACE FUNCTION public.get_user_org_ids(_user_id uuid)
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    array_agg(DISTINCT organization_id) FILTER (WHERE organization_id IS NOT NULL),
    ARRAY[]::uuid[]
  )
  FROM public.profiles
  WHERE user_id = _user_id AND is_active = true
$$;

-- Function to check shipment access
CREATE OR REPLACE FUNCTION public.can_access_shipment(_user_id uuid, _shipment_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.shipments s
    JOIN public.profiles p ON p.user_id = _user_id AND p.is_active = true
    WHERE s.id = _shipment_id
      AND (
        s.generator_id = p.organization_id
        OR s.transporter_id = p.organization_id
        OR s.recycler_id = p.organization_id
        OR EXISTS (
          SELECT 1 FROM public.drivers d
          WHERE d.profile_id = p.id AND d.id = s.driver_id
        )
      )
  )
  OR public.has_role(_user_id, 'admin')
$$;

-- Function to check invoice access
CREATE OR REPLACE FUNCTION public.can_access_invoice(_user_id uuid, _invoice_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.invoices i
    JOIN public.profiles p ON p.user_id = _user_id AND p.is_active = true
    WHERE i.id = _invoice_id
      AND (
        i.organization_id = p.organization_id
        OR i.partner_organization_id = p.organization_id
      )
  )
  OR public.has_role(_user_id, 'admin')
$$;

-- Function to check contract access
CREATE OR REPLACE FUNCTION public.can_access_contract(_user_id uuid, _contract_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.contracts c
    JOIN public.profiles p ON p.user_id = _user_id AND p.is_active = true
    WHERE c.id = _contract_id
      AND (
        c.organization_id = p.organization_id
        OR c.partner_organization_id = p.organization_id
      )
  )
  OR public.has_role(_user_id, 'admin')
$$;

-- =============================================
-- ANALYZE TABLES FOR QUERY PLANNER
-- =============================================

ANALYZE public.shipments;
ANALYZE public.organizations;
ANALYZE public.profiles;
ANALYZE public.contracts;
ANALYZE public.invoices;
ANALYZE public.notifications;
ANALYZE public.drivers;
ANALYZE public.api_keys;
ANALYZE public.support_tickets;
ANALYZE public.deposits;
ANALYZE public.payments;
ANALYZE public.activity_logs;
ANALYZE public.organization_documents;
ANALYZE public.recycling_reports;