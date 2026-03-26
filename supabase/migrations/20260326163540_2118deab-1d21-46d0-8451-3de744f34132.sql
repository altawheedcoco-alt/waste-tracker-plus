
-- ========================================
-- 5. Fuel Record → notify org supervisors
-- ========================================
CREATE OR REPLACE FUNCTION public.notify_fuel_record()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  member_rec RECORD;
  driver_name text;
BEGIN
  SELECT full_name INTO driver_name FROM profiles WHERE id = NEW.driver_id;
  driver_name := COALESCE(driver_name, 'سائق');

  FOR member_rec IN
    SELECT DISTINCT p.id as user_id FROM profiles p
    JOIN organization_members om ON om.organization_id = NEW.organization_id AND (om.profile_id = p.id OR om.user_id = p.id)
    WHERE om.member_role IN ('owner','admin','manager')
      AND p.id != COALESCE(NEW.driver_id, '00000000-0000-0000-0000-000000000000')
  LOOP
    INSERT INTO notifications (user_id, title, message, type, is_read, reference_id, reference_type)
    VALUES (member_rec.user_id, '⛽ تسجيل تعبئة وقود', driver_name || ' سجّل تعبئة ' || COALESCE(NEW.liters::text, '') || ' لتر', 'fuel_record', false, NEW.id, 'fuel_record');
  END LOOP;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_fuel_record ON fuel_records;
CREATE TRIGGER trg_notify_fuel_record AFTER INSERT ON fuel_records FOR EACH ROW EXECUTE FUNCTION notify_fuel_record();

-- ========================================
-- 6. ESG Report → notify org members
-- ========================================
CREATE OR REPLACE FUNCTION public.notify_esg_report()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  member_rec RECORD;
BEGIN
  FOR member_rec IN
    SELECT DISTINCT p.id as user_id FROM profiles p WHERE p.organization_id = NEW.organization_id
  LOOP
    INSERT INTO notifications (user_id, title, message, type, is_read, reference_id, reference_type)
    VALUES (member_rec.user_id, '📊 تقرير بيئي جديد', 'تم إنشاء تقرير ESG جديد من نوع ' || COALESCE(NEW.report_type, 'عام'), 'esg_report', false, NEW.id, 'esg_report');
  END LOOP;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_esg_report ON esg_reports;
CREATE TRIGGER trg_notify_esg_report AFTER INSERT ON esg_reports FOR EACH ROW EXECUTE FUNCTION notify_esg_report();

-- ========================================
-- 7. Proof of Service → notify org supervisors
-- ========================================
CREATE OR REPLACE FUNCTION public.notify_proof_of_service()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  member_rec RECORD;
BEGIN
  FOR member_rec IN
    SELECT DISTINCT p.id as user_id FROM profiles p
    JOIN organization_members om ON om.organization_id = NEW.organization_id AND (om.profile_id = p.id OR om.user_id = p.id)
    WHERE om.member_role IN ('owner','admin','manager')
  LOOP
    INSERT INTO notifications (user_id, title, message, type, is_read, reference_id, reference_type)
    VALUES (member_rec.user_id, '🧹 إثبات أداء ميداني جديد', 'تم تسجيل إثبات أداء من نوع ' || COALESCE(NEW.service_type, 'خدمة'), 'proof_of_service', false, NEW.id, 'proof_of_service');
  END LOOP;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_proof_of_service ON proof_of_service;
CREATE TRIGGER trg_notify_proof_of_service AFTER INSERT ON proof_of_service FOR EACH ROW EXECUTE FUNCTION notify_proof_of_service();

-- ========================================
-- 8. Driver Trip Schedule → notify assigned driver
-- ========================================
CREATE OR REPLACE FUNCTION public.notify_driver_trip_assigned()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  driver_user_id uuid;
BEGIN
  SELECT p.id INTO driver_user_id FROM profiles p
  JOIN driver_profiles dp ON dp.user_id = p.id
  WHERE dp.id = NEW.driver_id;

  IF driver_user_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, message, type, is_read, reference_id, reference_type)
    VALUES (driver_user_id, '🗓️ رحلة جديدة مجدولة', 'تم تعيين رحلة لك بتاريخ ' || COALESCE(NEW.trip_date::text, ''), 'trip_schedule', false, NEW.id, 'trip_schedule');
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_driver_trip ON driver_trip_schedules;
CREATE TRIGGER trg_notify_driver_trip AFTER INSERT ON driver_trip_schedules FOR EACH ROW EXECUTE FUNCTION notify_driver_trip_assigned();

-- ========================================
-- 9. Work Order status change → notify creator org
-- ========================================
CREATE OR REPLACE FUNCTION public.notify_work_order_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  member_rec RECORD;
  status_label text;
  order_num text;
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;
  order_num := COALESCE(NEW.order_number, NEW.id::text);
  status_label := CASE NEW.status
    WHEN 'approved' THEN 'تمت الموافقة' WHEN 'in_progress' THEN 'قيد التنفيذ'
    WHEN 'completed' THEN 'مكتمل' WHEN 'cancelled' THEN 'ملغي'
    ELSE NEW.status END;

  FOR member_rec IN
    SELECT DISTINCT p.id as user_id FROM profiles p WHERE p.organization_id = NEW.organization_id
  LOOP
    INSERT INTO notifications (user_id, title, message, type, is_read, reference_id, reference_type)
    VALUES (member_rec.user_id, '📋 تحديث أمر الشغل - ' || order_num, 'تم تحديث حالة أمر الشغل إلى: ' || status_label, 'work_order_status', false, NEW.id, 'work_order');
  END LOOP;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_work_order_status ON work_orders;
CREATE TRIGGER trg_notify_work_order_status AFTER UPDATE ON work_orders FOR EACH ROW EXECUTE FUNCTION notify_work_order_status_change();
