
-- Update the trigger function to use the public project URL and anon key
-- The anon key is a publishable key, safe to use in code
CREATE OR REPLACE FUNCTION public.auto_notify_channels()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _skip_channels BOOLEAN;
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
    'message_text', COALESCE(NEW.title, '') || E'\n\n' || COALESCE(NEW.message, ''),
    'organization_id', COALESCE(NEW.organization_id::text, ''),
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
