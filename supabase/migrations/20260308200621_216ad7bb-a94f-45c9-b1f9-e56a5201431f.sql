
-- Fix function search_path for get_user_organization_id
CREATE OR REPLACE FUNCTION public.get_user_organization_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM public.profiles
  WHERE id = _user_id
  LIMIT 1;
$$;

-- Fix function search_path for has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role::public.app_role
  );
$$;

-- Add missing critical tables to realtime publication
DO $$
DECLARE
  tbl text;
  tables_to_add text[] := ARRAY[
    'deposits','invoices','organization_members','fleet_vehicles',
    'vehicle_maintenance','drivers','driver_shipment_assignments',
    'driver_shipment_offers','contracts','corrective_actions',
    'work_order_recipients','employee_permissions','disposal_operations',
    'disposal_incoming_requests','waste_exchange_listings','waste_exchange_bids',
    'partner_ratings','compliance_certificates','support_tickets',
    'ticket_messages','approval_requests','entity_documents',
    'document_registry','doc_registry_signers','signing_requests',
    'chat_messages','chat_rooms','direct_messages','notes',
    'collection_requests','accounting_ledger','account_periods',
    'external_partners','digital_wallets','recycling_reports',
    'carbon_footprint_records','profiles','organizations'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables_to_add LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = tbl) THEN
      IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = tbl AND schemaname = 'public'
      ) THEN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
      END IF;
    END IF;
  END LOOP;
END $$;
