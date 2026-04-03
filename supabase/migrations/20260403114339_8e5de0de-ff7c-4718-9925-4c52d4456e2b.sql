
-- Trigger function: auto-send push + whatsapp on every notification INSERT
CREATE OR REPLACE FUNCTION public.auto_notify_channels()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _supabase_url TEXT;
  _service_key TEXT;
  _skip_channels BOOLEAN;
  _user_phone TEXT;
  _push_payload JSONB;
  _wa_payload JSONB;
BEGIN
  -- Check if auto-channel dispatch should be skipped (already sent by unifiedNotifier)
  _skip_channels := COALESCE((NEW.metadata->>'skip_auto_channels')::boolean, false);
  IF _skip_channels THEN
    RETURN NEW;
  END IF;

  -- Get Supabase config
  _supabase_url := current_setting('app.settings.supabase_url', true);
  _service_key := current_setting('app.settings.service_role_key', true);

  -- Fallback to vault secrets if app settings not available
  IF _supabase_url IS NULL OR _supabase_url = '' THEN
    SELECT decrypted_secret INTO _supabase_url
    FROM vault.decrypted_secrets
    WHERE name = 'supabase_url'
    LIMIT 1;
  END IF;

  IF _service_key IS NULL OR _service_key = '' THEN
    SELECT decrypted_secret INTO _service_key
    FROM vault.decrypted_secrets
    WHERE name = 'service_role_key'
    LIMIT 1;
  END IF;

  -- If we still don't have config, skip silently
  IF _supabase_url IS NULL OR _service_key IS NULL THEN
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
    url := _supabase_url || '/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _service_key
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
    url := _supabase_url || '/functions/v1/whatsapp-send',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _service_key
    ),
    body := _wa_payload
  );

  RETURN NEW;
END;
$$;

-- Create trigger (drop if exists to avoid duplicates)
DROP TRIGGER IF EXISTS trg_auto_notify_channels ON public.notifications;

CREATE TRIGGER trg_auto_notify_channels
AFTER INSERT ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.auto_notify_channels();
