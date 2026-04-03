
-- 1. Create user_presence table
CREATE TABLE public.user_presence (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'away', 'offline')),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- Users can read/write their own presence
CREATE POLICY "Users manage own presence"
ON public.user_presence FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Allow reading others' presence (for typing indicators etc)
CREATE POLICY "Users can read all presence"
ON public.user_presence FOR SELECT TO authenticated
USING (true);

-- 2. Update the trg_auto_notify_channels trigger to check presence
CREATE OR REPLACE FUNCTION public.fn_auto_notify_channels()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _skip_channels BOOLEAN;
  _user_status TEXT;
  _base_url TEXT := 'https://dgununqfxohodimmgxuk.supabase.co';
  _anon_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRndW51bnFmeG9ob2RpbW1neHVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5Mzc4MDMsImV4cCI6MjA4OTUxMzgwM30.sGJm0IxrxHN_LV54s2M7xvgm7iQ1SK9KycR3jBu02Ug';
  _push_payload JSONB;
  _wa_payload JSONB;
BEGIN
  -- Check if auto-channel dispatch should be skipped
  _skip_channels := COALESCE((NEW.metadata->>'skip_auto_channels')::boolean, false);
  IF _skip_channels THEN
    RETURN NEW;
  END IF;

  -- Check user presence status
  SELECT status INTO _user_status
  FROM public.user_presence
  WHERE user_id = NEW.user_id;

  -- If user is ONLINE → skip push & whatsapp (in-app is enough)
  IF _user_status = 'online' THEN
    RETURN NEW;
  END IF;

  -- User is 'away' or 'offline' or no record → send push + whatsapp

  -- 1. Send Push Notification via send-push edge function
  _push_payload := jsonb_build_object(
    'user_id', NEW.user_id::text,
    'title', COALESCE(NEW.title, 'إشعار جديد'),
    'body', COALESCE(NEW.message, ''),
    'tag', 'auto-' || COALESCE(NEW.type, 'general') || '-' || extract(epoch from now())::bigint,
    'data', jsonb_build_object(
      'url', COALESCE(NEW.metadata->>'url', '/'),
      'type', COALESCE(NEW.type, 'general'),
      'reference_id', COALESCE(NEW.resource_id::text, NEW.shipment_id::text, ''),
      'notification_id', NEW.id::text
    )
  );

  PERFORM net.http_post(
    url := _base_url || '/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _anon_key
    ),
    body := _push_payload
  );

  -- 2. Send WhatsApp via whatsapp-send edge function
  _wa_payload := jsonb_build_object(
    'action', 'send_to_user',
    'user_id', NEW.user_id::text,
    'message', COALESCE(NEW.title, '') || E'\n' || COALESCE(NEW.message, ''),
    'notification_type', COALESCE(NEW.type, 'general')
  );

  PERFORM net.http_post(
    url := _base_url || '/functions/v1/whatsapp-send',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _anon_key
    ),
    body := _wa_payload
  );

  RETURN NEW;
END;
$$;
