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
  v_url TEXT;
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

  -- ═══ حساب URL التوجيه بناءً على نوع الإشعار ═══
  v_url := CASE
    WHEN NEW.type IN ('shipment_created','shipment_status','status_update','shipment_assigned','shipment_delivered','shipment_approved','shipment','driver_assignment') THEN
      CASE WHEN NEW.shipment_id IS NOT NULL THEN '/dashboard/shipments/' || NEW.shipment_id::text ELSE '/dashboard/shipments' END
    WHEN NEW.type IN ('signing_request','signature_request') THEN '/dashboard/signing-inbox'
    WHEN NEW.type IN ('document_uploaded','document_issued','document_signed','stamp_applied') THEN '/dashboard/document-center'
    WHEN NEW.type IN ('approval_request') THEN '/dashboard/my-requests'
    WHEN NEW.type IN ('chat_message','message','mention','partner_message') THEN '/dashboard/chat'
    WHEN NEW.type IN ('broadcast') THEN '/dashboard/broadcast-channels'
    WHEN NEW.type IN ('partner_post','partner_linked') THEN '/dashboard/partners'
    WHEN NEW.type IN ('partner_note') THEN '/dashboard/notes'
    WHEN NEW.type IN ('invoice','payment','deposit','financial') THEN '/dashboard/erp/accounting'
    WHEN NEW.type IN ('recycling_report','report','certificate') THEN
      CASE WHEN NEW.shipment_id IS NOT NULL THEN '/dashboard/shipments/' || NEW.shipment_id::text ELSE '/dashboard/reports' END
    WHEN NEW.type IN ('license_expiry','license_warning','identity_verified','kyc_update') THEN '/dashboard/organization-profile'
    WHEN NEW.type IN ('compliance_alert','compliance_update','inspection','violation') THEN '/dashboard/compliance'
    WHEN NEW.type IN ('fleet_alert','maintenance') THEN '/dashboard/fleet'
    WHEN NEW.type IN ('geofence_alert','gps_alert') THEN '/dashboard/fleet-tracking'
    WHEN NEW.type IN ('work_order','work_order_update') THEN '/dashboard/work-orders'
    WHEN NEW.type IN ('carbon_report','environmental') THEN '/dashboard/carbon-footprint'
    WHEN NEW.type IN ('ai_alert','ai_insight') THEN '/dashboard/ai-tools'
    WHEN NEW.type IN ('announcement') THEN '/dashboard/news-feed'
    WHEN NEW.type IN ('warning','signal_lost') THEN
      CASE WHEN NEW.shipment_id IS NOT NULL THEN '/dashboard/shipments/' || NEW.shipment_id::text ELSE '/dashboard/notifications' END
    ELSE '/dashboard/notifications'
  END;

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
          'type', COALESCE(NEW.type, 'info'),
          'url', v_url
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
      VALUES (NEW.id, NEW.user_id, 'whatsapp', 'skipped', 'no_phone');
    END IF;
  END IF;

  RETURN NEW;
END;
$$;