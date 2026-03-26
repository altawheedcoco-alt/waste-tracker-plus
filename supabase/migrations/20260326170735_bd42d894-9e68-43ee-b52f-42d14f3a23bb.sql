
-- ========================================
-- التخلص (Disposer) + جهات مشتركة
-- ========================================

-- 1. Disposal Facility Reviews → مراجعة منشأة تخلص
CREATE OR REPLACE FUNCTION notify_disposal_facility_review() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_member RECORD; v_org_id UUID;
BEGIN
  SELECT organization_id INTO v_org_id FROM disposal_facilities WHERE id = NEW.facility_id;
  IF v_org_id IS NOT NULL THEN
    FOR v_member IN SELECT user_id FROM organization_members WHERE organization_id = v_org_id AND status = 'active' LOOP
      INSERT INTO notifications(user_id, title, message, type, is_read)
      VALUES(v_member.user_id, '📝 مراجعة جديدة لمنشأتك', 'تقييم: ' || COALESCE(NEW.rating::text,'--') || '/5', 'facility_review', false);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_disposal_facility_review ON disposal_facility_reviews;
CREATE TRIGGER trg_notify_disposal_facility_review AFTER INSERT ON disposal_facility_reviews FOR EACH ROW EXECUTE FUNCTION notify_disposal_facility_review();

-- 2. Disposal Byproducts → منتجات ثانوية
CREATE OR REPLACE FUNCTION notify_disposal_byproduct() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_member RECORD;
BEGIN
  IF TG_OP = 'INSERT' THEN
    FOR v_member IN SELECT user_id FROM organization_members WHERE organization_id = NEW.organization_id AND status = 'active' LOOP
      INSERT INTO notifications(user_id, title, message, type, is_read)
      VALUES(v_member.user_id, '♻️ منتج ثانوي جديد', 'تم تسجيل منتج ثانوي من عملية التخلص', 'disposal_byproduct', false);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_disposal_byproduct ON disposal_byproducts;
CREATE TRIGGER trg_notify_disposal_byproduct AFTER INSERT ON disposal_byproducts FOR EACH ROW EXECUTE FUNCTION notify_disposal_byproduct();

-- 3. Fraud Alerts → تنبيه احتيال
CREATE OR REPLACE FUNCTION notify_fraud_alert() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_member RECORD;
BEGIN
  IF NEW.organization_id IS NOT NULL THEN
    FOR v_member IN SELECT user_id FROM organization_members WHERE organization_id = NEW.organization_id AND status = 'active' LOOP
      INSERT INTO notifications(user_id, title, message, type, shipment_id, is_read)
      VALUES(v_member.user_id, '🚨 تنبيه احتيال: ' || COALESCE(NEW.alert_type,''), COALESCE(NEW.severity,'') || ' - يتطلب مراجعة فورية', 'fraud_alert', NEW.shipment_id, false);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_fraud_alert ON fraud_alerts;
CREATE TRIGGER trg_notify_fraud_alert AFTER INSERT ON fraud_alerts FOR EACH ROW EXECUTE FUNCTION notify_fraud_alert();

-- 4. Transport Incidents → حادث نقل
CREATE OR REPLACE FUNCTION notify_transport_incident() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_member RECORD;
BEGIN
  -- إشعار السائق
  IF NEW.driver_id IS NOT NULL THEN
    INSERT INTO notifications(user_id, title, message, type, shipment_id, is_read)
    VALUES(NEW.driver_id, '⚠️ تم تسجيل حادث', 'حادث ' || COALESCE(NEW.severity,'') || ' أثناء النقل', 'transport_incident_driver', NEW.shipment_id, false);
  END IF;
  -- إشعار المنظمة
  IF NEW.organization_id IS NOT NULL THEN
    FOR v_member IN SELECT user_id FROM organization_members WHERE organization_id = NEW.organization_id AND status = 'active' AND can_manage_members = true LOOP
      INSERT INTO notifications(user_id, title, message, type, shipment_id, is_read)
      VALUES(v_member.user_id, '🚨 حادث نقل - ' || COALESCE(NEW.severity,''), 'الحالة: ' || COALESCE(NEW.status,''), 'transport_incident', NEW.shipment_id, false);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_transport_incident ON transport_incidents;
CREATE TRIGGER trg_notify_transport_incident AFTER INSERT ON transport_incidents FOR EACH ROW EXECUTE FUNCTION notify_transport_incident();

-- 5. IoT Alerts → تنبيه أجهزة IoT
CREATE OR REPLACE FUNCTION notify_iot_alert() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_member RECORD;
BEGIN
  IF NEW.organization_id IS NOT NULL AND NEW.severity IN ('critical','high','warning') THEN
    FOR v_member IN SELECT user_id FROM organization_members WHERE organization_id = NEW.organization_id AND status = 'active' LOOP
      INSERT INTO notifications(user_id, title, message, type, is_read)
      VALUES(v_member.user_id,
        CASE WHEN NEW.severity = 'critical' THEN '🚨 IoT حرج' WHEN NEW.severity = 'high' THEN '⚠️ IoT مرتفع' ELSE '📡 IoT تحذير' END,
        COALESCE(NEW.alert_type,'تنبيه'), 'iot_alert', false);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_iot_alert ON iot_alerts;
CREATE TRIGGER trg_notify_iot_alert AFTER INSERT ON iot_alerts FOR EACH ROW EXECUTE FUNCTION notify_iot_alert();

-- 6. Safety Inspections → فحص سلامة
CREATE OR REPLACE FUNCTION notify_safety_inspection() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_member RECORD;
BEGIN
  FOR v_member IN SELECT user_id FROM organization_members WHERE organization_id = NEW.organization_id AND status = 'active' LOOP
    INSERT INTO notifications(user_id, title, message, type, is_read)
    VALUES(v_member.user_id,
      CASE WHEN TG_OP='INSERT' THEN '🔍 فحص سلامة جديد' ELSE '🔍 تحديث فحص سلامة: ' || COALESCE(NEW.status,'') END,
      'فحص سلامة للمنشأة', 'safety_inspection', false);
  END LOOP;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_safety_inspection ON safety_inspections;
CREATE TRIGGER trg_notify_safety_inspection AFTER INSERT OR UPDATE ON safety_inspections FOR EACH ROW EXECUTE FUNCTION notify_safety_inspection();

-- 7. SLA Violations → انتهاك اتفاقية مستوى الخدمة
CREATE OR REPLACE FUNCTION notify_sla_violation() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_member RECORD;
BEGIN
  IF NEW.organization_id IS NOT NULL THEN
    FOR v_member IN SELECT user_id FROM organization_members WHERE organization_id = NEW.organization_id AND status = 'active' LOOP
      INSERT INTO notifications(user_id, title, message, type, shipment_id, is_read)
      VALUES(v_member.user_id, '⏰ انتهاك SLA', 'تم تسجيل انتهاك لاتفاقية مستوى الخدمة', 'sla_violation', NEW.shipment_id, false);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_sla_violation ON sla_violations;
CREATE TRIGGER trg_notify_sla_violation AFTER INSERT ON sla_violations FOR EACH ROW EXECUTE FUNCTION notify_sla_violation();

-- 8. Permits → تصاريح
CREATE OR REPLACE FUNCTION notify_permit() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_member RECORD;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.driver_id IS NOT NULL THEN
      INSERT INTO notifications(user_id, title, message, type, is_read)
      VALUES(NEW.driver_id, '📋 تصريح جديد', 'تم إنشاء تصريح جديد', 'permit_new', false);
    END IF;
    IF NEW.organization_id IS NOT NULL THEN
      FOR v_member IN SELECT user_id FROM organization_members WHERE organization_id = NEW.organization_id AND status = 'active' LOOP
        INSERT INTO notifications(user_id, title, message, type, is_read)
        VALUES(v_member.user_id, '📋 تصريح جديد', 'الحالة: ' || COALESCE(NEW.status,''), 'permit_new', false);
      END LOOP;
    END IF;
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.driver_id IS NOT NULL THEN
      INSERT INTO notifications(user_id, title, message, type, is_read)
      VALUES(NEW.driver_id,
        CASE WHEN NEW.status = 'approved' THEN '✅ تم اعتماد التصريح' WHEN NEW.status = 'rejected' THEN '❌ تم رفض التصريح' ELSE '📋 تحديث تصريح: ' || NEW.status END,
        '', 'permit_status', false);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_permit ON permits;
CREATE TRIGGER trg_notify_permit AFTER INSERT OR UPDATE ON permits FOR EACH ROW EXECUTE FUNCTION notify_permit();

-- 9. ERP Purchase Orders → أمر شراء
CREATE OR REPLACE FUNCTION notify_erp_purchase_order() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_member RECORD;
BEGIN
  FOR v_member IN SELECT user_id FROM organization_members WHERE organization_id = NEW.organization_id AND status = 'active' LOOP
    INSERT INTO notifications(user_id, title, message, type, is_read)
    VALUES(v_member.user_id,
      CASE WHEN TG_OP='INSERT' THEN '🛒 أمر شراء جديد' ELSE '🛒 تحديث أمر شراء: ' || COALESCE(NEW.status,'') END,
      '', 'purchase_order', false);
  END LOOP;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_erp_purchase_order ON erp_purchase_orders;
CREATE TRIGGER trg_notify_erp_purchase_order AFTER INSERT OR UPDATE ON erp_purchase_orders FOR EACH ROW EXECUTE FUNCTION notify_erp_purchase_order();

-- 10. ERP Sales Orders → أمر بيع
CREATE OR REPLACE FUNCTION notify_erp_sales_order() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_member RECORD;
BEGIN
  FOR v_member IN SELECT user_id FROM organization_members WHERE organization_id = NEW.organization_id AND status = 'active' LOOP
    INSERT INTO notifications(user_id, title, message, type, is_read)
    VALUES(v_member.user_id,
      CASE WHEN TG_OP='INSERT' THEN '💰 أمر بيع جديد' ELSE '💰 تحديث أمر بيع: ' || COALESCE(NEW.status,'') END,
      '', 'sales_order', false);
  END LOOP;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_erp_sales_order ON erp_sales_orders;
CREATE TRIGGER trg_notify_erp_sales_order AFTER INSERT OR UPDATE ON erp_sales_orders FOR EACH ROW EXECUTE FUNCTION notify_erp_sales_order();

-- 11. HR Employee Requests → طلب موظف
CREATE OR REPLACE FUNCTION notify_hr_employee_request() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_member RECORD;
BEGIN
  IF TG_OP = 'INSERT' THEN
    FOR v_member IN SELECT user_id FROM organization_members WHERE organization_id = NEW.organization_id AND status = 'active' AND can_manage_members = true LOOP
      INSERT INTO notifications(user_id, title, message, type, is_read)
      VALUES(v_member.user_id, '📋 طلب موظف جديد', 'طلب جديد يحتاج مراجعة', 'hr_request', false);
    END LOOP;
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.user_id IS NOT NULL THEN
    INSERT INTO notifications(user_id, title, message, type, is_read)
    VALUES(NEW.user_id,
      CASE WHEN NEW.status = 'approved' THEN '✅ تم الموافقة على طلبك' WHEN NEW.status = 'rejected' THEN '❌ تم رفض طلبك' ELSE '📋 تحديث طلبك: ' || NEW.status END,
      '', 'hr_request_status', false);
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_hr_employee_request ON hr_employee_requests;
CREATE TRIGGER trg_notify_hr_employee_request AFTER INSERT OR UPDATE ON hr_employee_requests FOR EACH ROW EXECUTE FUNCTION notify_hr_employee_request();

-- 12. Work Permits → تصاريح عمل
CREATE OR REPLACE FUNCTION notify_work_permit() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_member RECORD;
BEGIN
  FOR v_member IN SELECT user_id FROM organization_members WHERE organization_id = NEW.organization_id AND status = 'active' LOOP
    INSERT INTO notifications(user_id, title, message, type, is_read)
    VALUES(v_member.user_id,
      CASE WHEN TG_OP='INSERT' THEN '🔧 تصريح عمل جديد' ELSE '🔧 تحديث تصريح عمل: ' || COALESCE(NEW.status,'') END,
      '', 'work_permit', false);
  END LOOP;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_work_permit ON work_permits;
CREATE TRIGGER trg_notify_work_permit AFTER INSERT OR UPDATE ON work_permits FOR EACH ROW EXECUTE FUNCTION notify_work_permit();

-- 13. Marketplace Bids → مزايدة سوق
CREATE OR REPLACE FUNCTION notify_marketplace_bid() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_listing_org UUID;
BEGIN
  SELECT organization_id INTO v_listing_org FROM marketplace_listings WHERE id = NEW.listing_id;
  IF v_listing_org IS NOT NULL THEN
    DECLARE v_member RECORD;
    BEGIN
      FOR v_member IN SELECT user_id FROM organization_members WHERE organization_id = v_listing_org AND status = 'active' LOOP
        INSERT INTO notifications(user_id, title, message, type, is_read)
        VALUES(v_member.user_id, '💵 مزايدة جديدة على إعلانك', 'مزايدة بقيمة ' || COALESCE(NEW.bid_amount::text,'--'), 'marketplace_bid', false);
      END LOOP;
    END;
  END IF;
  -- إشعار المزايد بتحديث الحالة
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.created_by IS NOT NULL THEN
    INSERT INTO notifications(user_id, title, message, type, is_read)
    VALUES(NEW.created_by,
      CASE WHEN NEW.status = 'accepted' THEN '✅ تم قبول مزايدتك' WHEN NEW.status = 'rejected' THEN '❌ تم رفض مزايدتك' ELSE '📋 تحديث مزايدة: ' || NEW.status END,
      '', 'marketplace_bid_status', false);
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_marketplace_bid ON marketplace_bids;
CREATE TRIGGER trg_notify_marketplace_bid AFTER INSERT OR UPDATE ON marketplace_bids FOR EACH ROW EXECUTE FUNCTION notify_marketplace_bid();
