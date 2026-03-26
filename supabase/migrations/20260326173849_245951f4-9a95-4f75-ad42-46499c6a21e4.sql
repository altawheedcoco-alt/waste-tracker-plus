
-- =============================================
-- 1. جدول تفضيلات قنوات الإشعارات لكل مستخدم
-- =============================================
CREATE TABLE public.notification_channel_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  -- القنوات المتاحة
  in_app_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  whatsapp_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT false,
  sms_enabled BOOLEAN DEFAULT false,
  -- هاتف واتساب (يؤخذ من profiles.phone إذا فارغ)
  whatsapp_phone TEXT,
  -- بريد الإشعارات (يؤخذ من profiles.email إذا فارغ)
  notification_email TEXT,
  -- هاتف SMS (يؤخذ من profiles.phone إذا فارغ)
  sms_phone TEXT,
  -- إعدادات متقدمة
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  quiet_hours_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.notification_channel_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own preferences"
  ON public.notification_channel_preferences
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =============================================
-- 2. جدول سجل إرسال القنوات المتعددة (للتتبع)
-- =============================================
CREATE TABLE public.notification_dispatch_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL,
  user_id UUID NOT NULL,
  channel TEXT NOT NULL, -- 'in_app', 'push', 'whatsapp', 'email', 'sms'
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'skipped'
  error_message TEXT,
  dispatched_at TIMESTAMPTZ DEFAULT now(),
  delivered_at TIMESTAMPTZ
);

ALTER TABLE public.notification_dispatch_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own dispatch logs"
  ON public.notification_dispatch_log
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all dispatch logs"
  ON public.notification_dispatch_log
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Index for performance
CREATE INDEX idx_dispatch_log_notification ON public.notification_dispatch_log(notification_id);
CREATE INDEX idx_dispatch_log_user ON public.notification_dispatch_log(user_id);
CREATE INDEX idx_dispatch_log_channel ON public.notification_dispatch_log(channel, status);

-- =============================================
-- 3. دالة الإرسال متعدد القنوات - تطلق بعد كل إدخال إشعار
-- =============================================
CREATE OR REPLACE FUNCTION public.dispatch_notification_to_channels()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prefs RECORD;
  v_profile RECORD;
  v_phone TEXT;
  v_email TEXT;
  v_supabase_url TEXT;
  v_service_key TEXT;
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
      -- في ساعات الهدوء: in-app فقط
      INSERT INTO notification_dispatch_log (notification_id, user_id, channel, status)
      VALUES (NEW.id, NEW.user_id, 'in_app', 'sent');
      RETURN NEW;
    END IF;
  END IF;

  -- 1) In-App (دائماً مفعل - الإشعار موجود بالفعل في جدول notifications)
  INSERT INTO notification_dispatch_log (notification_id, user_id, channel, status)
  VALUES (NEW.id, NEW.user_id, 'in_app', 'sent');

  -- جلب URL و Service Key
  v_supabase_url := current_setting('app.settings.supabase_url', true);
  v_service_key := current_setting('app.settings.service_role_key', true);

  -- 2) Push Notification
  IF v_prefs.push_enabled THEN
    BEGIN
      v_push_payload := jsonb_build_object(
        'user_id', NEW.user_id::text,
        'title', NEW.title,
        'body', NEW.message,
        'data', jsonb_build_object(
          'notification_id', NEW.id::text,
          'type', COALESCE(NEW.type, 'info')
        )
      );
      
      PERFORM net.http_post(
        url := (SELECT value FROM app_config WHERE key = 'supabase_url') || '/functions/v1/send-push',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (SELECT value FROM app_config WHERE key = 'anon_key')
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
  IF v_prefs.whatsapp_enabled THEN
    v_phone := COALESCE(v_prefs.whatsapp_phone, v_profile.phone);
    IF v_phone IS NOT NULL AND v_phone != '' THEN
      BEGIN
        v_wa_payload := jsonb_build_object(
          'action', 'send-message',
          'params', jsonb_build_object(
            'chat_id', v_phone,
            'message', '🔔 *' || NEW.title || '*' || E'\n' || NEW.message
          )
        );
        
        PERFORM net.http_post(
          url := (SELECT value FROM app_config WHERE key = 'supabase_url') || '/functions/v1/wapilot-proxy',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (SELECT value FROM app_config WHERE key = 'anon_key')
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
  IF v_prefs.email_enabled THEN
    v_email := COALESCE(v_prefs.notification_email, v_profile.email);
    IF v_email IS NOT NULL AND v_email != '' THEN
      BEGIN
        PERFORM net.http_post(
          url := (SELECT value FROM app_config WHERE key = 'supabase_url') || '/functions/v1/send-notification-email',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (SELECT value FROM app_config WHERE key = 'anon_key')
          ),
          body := jsonb_build_object(
            'to', v_email,
            'subject', NEW.title,
            'body', NEW.message,
            'type', COALESCE(NEW.type, 'info')
          )
        );
        
        INSERT INTO notification_dispatch_log (notification_id, user_id, channel, status)
        VALUES (NEW.id, NEW.user_id, 'email', 'sent');
      EXCEPTION WHEN OTHERS THEN
        INSERT INTO notification_dispatch_log (notification_id, user_id, channel, status, error_message)
        VALUES (NEW.id, NEW.user_id, 'email', 'failed', SQLERRM);
      END;
    ELSE
      INSERT INTO notification_dispatch_log (notification_id, user_id, channel, status, error_message)
      VALUES (NEW.id, NEW.user_id, 'email', 'skipped', 'No email configured');
    END IF;
  END IF;

  -- 5) SMS via Twilio (مُعد للمستقبل)
  IF v_prefs.sms_enabled THEN
    v_phone := COALESCE(v_prefs.sms_phone, v_profile.phone);
    IF v_phone IS NOT NULL AND v_phone != '' THEN
      BEGIN
        PERFORM net.http_post(
          url := (SELECT value FROM app_config WHERE key = 'supabase_url') || '/functions/v1/send-sms',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (SELECT value FROM app_config WHERE key = 'anon_key')
          ),
          body := jsonb_build_object(
            'to', v_phone,
            'message', NEW.title || ': ' || NEW.message
          )
        );
        
        INSERT INTO notification_dispatch_log (notification_id, user_id, channel, status)
        VALUES (NEW.id, NEW.user_id, 'sms', 'sent');
      EXCEPTION WHEN OTHERS THEN
        INSERT INTO notification_dispatch_log (notification_id, user_id, channel, status, error_message)
        VALUES (NEW.id, NEW.user_id, 'sms', 'failed', SQLERRM);
      END;
    ELSE
      INSERT INTO notification_dispatch_log (notification_id, user_id, channel, status, error_message)
      VALUES (NEW.id, NEW.user_id, 'sms', 'skipped', 'No phone number configured');
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- =============================================
-- 4. المشغل: يطلق على كل إدخال في جدول الإشعارات
-- =============================================
DROP TRIGGER IF EXISTS trg_dispatch_channels ON public.notifications;
CREATE TRIGGER trg_dispatch_channels
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.dispatch_notification_to_channels();
