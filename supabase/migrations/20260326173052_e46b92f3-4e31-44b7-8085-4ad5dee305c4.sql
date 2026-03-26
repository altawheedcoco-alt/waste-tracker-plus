
-- ============================================================
-- إشعارات الجهات الرقابية - الجزء المكمّل (منها وإليها)
-- ============================================================

-- 1) سجل نشاط الجهة الرقابية (regulator_activity_log) → إشعار للمنظمة المستهدفة
CREATE OR REPLACE FUNCTION public.notify_regulator_activity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- إشعار المنظمة المستهدفة بأن جهة رقابية اتخذت إجراء ضدها
  IF NEW.target_organization_id IS NOT NULL THEN
    INSERT INTO public.notifications(user_id,title,message,type,priority,metadata)
      SELECT om.user_id,
        CASE NEW.action_type
          WHEN 'inspection' THEN '🔍 جهة رقابية أجرت تفتيش'
          WHEN 'penalty' THEN '💸 جهة رقابية فرضت غرامة'
          WHEN 'suspension' THEN '🚫 تعليق ترخيص'
          WHEN 'warning' THEN '⚠️ إنذار رقابي'
          WHEN 'approval' THEN '✅ موافقة رقابية'
          ELSE '🏛️ إجراء رقابي'
        END,
        'قامت جهة رقابية بـ: ' || COALESCE(NEW.action_type, '') || ' على ' || COALESCE(NEW.target_resource_type, ''),
        'regulator_action_received',
        CASE NEW.action_type WHEN 'suspension' THEN 'urgent' WHEN 'penalty' THEN 'high' ELSE 'normal' END,
        jsonb_build_object('activity_id', NEW.id, 'action_type', NEW.action_type,
          'regulator_org_id', NEW.regulator_organization_id)
      FROM public.organization_members om
      WHERE om.organization_id = NEW.target_organization_id AND om.status = 'active';
  END IF;
  -- إشعار أعضاء الجهة الرقابية نفسها (تأكيد الإجراء)
  IF NEW.regulator_organization_id IS NOT NULL THEN
    INSERT INTO public.notifications(user_id,title,message,type,metadata)
      SELECT om.user_id, '📋 تم تسجيل إجراء رقابي',
        NEW.action_type || ' - ' || COALESCE(NEW.target_resource_type, ''),
        'regulator_action_logged',
        jsonb_build_object('activity_id', NEW.id, 'action_type', NEW.action_type)
      FROM public.organization_members om
      WHERE om.organization_id = NEW.regulator_organization_id AND om.status = 'active'
        AND om.user_id IS DISTINCT FROM NEW.user_id;
  END IF;
  RETURN NEW;
END;$$;
DROP TRIGGER IF EXISTS trg_notify_regulator_activity ON public.regulator_activity_log;
CREATE TRIGGER trg_notify_regulator_activity AFTER INSERT ON public.regulator_activity_log
  FOR EACH ROW EXECUTE FUNCTION public.notify_regulator_activity();

-- 2) الشركات الخاضعة للرقابة (regulated_companies) - تغيير حالة الامتثال
CREATE OR REPLACE FUNCTION public.notify_regulated_company()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- إشعار الجهة الرقابية المنشئة
    IF NEW.organization_id IS NOT NULL THEN
      INSERT INTO public.notifications(user_id,title,message,type,metadata)
        SELECT om.user_id, '🏢 شركة خاضعة جديدة',
          'تم تسجيل: ' || COALESCE(NEW.company_name_ar, NEW.company_name, ''),
          'regulated_company_added',
          jsonb_build_object('company_id', NEW.id, 'license_type', NEW.license_type)
        FROM public.organization_members om
        WHERE om.organization_id = NEW.organization_id AND om.status = 'active';
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- تغيير حالة الامتثال
    IF OLD.is_compliant IS DISTINCT FROM NEW.is_compliant THEN
      IF NEW.organization_id IS NOT NULL THEN
        INSERT INTO public.notifications(user_id,title,message,type,priority,metadata)
          SELECT om.user_id,
            CASE WHEN NEW.is_compliant THEN '✅ شركة ممتثلة' ELSE '🚫 شركة غير ممتثلة' END,
            COALESCE(NEW.company_name_ar, NEW.company_name, '') || 
              CASE WHEN NEW.is_compliant THEN ' أصبحت ممتثلة' ELSE ' غير ممتثلة' END,
            'regulated_company_compliance',
            CASE WHEN NOT NEW.is_compliant THEN 'high' ELSE 'normal' END,
            jsonb_build_object('company_id', NEW.id, 'is_compliant', NEW.is_compliant)
          FROM public.organization_members om
          WHERE om.organization_id = NEW.organization_id AND om.status = 'active';
      END IF;
    END IF;
    -- تغيير حالة الترخيص
    IF OLD.license_status IS DISTINCT FROM NEW.license_status THEN
      IF NEW.organization_id IS NOT NULL THEN
        INSERT INTO public.notifications(user_id,title,message,type,priority,metadata)
          SELECT om.user_id,
            CASE NEW.license_status
              WHEN 'expired' THEN '⏰ ترخيص منتهي'
              WHEN 'suspended' THEN '🚫 ترخيص معلّق'
              WHEN 'revoked' THEN '❌ ترخيص ملغي'
              WHEN 'active' THEN '✅ ترخيص نشط'
              ELSE '📋 تحديث ترخيص'
            END,
            COALESCE(NEW.company_name_ar, '') || ' - ترخيص → ' || NEW.license_status,
            'license_status_change',
            CASE NEW.license_status WHEN 'revoked' THEN 'urgent' WHEN 'suspended' THEN 'high' WHEN 'expired' THEN 'high' ELSE 'normal' END,
            jsonb_build_object('company_id', NEW.id, 'license_status', NEW.license_status)
          FROM public.organization_members om
          WHERE om.organization_id = NEW.organization_id AND om.status = 'active';
      END IF;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;$$;
DROP TRIGGER IF EXISTS trg_notify_regulated_company ON public.regulated_companies;
CREATE TRIGGER trg_notify_regulated_company AFTER INSERT OR UPDATE ON public.regulated_companies
  FOR EACH ROW EXECUTE FUNCTION public.notify_regulated_company();

-- 3) تقارير التدقيق الملزمة (binding_audit_reports) → إشعار للمنظمة المدققة
CREATE OR REPLACE FUNCTION public.notify_binding_audit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.organization_id IS NOT NULL THEN
    INSERT INTO public.notifications(user_id,title,message,type,priority,metadata)
      SELECT om.user_id, '📑 تقرير تدقيق ملزم',
        'تم إصدار تقرير تدقيق ملزم لمنظمتكم',
        'binding_audit_report', 'high',
        jsonb_build_object('report_id', NEW.id, 'org_type', NEW.org_type)
      FROM public.organization_members om
      WHERE om.organization_id = NEW.organization_id AND om.status = 'active';
  END IF;
  RETURN NEW;
END;$$;
DROP TRIGGER IF EXISTS trg_notify_binding_audit ON public.binding_audit_reports;
CREATE TRIGGER trg_notify_binding_audit AFTER INSERT ON public.binding_audit_reports
  FOR EACH ROW EXECUTE FUNCTION public.notify_binding_audit();

-- 4) المستشار البيئي (environmental_consultants) - التحقق والتفعيل
CREATE OR REPLACE FUNCTION public.notify_consultant_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- تم التحقق
    IF OLD.is_verified IS DISTINCT FROM NEW.is_verified AND NEW.is_verified = true AND NEW.user_id IS NOT NULL THEN
      INSERT INTO public.notifications(user_id,title,message,type,priority,metadata)
        VALUES(NEW.user_id, '✅ تم التحقق من حسابك كمستشار',
          'مبروك! تم اعتماد حسابك كمستشار بيئي',
          'consultant_verified', 'high',
          jsonb_build_object('consultant_id', NEW.id));
    END IF;
    -- تم التعطيل
    IF OLD.is_active IS DISTINCT FROM NEW.is_active AND NEW.is_active = false AND NEW.user_id IS NOT NULL THEN
      INSERT INTO public.notifications(user_id,title,message,type,priority,metadata)
        VALUES(NEW.user_id, '🚫 تم تعطيل حساب المستشار',
          'تم تعطيل حسابك كمستشار بيئي',
          'consultant_deactivated', 'urgent',
          jsonb_build_object('consultant_id', NEW.id));
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;$$;
DROP TRIGGER IF EXISTS trg_notify_consultant_status ON public.environmental_consultants;
CREATE TRIGGER trg_notify_consultant_status AFTER UPDATE ON public.environmental_consultants
  FOR EACH ROW EXECUTE FUNCTION public.notify_consultant_status();

-- 5) شكاوى المواطنين (citizen_complaints) - إشعار الجهة المختصة + تحديث للمشتكي
CREATE OR REPLACE FUNCTION public.notify_citizen_complaint_full()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- إشعار المنظمة المختصة
    IF NEW.organization_id IS NOT NULL THEN
      INSERT INTO public.notifications(user_id,title,message,type,priority,metadata)
        SELECT om.user_id, '📢 شكوى مواطن جديدة',
          COALESCE(NEW.complaint_type, 'شكوى') || ' - ' || COALESCE(NEW.priority, 'عادي') || ' #' || COALESCE(NEW.complaint_number, ''),
          'citizen_complaint_new',
          CASE NEW.priority WHEN 'urgent' THEN 'urgent' WHEN 'high' THEN 'high' ELSE 'normal' END,
          jsonb_build_object('complaint_id', NEW.id, 'type', NEW.complaint_type, 'priority', NEW.priority)
        FROM public.organization_members om
        WHERE om.organization_id = NEW.organization_id AND om.status = 'active';
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- تغيير حالة الشكوى
    IF OLD.status IS DISTINCT FROM NEW.status AND NEW.organization_id IS NOT NULL THEN
      INSERT INTO public.notifications(user_id,title,message,type,metadata)
        SELECT om.user_id,
          CASE NEW.status
            WHEN 'resolved' THEN '✅ تم حل شكوى مواطن'
            WHEN 'in_progress' THEN '🔄 جاري معالجة شكوى'
            WHEN 'escalated' THEN '⬆️ تصعيد شكوى مواطن'
            ELSE '📢 تحديث شكوى'
          END,
          'شكوى #' || COALESCE(NEW.complaint_number, '') || ' → ' || NEW.status,
          'citizen_complaint_update',
          jsonb_build_object('complaint_id', NEW.id, 'status', NEW.status)
        FROM public.organization_members om
        WHERE om.organization_id = NEW.organization_id AND om.status = 'active';
    END IF;
    -- تعيين مسؤول
    IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to AND NEW.assigned_to IS NOT NULL THEN
      INSERT INTO public.notifications(user_id,title,message,type,priority,metadata)
        VALUES(NEW.assigned_to, '📢 تم تعيينك لشكوى مواطن',
          'شكوى #' || COALESCE(NEW.complaint_number, '') || ' - ' || COALESCE(NEW.complaint_type, ''),
          'citizen_complaint_assigned', 'high',
          jsonb_build_object('complaint_id', NEW.id));
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;$$;
-- حذف القديم أولاً
DROP TRIGGER IF EXISTS trg_notify_citizen_complaint ON public.citizen_complaints;
DROP TRIGGER IF EXISTS trg_notify_citizen_complaint_full ON public.citizen_complaints;
CREATE TRIGGER trg_notify_citizen_complaint_full AFTER INSERT OR UPDATE ON public.citizen_complaints
  FOR EACH ROW EXECUTE FUNCTION public.notify_citizen_complaint_full();

-- 6) الإجراءات التصحيحية (corrective_actions) - تحسين الإشعار الحالي
CREATE OR REPLACE FUNCTION public.notify_corrective_action_full()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- إشعار المسؤول المعيّن
    IF NEW.assigned_to IS NOT NULL THEN
      INSERT INTO public.notifications(user_id,title,message,type,priority,metadata)
        VALUES(NEW.assigned_to, '🔧 إجراء تصحيحي مطلوب',
          COALESCE(NEW.title, '') || ' - خطورة: ' || COALESCE(NEW.severity, 'عادي'),
          'corrective_action_assigned',
          CASE NEW.severity WHEN 'critical' THEN 'urgent' WHEN 'major' THEN 'high' ELSE 'normal' END,
          jsonb_build_object('action_id', NEW.id, 'severity', NEW.severity, 'deadline', NEW.deadline));
    END IF;
    -- إشعار مديري المنظمة
    IF NEW.organization_id IS NOT NULL THEN
      INSERT INTO public.notifications(user_id,title,message,type,priority,metadata)
        SELECT om.user_id, '🔧 إجراء تصحيحي جديد',
          '#' || COALESCE(NEW.ticket_number, '') || ' - ' || COALESCE(NEW.title, ''),
          'corrective_action_created',
          CASE NEW.severity WHEN 'critical' THEN 'urgent' WHEN 'major' THEN 'high' ELSE 'normal' END,
          jsonb_build_object('action_id', NEW.id, 'severity', NEW.severity)
        FROM public.organization_members om
        WHERE om.organization_id = NEW.organization_id AND om.status = 'active'
          AND om.role IN ('admin','manager','quality') AND om.user_id IS DISTINCT FROM NEW.assigned_to;
    END IF;
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    -- إشعار المنشئ + المعيّن + المنظمة
    IF NEW.created_by IS NOT NULL THEN
      INSERT INTO public.notifications(user_id,title,message,type,metadata)
        VALUES(NEW.created_by,
          CASE NEW.status WHEN 'completed' THEN '✅ إجراء تصحيحي مكتمل' ELSE '🔧 تحديث إجراء تصحيحي' END,
          '#' || COALESCE(NEW.ticket_number, '') || ' → ' || NEW.status,
          'corrective_action_update',
          jsonb_build_object('action_id', NEW.id, 'status', NEW.status));
    END IF;
    IF NEW.assigned_to IS NOT NULL AND NEW.assigned_to IS DISTINCT FROM NEW.created_by THEN
      INSERT INTO public.notifications(user_id,title,message,type,metadata)
        VALUES(NEW.assigned_to,
          CASE NEW.status WHEN 'completed' THEN '✅ إجراء تصحيحي مكتمل' ELSE '🔧 تحديث إجراء تصحيحي' END,
          '#' || COALESCE(NEW.ticket_number, '') || ' → ' || NEW.status,
          'corrective_action_update',
          jsonb_build_object('action_id', NEW.id, 'status', NEW.status));
    END IF;
    -- التحقق
    IF NEW.status = 'verified' AND NEW.verified_by IS NOT NULL THEN
      IF NEW.assigned_to IS NOT NULL THEN
        INSERT INTO public.notifications(user_id,title,message,type,metadata)
          VALUES(NEW.assigned_to, '✅ تم التحقق من الإجراء التصحيحي',
            '#' || COALESCE(NEW.ticket_number, '') || ' تم التحقق بنجاح',
            'corrective_action_verified',
            jsonb_build_object('action_id', NEW.id, 'verified_by', NEW.verified_by));
      END IF;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;$$;
DROP TRIGGER IF EXISTS trg_notify_corrective_action ON public.corrective_actions;
DROP TRIGGER IF EXISTS trg_notify_corrective_action_full ON public.corrective_actions;
CREATE TRIGGER trg_notify_corrective_action_full AFTER INSERT OR UPDATE ON public.corrective_actions
  FOR EACH ROW EXECUTE FUNCTION public.notify_corrective_action_full();
