-- Auto-trigger push notification when a new notification is inserted
-- Uses pg_net to call the send-push edge function

CREATE OR REPLACE FUNCTION public.trigger_push_on_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _supabase_url text;
  _service_key text;
  _request_id bigint;
BEGIN
  -- Get config from vault
  SELECT decrypted_secret INTO _supabase_url 
  FROM vault.decrypted_secrets 
  WHERE name = 'supabase_url' 
  LIMIT 1;
  
  SELECT decrypted_secret INTO _service_key 
  FROM vault.decrypted_secrets 
  WHERE name = 'service_role_key' 
  LIMIT 1;

  -- Only proceed if we have valid config
  IF _supabase_url IS NOT NULL AND _service_key IS NOT NULL THEN
    SELECT net.http_post(
      url := _supabase_url || '/functions/v1/send-push',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || _service_key
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
  -- Never block notification insert due to push failure
  RAISE WARNING 'Push trigger error: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Create trigger on notifications table
DROP TRIGGER IF EXISTS trg_push_on_notification ON public.notifications;
CREATE TRIGGER trg_push_on_notification
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_push_on_notification();

-- Clean up invalid/expired subscriptions
DELETE FROM public.push_subscriptions 
WHERE endpoint LIKE '%permanently-removed%' 
   OR endpoint LIKE '%invalid%'
   OR p256dh = '' 
   OR auth_key = '';