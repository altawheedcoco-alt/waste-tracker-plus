
-- ========================================
-- 1. Scheduled Collections → تذكير موعد جمع / تحديث
-- ========================================
CREATE OR REPLACE FUNCTION notify_scheduled_collection() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_member RECORD;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- إشعار المولد
    FOR v_member IN SELECT user_id FROM organization_members WHERE organization_id = NEW.organization_id AND status = 'active' LOOP
      INSERT INTO notifications(user_id, title, message, type, is_read)
      VALUES(v_member.user_id, '📅 جدولة جمع جديدة', COALESCE(NEW.title,'جمع مجدول') || ' - ' || COALESCE(NEW.waste_type,'') || ' بتكرار ' || COALESCE(NEW.frequency,''), 'scheduled_collection', false);
    END LOOP;
    -- إشعار الناقل
    IF NEW.transporter_id IS NOT NULL THEN
      FOR v_member IN SELECT user_id FROM organization_members WHERE organization_id = NEW.transporter_id AND status = 'active' LOOP
        INSERT INTO notifications(user_id, title, message, type, is_read)
        VALUES(v_member.user_id, '📅 طلب جمع مجدول وارد', COALESCE(NEW.title,'') || ' - ' || COALESCE(NEW.waste_type,''), 'scheduled_collection_incoming', false);
      END LOOP;
    END IF;
  ELSIF TG_OP = 'UPDATE' AND OLD.is_active IS DISTINCT FROM NEW.is_active THEN
    FOR v_member IN SELECT user_id FROM organization_members WHERE organization_id = NEW.organization_id AND status = 'active' LOOP
      INSERT INTO notifications(user_id, title, message, type, is_read)
      VALUES(v_member.user_id,
        CASE WHEN NEW.is_active THEN '✅ تم تفعيل جدولة الجمع' ELSE '⏸️ تم إيقاف جدولة الجمع' END,
        COALESCE(NEW.title,''), 'scheduled_collection_toggle', false);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_scheduled_collection ON scheduled_collections;
CREATE TRIGGER trg_notify_scheduled_collection AFTER INSERT OR UPDATE ON scheduled_collections FOR EACH ROW EXECUTE FUNCTION notify_scheduled_collection();

-- ========================================
-- 2. Organization Members → إشعارات شاملة (تغيير حالة/دور/صلاحيات)
-- ========================================
CREATE OR REPLACE FUNCTION notify_org_member_change() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_org_name TEXT; v_member_name TEXT;
BEGIN
  SELECT name INTO v_org_name FROM organizations WHERE id = NEW.organization_id;
  SELECT full_name INTO v_member_name FROM profiles WHERE id = NEW.user_id;
  
  -- تغيير الحالة (تعليق / إعادة تفعيل / إزالة)
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    -- إشعار العضو نفسه
    IF NEW.user_id IS NOT NULL THEN
      INSERT INTO notifications(user_id, title, message, type, is_read)
      VALUES(NEW.user_id,
        CASE 
          WHEN NEW.status = 'suspended' THEN '⛔ تم تعليق عضويتك'
          WHEN NEW.status = 'active' AND OLD.status = 'suspended' THEN '✅ تم إعادة تفعيل عضويتك'
          WHEN NEW.status = 'removed' THEN '❌ تم إزالتك من المنظمة'
          ELSE '📋 تحديث حالة العضوية: ' || NEW.status
        END,
        'في ' || COALESCE(v_org_name,'المنظمة'), 'member_status_change', false);
    END IF;
    -- إشعار المديرين
    INSERT INTO notifications(user_id, title, message, type, is_read)
    SELECT om.user_id, '👤 تغيير حالة عضو', COALESCE(v_member_name,'عضو') || ' → ' || NEW.status, 'member_status_admin', false
    FROM organization_members om
    WHERE om.organization_id = NEW.organization_id AND om.status = 'active' AND om.can_manage_members = true AND om.user_id != NEW.user_id;
  END IF;

  -- تغيير الصلاحيات
  IF TG_OP = 'UPDATE' AND OLD.granted_permissions IS DISTINCT FROM NEW.granted_permissions AND NEW.user_id IS NOT NULL THEN
    INSERT INTO notifications(user_id, title, message, type, is_read)
    VALUES(NEW.user_id, '🔑 تم تحديث صلاحياتك', 'تم تعديل صلاحياتك في ' || COALESCE(v_org_name,'المنظمة'), 'permissions_updated', false);
  END IF;

  -- تغيير المسمى الوظيفي
  IF TG_OP = 'UPDATE' AND OLD.job_title IS DISTINCT FROM NEW.job_title AND NEW.user_id IS NOT NULL AND NEW.job_title IS NOT NULL THEN
    INSERT INTO notifications(user_id, title, message, type, is_read)
    VALUES(NEW.user_id, '💼 تحديث المسمى الوظيفي', 'مسماك الجديد: ' || COALESCE(NEW.job_title_ar, NEW.job_title), 'job_title_updated', false);
  END IF;

  -- دعوة عضو جديد (invitation)
  IF TG_OP = 'INSERT' AND NEW.invitation_token IS NOT NULL AND NEW.status = 'pending' THEN
    -- إشعار المديرين بأنه تم إرسال دعوة
    INSERT INTO notifications(user_id, title, message, type, is_read)
    SELECT om.user_id, '📨 تم إرسال دعوة عضو جديد', COALESCE(NEW.invitation_email,'') || ' - ' || COALESCE(NEW.job_title_ar, NEW.job_title, 'عضو'), 'member_invitation_sent', false
    FROM organization_members om
    WHERE om.organization_id = NEW.organization_id AND om.status = 'active' AND om.can_manage_members = true;
  END IF;

  -- قبول الدعوة
  IF TG_OP = 'UPDATE' AND OLD.invitation_accepted_at IS NULL AND NEW.invitation_accepted_at IS NOT NULL THEN
    INSERT INTO notifications(user_id, title, message, type, is_read)
    SELECT om.user_id, '✅ عضو جديد قَبِل الدعوة', COALESCE(v_member_name, NEW.invitation_email, 'عضو') || ' انضم للفريق', 'member_invitation_accepted', false
    FROM organization_members om
    WHERE om.organization_id = NEW.organization_id AND om.status = 'active' AND om.can_manage_members = true AND om.user_id != NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_org_member_change ON organization_members;
CREATE TRIGGER trg_notify_org_member_change AFTER INSERT OR UPDATE ON organization_members FOR EACH ROW EXECUTE FUNCTION notify_org_member_change();

-- ========================================
-- 3. Daily Attendance → إشعار حضور/انصراف العمال
-- ========================================
CREATE OR REPLACE FUNCTION notify_daily_attendance() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_member RECORD;
BEGIN
  IF TG_OP = 'INSERT' THEN
    FOR v_member IN SELECT user_id FROM organization_members WHERE organization_id = NEW.organization_id AND status = 'active' AND can_manage_members = true LOOP
      INSERT INTO notifications(user_id, title, message, type, is_read)
      VALUES(v_member.user_id, '📋 تسجيل حضور', COALESCE(NEW.worker_name,'عامل') || ' - ' || COALESCE(NEW.status,'حاضر') || ' - ' || COALESCE(NEW.attendance_date::text,''), 'daily_attendance', false);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_daily_attendance ON daily_attendance;
CREATE TRIGGER trg_notify_daily_attendance AFTER INSERT ON daily_attendance FOR EACH ROW EXECUTE FUNCTION notify_daily_attendance();

-- ========================================
-- 4. Employee Documents → إشعار مستند موظف (رفع / انتهاء صلاحية)
-- ========================================
CREATE OR REPLACE FUNCTION notify_employee_document() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_member_user_id UUID;
BEGIN
  -- إشعار الموظف صاحب المستند
  SELECT user_id INTO v_member_user_id FROM organization_members WHERE id = NEW.member_id;
  IF v_member_user_id IS NOT NULL AND TG_OP = 'INSERT' THEN
    INSERT INTO notifications(user_id, title, message, type, is_read)
    VALUES(v_member_user_id, '📄 مستند جديد مرفوع', COALESCE(NEW.document_name_ar, NEW.document_name, 'مستند'), 'employee_document_uploaded', false);
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_employee_document ON employee_documents;
CREATE TRIGGER trg_notify_employee_document AFTER INSERT ON employee_documents FOR EACH ROW EXECUTE FUNCTION notify_employee_document();

-- ========================================
-- 5. Disposal Trips → إشعار رحلة تخلص
-- ========================================
CREATE OR REPLACE FUNCTION notify_disposal_trip() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_member RECORD;
BEGIN
  IF NEW.organization_id IS NOT NULL THEN
    FOR v_member IN SELECT user_id FROM organization_members WHERE organization_id = NEW.organization_id AND status = 'active' LOOP
      INSERT INTO notifications(user_id, title, message, type, is_read)
      VALUES(v_member.user_id,
        CASE WHEN TG_OP='INSERT' THEN '🚚 رحلة تخلص جديدة' ELSE '🚚 تحديث رحلة تخلص' END,
        'الحالة: ' || COALESCE(NEW.status,''), 'disposal_trip', false);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_disposal_trip ON disposal_trips;
CREATE TRIGGER trg_notify_disposal_trip AFTER INSERT OR UPDATE ON disposal_trips FOR EACH ROW EXECUTE FUNCTION notify_disposal_trip();

-- ========================================
-- 6. Driver Availability (driver_location_logs) → إشعار السائق أصبح متصل/غير متصل
-- ========================================
CREATE OR REPLACE FUNCTION notify_driver_availability() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_org_id UUID; v_member RECORD;
BEGIN
  -- Find driver's org
  SELECT organization_id INTO v_org_id FROM organization_members WHERE user_id = NEW.driver_id AND status = 'active' LIMIT 1;
  IF v_org_id IS NOT NULL THEN
    -- Only notify on first log of the session (no previous log in last 2 minutes)
    IF NOT EXISTS (
      SELECT 1 FROM driver_location_logs 
      WHERE driver_id = NEW.driver_id AND id != NEW.id 
      AND recorded_at > (NEW.recorded_at::timestamp - interval '2 minutes')
    ) THEN
      FOR v_member IN SELECT user_id FROM organization_members WHERE organization_id = v_org_id AND status = 'active' AND can_manage_members = true AND user_id != NEW.driver_id LOOP
        INSERT INTO notifications(user_id, title, message, type, is_read)
        VALUES(v_member.user_id, '🟢 سائق أصبح متصلاً', 'سائق بدأ جلسة تتبع جديدة', 'driver_online', false);
      END LOOP;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_driver_availability ON driver_location_logs;
CREATE TRIGGER trg_notify_driver_availability AFTER INSERT ON driver_location_logs FOR EACH ROW EXECUTE FUNCTION notify_driver_availability();
