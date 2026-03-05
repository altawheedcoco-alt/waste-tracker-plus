CREATE OR REPLACE FUNCTION notify_whatsapp_on_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _phone text;
  _supabase_url text;
  _anon_key text;
  _payload jsonb;
BEGIN
  -- Skip shipment_status notifications: handled directly by StatusChangeDialog with rich data + buttons
  IF NEW.type = 'shipment_status' THEN
    RETURN NEW;
  END IF;

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
  _anon_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Implandpemtzc21xenh3c2Vxc3JlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MDI2MTcsImV4cCI6MjA4NTM3ODYxN30.cuO0gX41P_QIdCrdj4-yw8q8otcr-hUPDySuoXNiUPY';

  PERFORM net.http_post(
    url := _supabase_url || '/functions/v1/whatsapp-send',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _anon_key,
      'apikey', _anon_key
    ),
    body := _payload
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'WhatsApp trigger error: %', SQLERRM;
  RETURN NEW;
END;
$$;