
-- Fix WhatsApp trigger to use proper Supabase env vars via net extension
CREATE OR REPLACE FUNCTION public.notify_whatsapp_on_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_phone TEXT;
  v_org_id UUID;
  v_message TEXT;
  v_supabase_url TEXT;
  v_service_key TEXT;
BEGIN
  SELECT phone, organization_id INTO v_phone, v_org_id
  FROM profiles WHERE id = NEW.user_id;

  IF v_phone IS NOT NULL AND length(v_phone) >= 10 THEN
    v_message := COALESCE(NEW.title, '') || E'\n\n' || COALESCE(NEW.message, '');
    
    -- Get Supabase URL and service key from vault or fallback
    v_supabase_url := coalesce(
      current_setting('app.settings.supabase_url', true),
      (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url' LIMIT 1),
      'https://jejwizkssmqzxwseqsre.supabase.co'
    );
    
    v_service_key := coalesce(
      current_setting('app.settings.service_role_key', true),
      (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1)
    );
    
    IF v_service_key IS NOT NULL THEN
      PERFORM net.http_post(
        url := v_supabase_url || '/functions/v1/whatsapp-send',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || v_service_key
        ),
        body := jsonb_build_object(
          'action', 'send',
          'to_phone', v_phone,
          'message_text', v_message,
          'organization_id', v_org_id,
          'notification_type', COALESCE(NEW.type, 'general')
        )
      );
    ELSE
      RAISE WARNING 'WhatsApp trigger: service_role_key not found';
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'WhatsApp notification failed: %', SQLERRM;
  RETURN NEW;
END;
$function$;
