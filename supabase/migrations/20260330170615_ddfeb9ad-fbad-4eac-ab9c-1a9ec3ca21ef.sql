-- Fix search_path for all notify_* trigger functions (no arguments)
DO $$
DECLARE
  func_record RECORD;
BEGIN
  FOR func_record IN
    SELECT p.proname
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname LIKE 'notify_%'
    AND (p.proconfig IS NULL OR NOT ('search_path=public' = ANY(p.proconfig)))
  LOOP
    EXECUTE format('ALTER FUNCTION public.%I() SET search_path = public;', func_record.proname);
  END LOOP;
END $$;
