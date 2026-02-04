-- =============================================
-- نظام أرشفة البيانات التلقائي
-- Automatic Data Archiving System
-- =============================================

-- ============ 1. جداول الأرشيف ============

-- أرشيف الشحنات
CREATE TABLE IF NOT EXISTS public.archived_shipments (
  id uuid PRIMARY KEY,
  original_data jsonb NOT NULL,
  archived_at timestamptz NOT NULL DEFAULT now(),
  archived_by text DEFAULT 'system',
  retention_until timestamptz,
  archive_reason text DEFAULT 'age'
);

CREATE INDEX IF NOT EXISTS idx_archived_shipments_date ON public.archived_shipments (archived_at DESC);

-- أرشيف الإشعارات
CREATE TABLE IF NOT EXISTS public.archived_notifications (
  id uuid PRIMARY KEY,
  original_data jsonb NOT NULL,
  archived_at timestamptz NOT NULL DEFAULT now(),
  archived_by text DEFAULT 'system'
);

CREATE INDEX IF NOT EXISTS idx_archived_notifications_date ON public.archived_notifications (archived_at DESC);

-- أرشيف سجلات النشاط
CREATE TABLE IF NOT EXISTS public.archived_activity_logs (
  id uuid PRIMARY KEY,
  original_data jsonb NOT NULL,
  archived_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_archived_activity_date ON public.archived_activity_logs (archived_at DESC);

-- أرشيف مواقع السائقين
CREATE TABLE IF NOT EXISTS public.archived_driver_locations (
  id uuid PRIMARY KEY,
  original_data jsonb NOT NULL,
  archived_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_archived_driver_loc_date ON public.archived_driver_locations (archived_at DESC);

-- أرشيف الرسائل
CREATE TABLE IF NOT EXISTS public.archived_chat_messages (
  id uuid PRIMARY KEY,
  original_data jsonb NOT NULL,
  archived_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_archived_chat_date ON public.archived_chat_messages (archived_at DESC);

-- ============ 2. جدول إعدادات الأرشفة ============
CREATE TABLE IF NOT EXISTS public.archive_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL UNIQUE,
  retention_days integer NOT NULL DEFAULT 365,
  is_enabled boolean NOT NULL DEFAULT true,
  last_run_at timestamptz,
  records_archived integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- إعدادات افتراضية
INSERT INTO public.archive_settings (table_name, retention_days, is_enabled) VALUES
  ('shipments', 730, true),           -- سنتين للشحنات المكتملة
  ('notifications', 180, true),        -- 6 أشهر للإشعارات المقروءة
  ('activity_logs', 365, true),        -- سنة لسجلات النشاط
  ('driver_location_logs', 90, true),  -- 3 أشهر لمواقع السائقين
  ('chat_messages', 365, true)         -- سنة للرسائل
ON CONFLICT (table_name) DO NOTHING;

-- ============ 3. سجل عمليات الأرشفة ============
CREATE TABLE IF NOT EXISTS public.archive_run_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_started_at timestamptz NOT NULL DEFAULT now(),
  run_completed_at timestamptz,
  tables_processed text[],
  total_records_archived integer DEFAULT 0,
  errors jsonb,
  status text DEFAULT 'running'
);

CREATE INDEX IF NOT EXISTS idx_archive_run_log_date ON public.archive_run_log (run_started_at DESC);

-- ============ 4. وظائف الأرشفة ============

-- أرشفة الشحنات القديمة المكتملة
CREATE OR REPLACE FUNCTION public.archive_old_shipments(retention_days integer DEFAULT 730)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  archived_count integer := 0;
  cutoff_date timestamptz;
BEGIN
  cutoff_date := now() - (retention_days || ' days')::interval;
  
  -- نقل الشحنات المكتملة القديمة للأرشيف
  WITH moved AS (
    DELETE FROM public.shipments
    WHERE status IN ('confirmed', 'cancelled', 'rejected')
      AND updated_at < cutoff_date
    RETURNING *
  )
  INSERT INTO public.archived_shipments (id, original_data, archive_reason)
  SELECT id, to_jsonb(moved), 'age_' || status
  FROM moved;
  
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  
  -- تحديث إعدادات الأرشفة
  UPDATE public.archive_settings 
  SET last_run_at = now(), 
      records_archived = records_archived + archived_count,
      updated_at = now()
  WHERE table_name = 'shipments';
  
  RETURN archived_count;
END;
$$;

-- أرشفة الإشعارات القديمة المقروءة
CREATE OR REPLACE FUNCTION public.archive_old_notifications(retention_days integer DEFAULT 180)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  archived_count integer := 0;
  cutoff_date timestamptz;
BEGIN
  cutoff_date := now() - (retention_days || ' days')::interval;
  
  WITH moved AS (
    DELETE FROM public.notifications
    WHERE is_read = true AND created_at < cutoff_date
    RETURNING *
  )
  INSERT INTO public.archived_notifications (id, original_data)
  SELECT id, to_jsonb(moved) FROM moved;
  
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  
  UPDATE public.archive_settings 
  SET last_run_at = now(), 
      records_archived = records_archived + archived_count,
      updated_at = now()
  WHERE table_name = 'notifications';
  
  RETURN archived_count;
END;
$$;

-- أرشفة سجلات النشاط القديمة
CREATE OR REPLACE FUNCTION public.archive_old_activity_logs(retention_days integer DEFAULT 365)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  archived_count integer := 0;
  cutoff_date timestamptz;
BEGIN
  cutoff_date := now() - (retention_days || ' days')::interval;
  
  WITH moved AS (
    DELETE FROM public.activity_logs
    WHERE created_at < cutoff_date
    RETURNING *
  )
  INSERT INTO public.archived_activity_logs (id, original_data)
  SELECT id, to_jsonb(moved) FROM moved;
  
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  
  UPDATE public.archive_settings 
  SET last_run_at = now(), 
      records_archived = records_archived + archived_count,
      updated_at = now()
  WHERE table_name = 'activity_logs';
  
  RETURN archived_count;
END;
$$;

-- أرشفة مواقع السائقين القديمة
CREATE OR REPLACE FUNCTION public.archive_old_driver_locations(retention_days integer DEFAULT 90)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  archived_count integer := 0;
  cutoff_date timestamptz;
BEGIN
  cutoff_date := now() - (retention_days || ' days')::interval;
  
  WITH moved AS (
    DELETE FROM public.driver_location_logs
    WHERE recorded_at < cutoff_date
    RETURNING *
  )
  INSERT INTO public.archived_driver_locations (id, original_data)
  SELECT id, to_jsonb(moved) FROM moved;
  
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  
  UPDATE public.archive_settings 
  SET last_run_at = now(), 
      records_archived = records_archived + archived_count,
      updated_at = now()
  WHERE table_name = 'driver_location_logs';
  
  RETURN archived_count;
END;
$$;

-- أرشفة الرسائل القديمة
CREATE OR REPLACE FUNCTION public.archive_old_chat_messages(retention_days integer DEFAULT 365)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  archived_count integer := 0;
  cutoff_date timestamptz;
BEGIN
  cutoff_date := now() - (retention_days || ' days')::interval;
  
  WITH moved AS (
    DELETE FROM public.chat_messages
    WHERE created_at < cutoff_date
    RETURNING *
  )
  INSERT INTO public.archived_chat_messages (id, original_data)
  SELECT id, to_jsonb(moved) FROM moved;
  
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  
  UPDATE public.archive_settings 
  SET last_run_at = now(), 
      records_archived = records_archived + archived_count,
      updated_at = now()
  WHERE table_name = 'chat_messages';
  
  RETURN archived_count;
END;
$$;

-- ============ 5. وظيفة الأرشفة الشاملة ============
CREATE OR REPLACE FUNCTION public.run_full_archive()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  run_id uuid;
  shipments_count integer := 0;
  notifications_count integer := 0;
  activity_count integer := 0;
  locations_count integer := 0;
  messages_count integer := 0;
  setting record;
  errors jsonb := '[]'::jsonb;
BEGIN
  -- إنشاء سجل للعملية
  INSERT INTO public.archive_run_log (status) VALUES ('running') RETURNING id INTO run_id;
  
  -- أرشفة كل جدول حسب إعداداته
  FOR setting IN SELECT * FROM public.archive_settings WHERE is_enabled = true LOOP
    BEGIN
      CASE setting.table_name
        WHEN 'shipments' THEN
          shipments_count := public.archive_old_shipments(setting.retention_days);
        WHEN 'notifications' THEN
          notifications_count := public.archive_old_notifications(setting.retention_days);
        WHEN 'activity_logs' THEN
          activity_count := public.archive_old_activity_logs(setting.retention_days);
        WHEN 'driver_location_logs' THEN
          locations_count := public.archive_old_driver_locations(setting.retention_days);
        WHEN 'chat_messages' THEN
          messages_count := public.archive_old_chat_messages(setting.retention_days);
      END CASE;
    EXCEPTION WHEN OTHERS THEN
      errors := errors || jsonb_build_object('table', setting.table_name, 'error', SQLERRM);
    END;
  END LOOP;
  
  -- تحديث سجل العملية
  UPDATE public.archive_run_log 
  SET run_completed_at = now(),
      tables_processed = ARRAY['shipments', 'notifications', 'activity_logs', 'driver_location_logs', 'chat_messages'],
      total_records_archived = shipments_count + notifications_count + activity_count + locations_count + messages_count,
      errors = CASE WHEN errors = '[]'::jsonb THEN NULL ELSE errors END,
      status = CASE WHEN errors = '[]'::jsonb THEN 'completed' ELSE 'completed_with_errors' END
  WHERE id = run_id;
  
  RETURN jsonb_build_object(
    'run_id', run_id,
    'shipments_archived', shipments_count,
    'notifications_archived', notifications_count,
    'activity_logs_archived', activity_count,
    'driver_locations_archived', locations_count,
    'chat_messages_archived', messages_count,
    'total_archived', shipments_count + notifications_count + activity_count + locations_count + messages_count,
    'errors', errors
  );
END;
$$;

-- ============ 6. وظيفة استعادة من الأرشيف ============
CREATE OR REPLACE FUNCTION public.restore_from_archive(
  p_table_name text,
  p_record_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  archived_data jsonb;
BEGIN
  CASE p_table_name
    WHEN 'shipments' THEN
      SELECT original_data INTO archived_data FROM public.archived_shipments WHERE id = p_record_id;
      IF archived_data IS NOT NULL THEN
        INSERT INTO public.shipments SELECT * FROM jsonb_populate_record(null::public.shipments, archived_data);
        DELETE FROM public.archived_shipments WHERE id = p_record_id;
        RETURN true;
      END IF;
    WHEN 'notifications' THEN
      SELECT original_data INTO archived_data FROM public.archived_notifications WHERE id = p_record_id;
      IF archived_data IS NOT NULL THEN
        INSERT INTO public.notifications SELECT * FROM jsonb_populate_record(null::public.notifications, archived_data);
        DELETE FROM public.archived_notifications WHERE id = p_record_id;
        RETURN true;
      END IF;
  END CASE;
  
  RETURN false;
END;
$$;

-- ============ 7. RLS للجداول ============
ALTER TABLE public.archived_shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archived_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archived_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archived_driver_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archived_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archive_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archive_run_log ENABLE ROW LEVEL SECURITY;

-- سياسات للمسؤولين فقط
CREATE POLICY "Admins manage archived_shipments" ON public.archived_shipments
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage archived_notifications" ON public.archived_notifications
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage archived_activity_logs" ON public.archived_activity_logs
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage archived_driver_locations" ON public.archived_driver_locations
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage archived_chat_messages" ON public.archived_chat_messages
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage archive_settings" ON public.archive_settings
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins view archive_run_log" ON public.archive_run_log
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- توثيق
COMMENT ON FUNCTION public.run_full_archive IS 'تشغيل أرشفة شاملة لجميع الجداول';
COMMENT ON FUNCTION public.restore_from_archive IS 'استعادة سجل من الأرشيف';
COMMENT ON TABLE public.archive_settings IS 'إعدادات الأرشفة لكل جدول';