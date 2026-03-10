
-- Enable realtime for missing critical tables
DO $$ 
BEGIN
  -- Core tables that may be missing
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'verified_partnerships' AND schemaname = 'public') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.verified_partnerships;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'work_orders' AND schemaname = 'public') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.work_orders;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'employee_permissions' AND schemaname = 'public') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.employee_permissions;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'award_letters' AND schemaname = 'public') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.award_letters;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'contracts' AND schemaname = 'public') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.contracts;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'approval_requests' AND schemaname = 'public') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.approval_requests;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'delivery_confirmations' AND schemaname = 'public') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_confirmations;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'digital_wallets' AND schemaname = 'public') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.digital_wallets;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'vehicle_maintenance' AND schemaname = 'public') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicle_maintenance;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'audit_sessions' AND schemaname = 'public') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_sessions;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'corrective_actions' AND schemaname = 'public') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.corrective_actions;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'partner_ratings' AND schemaname = 'public') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.partner_ratings;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'ai_agent_conversations' AND schemaname = 'public') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_agent_conversations;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'ai_agent_orders' AND schemaname = 'public') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_agent_orders;
  END IF;
END $$;
