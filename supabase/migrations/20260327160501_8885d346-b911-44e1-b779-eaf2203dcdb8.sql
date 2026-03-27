
-- =============================================
-- 1. حذف التريجرات المكررة — الإبقاء على trg_dispatch_channels فقط
-- =============================================
DROP TRIGGER IF EXISTS trg_push_on_notification ON public.notifications;
DROP TRIGGER IF EXISTS trg_whatsapp_on_notification ON public.notifications;
DROP FUNCTION IF EXISTS public.trigger_push_on_notification();

-- =============================================
-- 2. حذف اشتراكات VAPID القديمة غير العاملة
-- الإبقاء فقط على اشتراكات FCM (fcm_token://)
-- =============================================
DELETE FROM public.push_subscriptions 
WHERE endpoint NOT LIKE 'fcm_token://%'
  AND auth_key != 'fcm';

-- =============================================
-- 3. تحديث دالة الإرسال لإضافة apikey header
-- =============================================
CREATE OR REPLACE FUNCTION public.dispatch_notification_to_channels()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prefs notification_channel_preferences%ROWTYPE;
  v_profile RECORD;
  v_phone TEXT;
  v_email TEXT;
  v_supabase_url TEXT;
  v_anon_key TEXT;
  v_push_payload JSONB;
  v_wa_payload JSONB;
BEGIN
  -- جلب تفضيلات المستخدم
  SELECT * INTO v_prefs
  FROM notification_channel_preferences
  WHERE user_id = NEW.user_id;

  -- جلب بيانات الملف الشخصي
  SELECT phone, email INTO v_profile
  FROM profiles
  WHERE id = NEW.user_id;

  -- إذا لا توجد تفضيلات، أنشئ تفضيلات افتراضية
  IF v_prefs IS NULL THEN
    INSERT INTO notification_channel_preferences (user_id)
    VALUES (NEW.user_id)
    ON CONFLICT (user_id) DO NOTHING
    RETURNING * INTO v_prefs;
    
    IF v_prefs IS NULL THEN
      SELECT * INTO v_prefs FROM notification_channel_preferences WHERE user_id = NEW.user_id;
    END IF;
  END IF;

  -- فحص ساعات الهدوء
  IF v_prefs.quiet_hours_enabled AND v_prefs.quiet_hours_start IS NOT NULL AND v_prefs.quiet_hours_end IS NOT NULL THEN
    IF CURRENT_TIME BETWEEN v_prefs.quiet_hours_start AND v_prefs.quiet_hours_end THEN
      INSERT INTO notification_dispatch_log (notification_id, user_id, channel, status)
      VALUES (NEW.id, NEW.user_id, 'in_app', 'sent');
      RETURN NEW;
    END IF;
  END IF;

  -- 1) In-App (دائماً)
  INSERT INTO notification_dispatch_log (notification_id, user_id, channel, status)
  VALUES (NEW.id, NEW.user_id, 'in_app', 'sent');

  -- جلب URL و Anon Key
  SELECT value INTO v_supabase_url FROM app_config WHERE key = 'supabase_url';
  SELECT value INTO v_anon_key FROM app_config WHERE key = 'supabase_anon_key';
  
  -- fallback
  IF v_anon_key IS NULL THEN
    SELECT value INTO v_anon_key FROM app_config WHERE key = 'anon_key';
  END IF;

  -- 2) Push Notification
  IF v_prefs.push_enabled AND v_supabase_url IS NOT NULL AND v_anon_key IS NOT NULL THEN
    BEGIN
      v_push_payload := jsonb_build_object(
        'user_id', NEW.user_id::text,
        'title', COALESCE(NEW.title, 'إشعار جديد'),
        'body', COALESCE(NEW.message, ''),
        'tag', 'notif-' || COALESCE(NEW.type, 'general') || '-' || NEW.id::text,
        'data', jsonb_build_object(
          'notification_id', NEW.id::text,
          'type', COALESCE(NEW.type, 'info')
        )
      );
      
      PERFORM net.http_post(
        url := v_supabase_url || '/functions/v1/send-push',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || v_anon_key,
          'apikey', v_anon_key
        ),
        body := v_push_payload
      );
      
      INSERT INTO notification_dispatch_log (notification_id, user_id, channel, status)
      VALUES (NEW.id, NEW.user_id, 'push', 'sent');
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO notification_dispatch_log (notification_id, user_id, channel, status, error_message)
      VALUES (NEW.id, NEW.user_id, 'push', 'failed', SQLERRM);
    END;
  END IF;

  -- 3) WhatsApp via WaPilot
  IF v_prefs.whatsapp_enabled AND v_supabase_url IS NOT NULL AND v_anon_key IS NOT NULL THEN
    v_phone := COALESCE(v_prefs.whatsapp_phone, v_profile.phone);
    IF v_phone IS NOT NULL AND v_phone != '' THEN
      BEGIN
        v_wa_payload := jsonb_build_object(
          'action', 'send-message',
          'params', jsonb_build_object(
            'chat_id', v_phone,
            'message', '🔔 *' || COALESCE(NEW.title, '') || '*' || E'\n' || COALESCE(NEW.message, '')
          )
        );
        
        PERFORM net.http_post(
          url := v_supabase_url || '/functions/v1/wapilot-proxy',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || v_anon_key,
            'apikey', v_anon_key
          ),
          body := v_wa_payload
        );
        
        INSERT INTO notification_dispatch_log (notification_id, user_id, channel, status)
        VALUES (NEW.id, NEW.user_id, 'whatsapp', 'sent');
      EXCEPTION WHEN OTHERS THEN
        INSERT INTO notification_dispatch_log (notification_id, user_id, channel, status, error_message)
        VALUES (NEW.id, NEW.user_id, 'whatsapp', 'failed', SQLERRM);
      END;
    ELSE
      INSERT INTO notification_dispatch_log (notification_id, user_id, channel, status, error_message)
      VALUES (NEW.id, NEW.user_id, 'whatsapp', 'skipped', 'No phone number configured');
    END IF;
  END IF;

  -- 4) Email
  IF v_prefs.email_enabled AND v_supabase_url IS NOT NULL AND v_anon_key IS NOT NULL THEN
    v_email := COALESCE(v_prefs.notification_email, v_profile.email);
    IF v_email IS NOT NULL AND v_email != '' THEN
      BEGIN
        PERFORM net.http_post(
          url := v_supabase_url || '/functions/v1/send-notification-email',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || v_anon_key,
            'apikey', v_anon_key
          ),
          body := jsonb_build_object(
            'to', v_email,
            'subject', COALESCE(NEW.title, 'إشعار'),
            'body', COALESCE(NEW.message, ''),
            'type', COALESCE(NEW.type, 'info')
          )
        );
        
        INSERT INTO notification_dispatch_log (notification_id, user_id, channel, status)
        VALUES (NEW.id, NEW.user_id, 'email', 'sent');
      EXCEPTION WHEN OTHERS THEN
        INSERT INTO notification_dispatch_log (notification_id, user_id, channel, status, error_message)
        VALUES (NEW.id, NEW.user_id, 'email', 'failed', SQLERRM);
      END;
    END IF;
  END IF;

  -- 5) SMS
  IF v_prefs.sms_enabled AND v_supabase_url IS NOT NULL AND v_anon_key IS NOT NULL THEN
    v_phone := COALESCE(v_prefs.sms_phone, v_profile.phone);
    IF v_phone IS NOT NULL AND v_phone != '' THEN
      BEGIN
        PERFORM net.http_post(
          url := v_supabase_url || '/functions/v1/send-notification',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || v_anon_key,
            'apikey', v_anon_key
          ),
          body := jsonb_build_object(
            'channel', 'sms',
            'to', v_phone,
            'message', COALESCE(NEW.title, '') || ': ' || COALESCE(NEW.message, '')
          )
        );
        
        INSERT INTO notification_dispatch_log (notification_id, user_id, channel, status)
        VALUES (NEW.id, NEW.user_id, 'sms', 'sent');
      EXCEPTION WHEN OTHERS THEN
        INSERT INTO notification_dispatch_log (notification_id, user_id, channel, status, error_message)
        VALUES (NEW.id, NEW.user_id, 'sms', 'failed', SQLERRM);
      END;
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Dispatch notification error: %', SQLERRM;
  RETURN NEW;
END;
$$;
