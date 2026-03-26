
-- ========================================
-- 1. Direct Messages → إشعار للمنظمة المستقبلة
-- ========================================
CREATE OR REPLACE FUNCTION notify_direct_message() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_sender_name TEXT; v_member RECORD;
BEGIN
  SELECT name INTO v_sender_name FROM organizations WHERE id = NEW.sender_organization_id;
  FOR v_member IN SELECT user_id FROM organization_members WHERE organization_id = NEW.receiver_organization_id AND status = 'active' LOOP
    INSERT INTO notifications(user_id, title, message, type, is_read)
    VALUES(v_member.user_id, '💬 رسالة جديدة من ' || COALESCE(v_sender_name,'جهة'), LEFT(NEW.content, 100), 'direct_message', false);
  END LOOP;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_direct_message ON direct_messages;
CREATE TRIGGER trg_notify_direct_message AFTER INSERT ON direct_messages FOR EACH ROW EXECUTE FUNCTION notify_direct_message();

-- ========================================
-- 2. Citizen Complaints → إشعار للمنظمة + المعين
-- ========================================
CREATE OR REPLACE FUNCTION notify_citizen_complaint() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_member RECORD;
BEGIN
  IF TG_OP = 'INSERT' THEN
    FOR v_member IN SELECT user_id FROM organization_members WHERE organization_id = NEW.organization_id AND status = 'active' LOOP
      INSERT INTO notifications(user_id, title, message, type, is_read)
      VALUES(v_member.user_id, '🚨 شكوى مواطن جديدة #' || COALESCE(NEW.complaint_number,''), COALESCE(NEW.complaint_type,'') || ': ' || LEFT(COALESCE(NEW.description,''), 80), 'citizen_complaint', false);
    END LOOP;
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.assigned_to IS NOT NULL THEN
      INSERT INTO notifications(user_id, title, message, type, is_read)
      VALUES(NEW.assigned_to, '📋 تحديث شكوى #' || COALESCE(NEW.complaint_number,''), 'تم تغيير الحالة إلى: ' || NEW.status, 'complaint_status', false);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_citizen_complaint ON citizen_complaints;
CREATE TRIGGER trg_notify_citizen_complaint AFTER INSERT OR UPDATE ON citizen_complaints FOR EACH ROW EXECUTE FUNCTION notify_citizen_complaint();

-- ========================================
-- 3. Contracts → إشعار عقد جديد / تحديث
-- ========================================
CREATE OR REPLACE FUNCTION notify_contract_change() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_member RECORD;
BEGIN
  IF TG_OP = 'INSERT' THEN
    FOR v_member IN SELECT user_id FROM organization_members WHERE organization_id = NEW.organization_id AND status = 'active' LOOP
      INSERT INTO notifications(user_id, title, message, type, is_read)
      VALUES(v_member.user_id, '📝 عقد جديد', COALESCE(NEW.title, 'عقد جديد'), 'contract_created', false);
    END LOOP;
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    FOR v_member IN SELECT user_id FROM organization_members WHERE organization_id = NEW.organization_id AND status = 'active' LOOP
      INSERT INTO notifications(user_id, title, message, type, is_read)
      VALUES(v_member.user_id, '📝 تحديث عقد', 'تم تغيير حالة العقد إلى: ' || NEW.status, 'contract_status', false);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_contract_change ON contracts;
CREATE TRIGGER trg_notify_contract_change AFTER INSERT OR UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION notify_contract_change();

-- ========================================
-- 4. B2B Deals → إشعار للبائع والمشتري
-- ========================================
CREATE OR REPLACE FUNCTION notify_b2b_deal() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_member RECORD;
BEGIN
  IF TG_OP = 'INSERT' THEN
    FOR v_member IN SELECT user_id FROM organization_members WHERE organization_id = NEW.seller_organization_id AND status = 'active' LOOP
      INSERT INTO notifications(user_id, title, message, type, is_read)
      VALUES(v_member.user_id, '🤝 صفقة B2B جديدة', COALESCE(NEW.title,'صفقة') || ' - ' || COALESCE(NEW.deal_number,''), 'b2b_deal_new', false);
    END LOOP;
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    -- Notify both sides
    FOR v_member IN SELECT user_id FROM organization_members WHERE organization_id IN (NEW.seller_organization_id, NEW.buyer_organization_id) AND status = 'active' LOOP
      INSERT INTO notifications(user_id, title, message, type, is_read)
      VALUES(v_member.user_id, '🤝 تحديث صفقة #' || COALESCE(NEW.deal_number,''), 'الحالة: ' || NEW.status, 'b2b_deal_status', false);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_b2b_deal ON b2b_deals;
CREATE TRIGGER trg_notify_b2b_deal AFTER INSERT OR UPDATE ON b2b_deals FOR EACH ROW EXECUTE FUNCTION notify_b2b_deal();

-- ========================================
-- 5. B2B Requests → إشعار طلب جديد
-- ========================================
CREATE OR REPLACE FUNCTION notify_b2b_request() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_member RECORD;
BEGIN
  FOR v_member IN SELECT user_id FROM organization_members WHERE organization_id = NEW.organization_id AND status = 'active' LOOP
    INSERT INTO notifications(user_id, title, message, type, is_read)
    VALUES(v_member.user_id, '📦 طلب B2B جديد', COALESCE(NEW.title,'طلب') || ' - ' || COALESCE(NEW.waste_type,''), 'b2b_request', false);
  END LOOP;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_b2b_request ON b2b_requests;
CREATE TRIGGER trg_notify_b2b_request AFTER INSERT ON b2b_requests FOR EACH ROW EXECUTE FUNCTION notify_b2b_request();

-- ========================================
-- 6. Delivery Confirmations → إشعار تأكيد التسليم
-- ========================================
CREATE OR REPLACE FUNCTION notify_delivery_confirmation() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_ship RECORD; v_member RECORD;
BEGIN
  SELECT generator_id, transporter_id, recycler_id FROM shipments WHERE id = NEW.shipment_id INTO v_ship;
  IF v_ship IS NOT NULL THEN
    FOR v_member IN
      SELECT DISTINCT user_id FROM organization_members 
      WHERE organization_id IN (v_ship.generator_id, v_ship.transporter_id, v_ship.recycler_id) 
      AND organization_id IS NOT NULL AND status = 'active'
    LOOP
      INSERT INTO notifications(user_id, title, message, type, shipment_id, is_read)
      VALUES(v_member.user_id, '✅ تأكيد تسليم شحنة', 'تم تأكيد تسليم الشحنة بنجاح', 'delivery_confirmed', NEW.shipment_id, false);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_delivery_confirmation ON delivery_confirmations;
CREATE TRIGGER trg_notify_delivery_confirmation AFTER INSERT ON delivery_confirmations FOR EACH ROW EXECUTE FUNCTION notify_delivery_confirmation();

-- ========================================
-- 7. Geofence Alerts → إشعار تنبيه جغرافي
-- ========================================
CREATE OR REPLACE FUNCTION notify_geofence_alert() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_member RECORD;
BEGIN
  IF NEW.organization_id IS NOT NULL AND NEW.severity IN ('critical','warning') THEN
    FOR v_member IN SELECT user_id FROM organization_members WHERE organization_id = NEW.organization_id AND status = 'active' LOOP
      INSERT INTO notifications(user_id, title, message, type, shipment_id, is_read)
      VALUES(v_member.user_id,
        CASE WHEN NEW.severity = 'critical' THEN '🚨 تنبيه جغرافي حرج' ELSE '⚠️ تنبيه جغرافي' END,
        COALESCE(NEW.message, NEW.alert_type), 'geofence_alert', NEW.shipment_id, false);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_geofence_alert ON geofence_alerts;
CREATE TRIGGER trg_notify_geofence_alert AFTER INSERT ON geofence_alerts FOR EACH ROW EXECUTE FUNCTION notify_geofence_alert();
