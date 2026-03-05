
-- =============================================
-- SECURITY HARDENING MIGRATION
-- =============================================

-- 1. qr_scan_logs - validated INSERT
DROP POLICY IF EXISTS "Allow public inserts to qr_scan_logs" ON public.qr_scan_logs;
DROP POLICY IF EXISTS "Allow validated inserts to qr_scan_logs" ON public.qr_scan_logs;
CREATE POLICY "Validated qr scan logging" ON public.qr_scan_logs
  FOR INSERT TO public
  WITH CHECK (
    scan_type IS NOT NULL 
    AND length(scan_type) < 100
  );

-- 2. safety_link_access_log - validated INSERT
DROP POLICY IF EXISTS "Anyone can log access" ON public.safety_link_access_log;
DROP POLICY IF EXISTS "Validated access logging" ON public.safety_link_access_log;
CREATE POLICY "Validated safety access logging" ON public.safety_link_access_log
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    link_id IS NOT NULL
  );

-- 3. shared_link_views - validated INSERT
DROP POLICY IF EXISTS "Anyone can insert views" ON public.shared_link_views;
DROP POLICY IF EXISTS "Validated shared link views" ON public.shared_link_views;
CREATE POLICY "Validated shared link view logging" ON public.shared_link_views
  FOR INSERT TO public
  WITH CHECK (
    shared_link_id IS NOT NULL
  );

-- 4. testimonials - validated INSERT with field checks
DROP POLICY IF EXISTS "Anyone can submit testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Validated testimonial submissions" ON public.testimonials;
CREATE POLICY "Validated testimonial submissions" ON public.testimonials
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    comment IS NOT NULL 
    AND length(comment) BETWEEN 10 AND 2000
    AND author_name IS NOT NULL
    AND length(author_name) BETWEEN 2 AND 200
    AND status = 'pending'
  );

-- 5. whatsapp_message_interactions - validated INSERT
DROP POLICY IF EXISTS "Service can insert interactions" ON public.whatsapp_message_interactions;
DROP POLICY IF EXISTS "Authenticated users insert own interactions" ON public.whatsapp_message_interactions;
CREATE POLICY "Validated whatsapp interaction logging" ON public.whatsapp_message_interactions
  FOR INSERT TO authenticated
  WITH CHECK (
    message_id IS NOT NULL
    AND interaction_type IS NOT NULL
    AND length(interaction_type) < 100
  );

-- =============================================
-- FIX 2: Fix function missing search_path
-- =============================================
CREATE OR REPLACE FUNCTION public.notify_whatsapp_on_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone TEXT;
  v_org_id UUID;
  v_message TEXT;
BEGIN
  SELECT phone, organization_id INTO v_phone, v_org_id
  FROM profiles WHERE id = NEW.user_id;

  IF v_phone IS NOT NULL AND length(v_phone) >= 10 THEN
    v_message := COALESCE(NEW.title, '') || E'\n\n' || COALESCE(NEW.message, '');
    
    PERFORM net.http_post(
      url := current_setting('app.settings.supabase_url', true) || '/functions/v1/whatsapp-send',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'action', 'send',
        'to_phone', v_phone,
        'message_text', v_message,
        'organization_id', v_org_id,
        'notification_type', COALESCE(NEW.type, 'general')
      )
    );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'WhatsApp notification failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- =============================================
-- FIX 3: Rate limiting infrastructure
-- =============================================
CREATE TABLE IF NOT EXISTS public.rate_limit_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_lookup ON rate_limit_entries(identifier, endpoint, window_start);

ALTER TABLE public.rate_limit_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages rate limits" ON public.rate_limit_entries
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.cleanup_rate_limit_entries()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM rate_limit_entries WHERE window_start < now() - interval '1 hour';
$$;

-- =============================================
-- FIX 4: Security events logging
-- =============================================
CREATE TABLE IF NOT EXISTS public.security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  user_id UUID,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB DEFAULT '{}',
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_security_events_lookup ON security_events(event_type, severity, created_at DESC);

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view security events" ON public.security_events
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System inserts security events" ON public.security_events
  FOR INSERT TO service_role
  WITH CHECK (true);

-- =============================================
-- FIX 5: Rate limit check function
-- =============================================
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier TEXT,
  p_endpoint TEXT,
  p_max_requests INTEGER DEFAULT 60,
  p_window_seconds INTEGER DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_window_start TIMESTAMPTZ;
BEGIN
  v_window_start := now() - (p_window_seconds || ' seconds')::interval;
  
  SELECT COUNT(*) INTO v_count
  FROM rate_limit_entries
  WHERE identifier = p_identifier
    AND endpoint = p_endpoint
    AND window_start >= v_window_start;

  IF v_count >= p_max_requests THEN
    INSERT INTO security_events (event_type, severity, details)
    VALUES ('rate_limit_exceeded', 'warning', jsonb_build_object(
      'identifier', p_identifier,
      'endpoint', p_endpoint,
      'count', v_count,
      'max', p_max_requests
    ));
    RETURN FALSE;
  END IF;

  INSERT INTO rate_limit_entries (identifier, endpoint, window_start)
  VALUES (p_identifier, p_endpoint, now());

  RETURN TRUE;
END;
$$;
