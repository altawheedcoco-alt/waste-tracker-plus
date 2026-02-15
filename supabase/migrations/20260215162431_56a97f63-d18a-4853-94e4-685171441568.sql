
-- جدول لحفظ سجل التعديلات على قاعدة البيانات
CREATE TABLE IF NOT EXISTS public.system_schema_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_type text NOT NULL DEFAULT 'full', -- full, tables, functions, indexes, policies
  snapshot_data jsonb NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by text DEFAULT 'system'
);

ALTER TABLE public.system_schema_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view schema logs" ON public.system_schema_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "System can insert schema logs" ON public.system_schema_log
  FOR INSERT WITH CHECK (true);

-- دالة لالتقاط لقطة كاملة من الهيكل الحالي
CREATE OR REPLACE FUNCTION public.capture_schema_snapshot(p_description text DEFAULT 'Auto snapshot')
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_snapshot jsonb;
BEGIN
  SELECT jsonb_build_object(
    'captured_at', now()::text,
    'tables', (
      SELECT jsonb_agg(jsonb_build_object(
        'schema', t.table_schema,
        'name', t.table_name,
        'columns', (
          SELECT jsonb_agg(jsonb_build_object(
            'name', c.column_name,
            'type', c.data_type,
            'nullable', c.is_nullable,
            'default', c.column_default
          ) ORDER BY c.ordinal_position)
          FROM information_schema.columns c
          WHERE c.table_schema = t.table_schema AND c.table_name = t.table_name
        )
      ))
      FROM information_schema.tables t
      WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
    ),
    'functions', (
      SELECT jsonb_agg(jsonb_build_object(
        'name', p.proname,
        'args', pg_get_function_arguments(p.oid),
        'return_type', pg_get_function_result(p.oid),
        'language', l.lanname,
        'source', p.prosrc
      ))
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      JOIN pg_language l ON p.prolang = l.oid
      WHERE n.nspname = 'public'
    ),
    'indexes', (
      SELECT jsonb_agg(jsonb_build_object(
        'name', indexname,
        'table', tablename,
        'definition', indexdef
      ))
      FROM pg_indexes
      WHERE schemaname = 'public'
    ),
    'policies', (
      SELECT jsonb_agg(jsonb_build_object(
        'name', pol.polname,
        'table', cls.relname,
        'command', pol.polcmd,
        'permissive', pol.polpermissive,
        'roles', pol.polroles::text,
        'qual', pg_get_expr(pol.polqual, pol.polrelid),
        'with_check', pg_get_expr(pol.polwithcheck, pol.polrelid)
      ))
      FROM pg_policy pol
      JOIN pg_class cls ON pol.polrelid = cls.oid
      JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
      WHERE nsp.nspname = 'public'
    ),
    'triggers', (
      SELECT jsonb_agg(jsonb_build_object(
        'name', trigger_name,
        'table', event_object_table,
        'event', event_manipulation,
        'timing', action_timing,
        'statement', action_statement
      ))
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
    )
  ) INTO v_snapshot;

  INSERT INTO public.system_schema_log (snapshot_type, snapshot_data, description)
  VALUES ('full', v_snapshot, p_description)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- التقاط لقطة أولية
SELECT public.capture_schema_snapshot('Initial full schema snapshot - preserved for remix recovery');
