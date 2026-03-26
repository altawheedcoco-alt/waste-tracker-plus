
-- ========================================
-- 8. Collection Trips → إشعار رحلة جمع
-- ========================================
CREATE OR REPLACE FUNCTION notify_collection_trip() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_member RECORD;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.driver_id IS NOT NULL THEN
    INSERT INTO notifications(user_id, title, message, type, is_read)
    VALUES(NEW.driver_id, '🚛 رحلة جمع جديدة', 'تم تعيينك لرحلة جمع بتاريخ ' || COALESCE(NEW.trip_date::text,''), 'collection_trip_assigned', false);
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.organization_id IS NOT NULL THEN
      FOR v_member IN SELECT user_id FROM organization_members WHERE organization_id = NEW.organization_id AND status = 'active' LOOP
        INSERT INTO notifications(user_id, title, message, type, is_read)
        VALUES(v_member.user_id, '🚛 تحديث رحلة جمع', 'الحالة: ' || NEW.status || ' - إنجاز ' || COALESCE(NEW.completion_percent,0) || '%', 'collection_trip_status', false);
      END LOOP;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_collection_trip ON collection_trips;
CREATE TRIGGER trg_notify_collection_trip AFTER INSERT OR UPDATE ON collection_trips FOR EACH ROW EXECUTE FUNCTION notify_collection_trip();

-- ========================================
-- 9. Crisis Incidents → إشعار طوارئ
-- ========================================
CREATE OR REPLACE FUNCTION notify_crisis_incident() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_member RECORD;
BEGIN
  IF NEW.organization_id IS NOT NULL THEN
    FOR v_member IN SELECT user_id FROM organization_members WHERE organization_id = NEW.organization_id AND status = 'active' LOOP
      INSERT INTO notifications(user_id, title, message, type, is_read)
      VALUES(v_member.user_id, '🆘 حادث طوارئ: ' || COALESCE(NEW.severity,''), COALESCE(NEW.title, LEFT(COALESCE(NEW.description,'حادث جديد'),80)), 'crisis_incident', false);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_crisis_incident ON crisis_incidents;
CREATE TRIGGER trg_notify_crisis_incident AFTER INSERT ON crisis_incidents FOR EACH ROW EXECUTE FUNCTION notify_crisis_incident();

-- ========================================
-- 10. Corrective Actions → إشعار إجراء تصحيحي
-- ========================================
CREATE OR REPLACE FUNCTION notify_corrective_action() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.assigned_to IS NOT NULL THEN
    INSERT INTO notifications(user_id, title, message, type, is_read)
    VALUES(NEW.assigned_to, '⚡ إجراء تصحيحي مطلوب', COALESCE(NEW.title, LEFT(COALESCE(NEW.description,''),80)), 'corrective_action', false);
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_corrective_action ON corrective_actions;
CREATE TRIGGER trg_notify_corrective_action AFTER INSERT ON corrective_actions FOR EACH ROW EXECUTE FUNCTION notify_corrective_action();

-- ========================================
-- 11. Compliance Certificates → إشعار شهادة امتثال
-- ========================================
CREATE OR REPLACE FUNCTION notify_compliance_certificate() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_member RECORD;
BEGIN
  FOR v_member IN SELECT user_id FROM organization_members WHERE organization_id = NEW.organization_id AND status = 'active' LOOP
    INSERT INTO notifications(user_id, title, message, type, is_read)
    VALUES(v_member.user_id, 
      CASE WHEN TG_OP = 'INSERT' THEN '🏅 شهادة امتثال جديدة' ELSE '🏅 تحديث شهادة امتثال' END,
      COALESCE(NEW.certificate_level,'') || ' - ' || COALESCE(NEW.certificate_number,''), 'compliance_certificate', false);
  END LOOP;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_compliance_certificate ON compliance_certificates;
CREATE TRIGGER trg_notify_compliance_certificate AFTER INSERT OR UPDATE ON compliance_certificates FOR EACH ROW EXECUTE FUNCTION notify_compliance_certificate();

-- ========================================
-- 12. Carbon Credits → إشعار رصيد كربون
-- ========================================
CREATE OR REPLACE FUNCTION notify_carbon_credit() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_member RECORD;
BEGIN
  IF NEW.organization_id IS NOT NULL THEN
    FOR v_member IN SELECT user_id FROM organization_members WHERE organization_id = NEW.organization_id AND status = 'active' LOOP
      INSERT INTO notifications(user_id, title, message, type, is_read)
      VALUES(v_member.user_id, '🌱 رصيد كربون جديد', COALESCE(NEW.carbon_tons::text,'') || ' طن - ' || COALESCE(NEW.credit_type,''), 'carbon_credit', false);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_carbon_credit ON carbon_credits;
CREATE TRIGGER trg_notify_carbon_credit AFTER INSERT ON carbon_credits FOR EACH ROW EXECUTE FUNCTION notify_carbon_credit();

-- ========================================
-- 13. Broker Deals → إشعار صفقة وسيط
-- ========================================
CREATE OR REPLACE FUNCTION notify_broker_deal() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_member RECORD;
BEGIN
  IF NEW.organization_id IS NOT NULL THEN
    FOR v_member IN SELECT user_id FROM organization_members WHERE organization_id = NEW.organization_id AND status = 'active' LOOP
      INSERT INTO notifications(user_id, title, message, type, is_read)
      VALUES(v_member.user_id,
        CASE WHEN TG_OP='INSERT' THEN '💼 صفقة وسيط جديدة' ELSE '💼 تحديث صفقة وسيط' END,
        COALESCE(NEW.deal_name,'صفقة') || ' - ' || COALESCE(NEW.status,''), 'broker_deal', false);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_broker_deal ON broker_deals;
CREATE TRIGGER trg_notify_broker_deal AFTER INSERT OR UPDATE ON broker_deals FOR EACH ROW EXECUTE FUNCTION notify_broker_deal();

-- ========================================
-- 14. Disposal Certificates → إشعار شهادة تخلص
-- ========================================
CREATE OR REPLACE FUNCTION notify_disposal_certificate() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_member RECORD;
BEGIN
  IF NEW.organization_id IS NOT NULL THEN
    FOR v_member IN SELECT user_id FROM organization_members WHERE organization_id = NEW.organization_id AND status = 'active' LOOP
      INSERT INTO notifications(user_id, title, message, type, is_read)
      VALUES(v_member.user_id, '📜 شهادة تخلص جديدة', 'شهادة #' || COALESCE(NEW.certificate_number,'') || ' - ' || COALESCE(NEW.disposal_method,''), 'disposal_certificate', false);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_disposal_certificate ON disposal_certificates;
CREATE TRIGGER trg_notify_disposal_certificate AFTER INSERT ON disposal_certificates FOR EACH ROW EXECUTE FUNCTION notify_disposal_certificate();

-- ========================================
-- 15. Delivery Confirmations → إشعار تأكيد التسليم
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
