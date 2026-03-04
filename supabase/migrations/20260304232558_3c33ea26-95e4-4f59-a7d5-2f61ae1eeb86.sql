-- Create a function that sends WhatsApp via pg_net when a notification is inserted
CREATE OR REPLACE FUNCTION public.notify_whatsapp_on_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _phone text;
  _supabase_url text;
  _service_key text;
  _payload jsonb;
BEGIN
  SELECT phone INTO _phone FROM profiles WHERE id = NEW.user_id;
  
  IF _phone IS NULL OR _phone = '' THEN
    RETURN NEW;
  END IF;

  _payload := jsonb_build_object(
    'action', 'send_to_user',
    'user_id', NEW.user_id,
    'message_text', COALESCE(NEW.title, '') || E'\n\n' || COALESCE(NEW.message, ''),
    'notification_type', COALESCE(NEW.type, 'general'),
    'notification_id', NEW.id
  );

  _supabase_url := 'https://jejwizkssmqzxwseqsre.supabase.co';

  BEGIN
    SELECT decrypted_secret INTO _service_key
    FROM vault.decrypted_secrets
    WHERE name = 'service_role_key'
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    _service_key := NULL;
  END;

  IF _service_key IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := _supabase_url || '/functions/v1/whatsapp-send',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _service_key
    ),
    body := _payload
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'WhatsApp trigger error: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_whatsapp_on_notification ON notifications;
CREATE TRIGGER trg_whatsapp_on_notification
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION notify_whatsapp_on_notification();