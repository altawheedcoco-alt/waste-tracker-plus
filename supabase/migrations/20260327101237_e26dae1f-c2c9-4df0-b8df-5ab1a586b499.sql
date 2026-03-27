-- Enable Realtime for ALL existing public tables dynamically
DO $$
DECLARE
  tbl RECORD;
BEGIN
  FOR tbl IN
    SELECT t.tablename
    FROM pg_tables t
    WHERE t.schemaname = 'public'
      AND t.tablename NOT IN (
        SELECT pt.tablename FROM pg_publication_tables pt
        WHERE pt.pubname = 'supabase_realtime' AND pt.schemaname = 'public'
      )
    ORDER BY t.tablename
  LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl.tablename);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Skipped table %: %', tbl.tablename, SQLERRM;
    END;
  END LOOP;
END $$;