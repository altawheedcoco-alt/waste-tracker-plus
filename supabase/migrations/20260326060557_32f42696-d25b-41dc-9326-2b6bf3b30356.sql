
-- Drop the broken trigger that hardcodes the test URL
DROP TRIGGER IF EXISTS trg_push_on_notification ON public.notifications;
DROP FUNCTION IF EXISTS public.trigger_push_on_notification();

-- Create app_config table to store environment-specific settings
CREATE TABLE IF NOT EXISTS public.app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert the Supabase project URL (same ref for both environments in Lovable Cloud)
INSERT INTO public.app_config (key, value) 
VALUES ('supabase_url', 'https://dgununqfxohodimmgxuk.supabase.co')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- Insert the anon key (publishable, safe to store)
INSERT INTO public.app_config (key, value) 
VALUES ('supabase_anon_key', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRndW51bnFmeG9ob2RpbW1neHVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5Mzc4MDMsImV4cCI6MjA4OTUxMzgwM30.sGJm0IxrxHN_LV54s2M7xvgm7iQ1SK9KycR3jBu02Ug')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- Recreate the trigger function reading from config table
CREATE OR REPLACE FUNCTION public.trigger_push_on_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _supabase_url text;
  _anon_key text;
  _request_id bigint;
BEGIN
  -- Read URL from config table
  SELECT value INTO _supabase_url FROM public.app_config WHERE key = 'supabase_url';
  SELECT value INTO _anon_key FROM public.app_config WHERE key = 'supabase_anon_key';

  IF _supabase_url IS NOT NULL AND _anon_key IS NOT NULL THEN
    SELECT net.http_post(
      url := _supabase_url || '/functions/v1/send-push',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || _anon_key,
        'apikey', _anon_key
      ),
      body := jsonb_build_object(
        'user_id', NEW.user_id,
        'title', COALESCE(NEW.title, 'إشعار جديد'),
        'body', COALESCE(NEW.message, ''),
        'tag', 'notif-' || COALESCE(NEW.type, 'general') || '-' || extract(epoch from now())::text
      )
    ) INTO _request_id;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Push trigger error: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER trg_push_on_notification
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_push_on_notification();

-- Clean up invalid subscriptions
DELETE FROM public.push_subscriptions 
WHERE endpoint LIKE '%permanently-removed%' 
   OR endpoint LIKE '%invalid%'
   OR p256dh = '' 
   OR auth_key = '';

-- RLS for app_config (read-only for authenticated, no public write)
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read app_config"
  ON public.app_config FOR SELECT
  USING (true);
