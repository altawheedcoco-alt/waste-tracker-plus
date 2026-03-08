-- Enable realtime for remaining critical tables (using IF NOT EXISTS pattern)
DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'approval_requests', 'contracts', 'organizations', 'drivers', 'profiles',
    'accounting_ledger', 'support_tickets',
    'waste_auctions', 'recycling_reports', 'carbon_footprint_records',
    'organization_documents', 'compliance_certificates', 'document_signatures',
    'signature_verifications', 'delivery_declarations', 'delivery_confirmations',
    'account_periods', 'digital_wallets',
    'ai_agent_conversations', 'ai_agent_messages', 'ai_agent_orders',
    'workflow_rules', 'ocr_scan_results', 'digital_maturity_scores',
    'chat_messages', 'chat_rooms',
    'fleet_vehicles', 'vehicle_maintenance', 'driver_shipment_assignments',
    'job_listings', 'job_applications', 'worker_profiles',
    'testimonials', 'blog_posts', 'platform_news'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
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