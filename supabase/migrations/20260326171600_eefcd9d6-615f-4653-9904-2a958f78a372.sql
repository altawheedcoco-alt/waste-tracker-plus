
-- ============================================================
-- إشعارات مدير النظام (Admin / Sovereign)
-- ============================================================

-- Helper: get all sovereign admin user_ids
CREATE OR REPLACE FUNCTION public.get_sovereign_admin_ids()
RETURNS SETOF UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT DISTINCT user_id FROM public.admin_sovereign_roles
  WHERE is_active = true;
$$;

-- 1) تغيير أدوار سيادية (admin_sovereign_roles)
CREATE OR REPLACE FUNCTION public.notify_sovereign_role_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications(user_id,title,message,type,priority,metadata)
      VALUES(NEW.user_id, '👑 تم تعيينك كمسؤول سيادي',
        'تم منحك دور: ' || NEW.role::text,
        'sovereign_role_granted', 'urgent',
        jsonb_build_object('role', NEW.role::text, 'granted_by', NEW.granted_by));
    INSERT INTO public.notifications(user_id,title,message,type,priority,metadata)
      SELECT uid, '👑 تعيين مسؤول سيادي جديد',
        'تم تعيين مسؤول بدور: ' || NEW.role::text,
        'sovereign_role_granted', 'high',
        jsonb_build_object('target_user', NEW.user_id, 'role', NEW.role::text)
      FROM public.get_sovereign_admin_ids() uid
      WHERE uid IS DISTINCT FROM NEW.user_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.is_active IS DISTINCT FROM NEW.is_active AND NEW.is_active = false THEN
    INSERT INTO public.notifications(user_id,title,message,type,priority,metadata)
      VALUES(NEW.user_id, '🚫 تم إلغاء صلاحيتك السيادية',
        'تم تعليق دورك: ' || NEW.role::text,
        'sovereign_role_revoked', 'urgent',
        jsonb_build_object('role', NEW.role::text));
    INSERT INTO public.notifications(user_id,title,message,type,priority,metadata)
      SELECT uid, '🚫 إلغاء صلاحية سيادية',
        'تم تعليق دور مسؤول: ' || NEW.role::text,
        'sovereign_role_revoked', 'high',
        jsonb_build_object('target_user', NEW.user_id, 'role', NEW.role::text)
      FROM public.get_sovereign_admin_ids() uid
      WHERE uid IS DISTINCT FROM NEW.user_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;$$;
DROP TRIGGER IF EXISTS trg_notify_sovereign_role ON public.admin_sovereign_roles;
CREATE TRIGGER trg_notify_sovereign_role AFTER INSERT OR UPDATE ON public.admin_sovereign_roles
  FOR EACH ROW EXECUTE FUNCTION public.notify_sovereign_role_change();

-- 2) قرارات AI السيادية
CREATE OR REPLACE FUNCTION public.notify_sovereign_decision()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications(user_id,title,message,type,priority,metadata)
      SELECT uid, '🧠 قرار AI سيادي جديد',
        COALESCE(NEW.title, '') || ' - مستوى الخطر: ' || COALESCE(NEW.risk_level, 'غير محدد'),
        'sovereign_decision',
        CASE NEW.risk_level WHEN 'critical' THEN 'urgent' WHEN 'high' THEN 'high' ELSE 'normal' END,
        jsonb_build_object('decision_id', NEW.id, 'type', NEW.decision_type, 'risk', NEW.risk_level)
      FROM public.get_sovereign_admin_ids() uid;
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.notifications(user_id,title,message,type,metadata)
      SELECT uid, '🧠 تحديث قرار سيادي',
        COALESCE(NEW.title, '') || ' → ' || NEW.status,
        'sovereign_decision_update',
        jsonb_build_object('decision_id', NEW.id, 'status', NEW.status)
      FROM public.get_sovereign_admin_ids() uid;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;$$;
DROP TRIGGER IF EXISTS trg_notify_sovereign_decision ON public.ai_sovereign_decisions;
CREATE TRIGGER trg_notify_sovereign_decision AFTER INSERT OR UPDATE ON public.ai_sovereign_decisions
  FOR EACH ROW EXECUTE FUNCTION public.notify_sovereign_decision();

-- 3) نشاط حساس (activity_logs)
CREATE OR REPLACE FUNCTION public.notify_critical_activity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.action_type IN ('delete','role_change','permission_change','security_breach','data_export','bulk_action','impersonation') THEN
    INSERT INTO public.notifications(user_id,title,message,type,priority,metadata)
      SELECT uid, '🔍 نشاط حساس مسجّل',
        NEW.action_type || ': ' || COALESCE(NEW.action, ''),
        'critical_activity', 'high',
        jsonb_build_object('activity_id', NEW.id, 'action_type', NEW.action_type,
          'resource_type', NEW.resource_type, 'user_id', NEW.user_id)
      FROM public.get_sovereign_admin_ids() uid;
  END IF;
  RETURN NEW;
END;$$;
DROP TRIGGER IF EXISTS trg_notify_critical_activity ON public.activity_logs;
CREATE TRIGGER trg_notify_critical_activity AFTER INSERT ON public.activity_logs
  FOR EACH ROW EXECUTE FUNCTION public.notify_critical_activity();

-- 4) تغيير إعدادات المنصة
CREATE OR REPLACE FUNCTION public.notify_platform_settings()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications(user_id,title,message,type,priority,metadata)
    SELECT uid, '⚙️ تعديل إعدادات المنصة',
      'تم تعديل إعداد: ' || COALESCE(NEW.setting_key, NEW.id::text),
      'platform_settings_changed', 'high',
      jsonb_build_object('setting_id', NEW.id)
    FROM public.get_sovereign_admin_ids() uid;
  RETURN COALESCE(NEW, OLD);
END;$$;
DROP TRIGGER IF EXISTS trg_notify_platform_settings ON public.platform_settings;
CREATE TRIGGER trg_notify_platform_settings AFTER UPDATE ON public.platform_settings
  FOR EACH ROW EXECUTE FUNCTION public.notify_platform_settings();

-- 5) أدوار المستخدمين
CREATE OR REPLACE FUNCTION public.notify_user_role_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications(user_id,title,message,type,priority,metadata)
      VALUES(NEW.user_id, '🔑 تم تعيين دور جديد لك',
        'تم منحك دور: ' || NEW.role::text,
        'role_assigned', 'high',
        jsonb_build_object('role', NEW.role::text));
    INSERT INTO public.notifications(user_id,title,message,type,priority,metadata)
      SELECT uid, '🔑 تعيين دور مستخدم',
        'تم تعيين دور ' || NEW.role::text || ' لمستخدم',
        'role_assigned_admin', 'normal',
        jsonb_build_object('target_user', NEW.user_id, 'role', NEW.role::text)
      FROM public.get_sovereign_admin_ids() uid
      WHERE uid IS DISTINCT FROM NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.notifications(user_id,title,message,type,priority,metadata)
      VALUES(OLD.user_id, '🔑 تم إزالة دور',
        'تم إزالة دور: ' || OLD.role::text,
        'role_removed', 'high',
        jsonb_build_object('role', OLD.role::text));
    INSERT INTO public.notifications(user_id,title,message,type,priority,metadata)
      SELECT uid, '🔑 إزالة دور مستخدم',
        'تم إزالة دور ' || OLD.role::text || ' من مستخدم',
        'role_removed_admin', 'normal',
        jsonb_build_object('target_user', OLD.user_id, 'role', OLD.role::text)
      FROM public.get_sovereign_admin_ids() uid;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;$$;
DROP TRIGGER IF EXISTS trg_notify_user_role ON public.user_roles;
CREATE TRIGGER trg_notify_user_role AFTER INSERT OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.notify_user_role_change();

-- 6) حملات Push
CREATE OR REPLACE FUNCTION public.notify_push_campaign()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status IN ('completed','failed','partially_failed') THEN
      INSERT INTO public.notifications(user_id,title,message,type,priority,metadata)
        SELECT uid,
          CASE NEW.status
            WHEN 'completed' THEN '✅ اكتملت حملة الإشعارات'
            WHEN 'failed' THEN '❌ فشلت حملة الإشعارات'
            ELSE '⚠️ اكتملت جزئياً'
          END,
          COALESCE(NEW.title, 'حملة') || ' - ' || COALESCE(NEW.sent_count::text, '0') || ' مرسل',
          'campaign_' || NEW.status,
          CASE NEW.status WHEN 'failed' THEN 'high' ELSE 'normal' END,
          jsonb_build_object('campaign_id', NEW.id, 'sent', NEW.sent_count, 'failed', NEW.failed_count)
        FROM public.get_sovereign_admin_ids() uid;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;$$;
DROP TRIGGER IF EXISTS trg_notify_push_campaign ON public.push_campaigns;
CREATE TRIGGER trg_notify_push_campaign AFTER UPDATE ON public.push_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.notify_push_campaign();

-- 7) تذاكر الدعم
CREATE OR REPLACE FUNCTION public.notify_support_ticket()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications(user_id,title,message,type,priority,metadata)
      SELECT uid, '🎫 تذكرة دعم جديدة',
        COALESCE(NEW.subject, 'تذكرة جديدة') || ' - ' || COALESCE(NEW.priority, 'عادي'),
        'support_ticket_created',
        CASE NEW.priority WHEN 'urgent' THEN 'urgent' WHEN 'high' THEN 'high' ELSE 'normal' END,
        jsonb_build_object('ticket_id', NEW.id, 'priority', NEW.priority)
      FROM public.get_sovereign_admin_ids() uid;
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.user_id IS NOT NULL THEN
      INSERT INTO public.notifications(user_id,title,message,type,metadata)
        VALUES(NEW.user_id, '🎫 تحديث تذكرتك',
          'التذكرة → ' || NEW.status,
          'support_ticket_update',
          jsonb_build_object('ticket_id', NEW.id, 'status', NEW.status));
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;$$;
DROP TRIGGER IF EXISTS trg_notify_support_ticket ON public.support_tickets;
CREATE TRIGGER trg_notify_support_ticket AFTER INSERT OR UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.notify_support_ticket();

-- 8) إعدادات WhatsApp
CREATE OR REPLACE FUNCTION public.notify_whatsapp_config()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.notifications(user_id,title,message,type,metadata)
      SELECT uid, '📱 تعديل إعدادات WhatsApp',
        'تم تعديل إعدادات واتساب للمنظمة',
        'whatsapp_config_changed',
        jsonb_build_object('config_id', NEW.id, 'org_id', NEW.organization_id)
      FROM public.get_sovereign_admin_ids() uid;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;$$;
DROP TRIGGER IF EXISTS trg_notify_whatsapp_config ON public.whatsapp_config;
CREATE TRIGGER trg_notify_whatsapp_config AFTER UPDATE ON public.whatsapp_config
  FOR EACH ROW EXECUTE FUNCTION public.notify_whatsapp_config();

-- 9) تكلفة AI مرتفعة
CREATE OR REPLACE FUNCTION public.notify_ai_overuse()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'error' OR NEW.estimated_cost_usd > 1.0 THEN
    INSERT INTO public.notifications(user_id,title,message,type,priority,metadata)
      SELECT uid,
        CASE WHEN NEW.status = 'error' THEN '🤖 خطأ في طلب AI' ELSE '💸 تكلفة AI مرتفعة' END,
        NEW.function_name || ' - ' || COALESCE(NEW.error_message, '$' || NEW.estimated_cost_usd::text),
        'ai_usage_alert', 'high',
        jsonb_build_object('log_id', NEW.id, 'cost', NEW.estimated_cost_usd, 'model', NEW.model_used)
      FROM public.get_sovereign_admin_ids() uid;
  END IF;
  RETURN NEW;
END;$$;
DROP TRIGGER IF EXISTS trg_notify_ai_overuse ON public.ai_usage_log;
CREATE TRIGGER trg_notify_ai_overuse AFTER INSERT ON public.ai_usage_log
  FOR EACH ROW EXECUTE FUNCTION public.notify_ai_overuse();

-- 10) خطط وكوبونات الإعلانات
CREATE OR REPLACE FUNCTION public.notify_ad_plan_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications(user_id,title,message,type,metadata)
    SELECT uid, '📊 تعديل خطة إعلانية',
      'تم تعديل خطة: ' || COALESCE(NEW.name_ar, ''),
      'ad_plan_changed', jsonb_build_object('plan_id', NEW.id)
    FROM public.get_sovereign_admin_ids() uid;
  RETURN COALESCE(NEW, OLD);
END;$$;
DROP TRIGGER IF EXISTS trg_notify_ad_plan ON public.ad_plans;
CREATE TRIGGER trg_notify_ad_plan AFTER INSERT OR UPDATE ON public.ad_plans
  FOR EACH ROW EXECUTE FUNCTION public.notify_ad_plan_change();

CREATE OR REPLACE FUNCTION public.notify_ad_coupon()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications(user_id,title,message,type,metadata)
      SELECT uid, '🎟️ كوبون إعلاني جديد',
        'كود: ' || NEW.code,
        'ad_coupon_created', jsonb_build_object('coupon_id', NEW.id, 'code', NEW.code)
      FROM public.get_sovereign_admin_ids() uid;
  END IF;
  RETURN NEW;
END;$$;
DROP TRIGGER IF EXISTS trg_notify_ad_coupon ON public.ad_coupons;
CREATE TRIGGER trg_notify_ad_coupon AFTER INSERT ON public.ad_coupons
  FOR EACH ROW EXECUTE FUNCTION public.notify_ad_coupon();
