
-- ========================================
-- السائقين: إشعارات شاملة
-- ========================================

-- 1. Driver Ratings → إشعار تقييم سائق
CREATE OR REPLACE FUNCTION notify_driver_rating() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO notifications(user_id, title, message, type, shipment_id, is_read)
  VALUES(NEW.driver_id, '⭐ تقييم جديد', 'حصلت على تقييم ' || COALESCE(NEW.overall_rating::text,'') || '/5', 'driver_rating', NEW.shipment_id, false);
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_driver_rating ON driver_ratings;
CREATE TRIGGER trg_notify_driver_rating AFTER INSERT ON driver_ratings FOR EACH ROW EXECUTE FUNCTION notify_driver_rating();

-- 2. Driver Wallet Transactions → إشعار حركة محفظة
CREATE OR REPLACE FUNCTION notify_driver_wallet_tx() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO notifications(user_id, title, message, type, is_read)
  VALUES(NEW.driver_id,
    CASE WHEN NEW.points > 0 THEN '💰 إضافة نقاط' ELSE '💸 خصم نقاط' END,
    COALESCE(NEW.description,'حركة محفظة') || ' (' || NEW.points || ' نقطة)', 'driver_wallet', false);
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_driver_wallet_tx ON driver_wallet_transactions;
CREATE TRIGGER trg_notify_driver_wallet_tx AFTER INSERT ON driver_wallet_transactions FOR EACH ROW EXECUTE FUNCTION notify_driver_wallet_tx();

-- 3. Driver Emergencies → إشعار طوارئ سائق
CREATE OR REPLACE FUNCTION notify_driver_emergency() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_member RECORD;
BEGIN
  -- إشعار السائق
  INSERT INTO notifications(user_id, title, message, type, is_read)
  VALUES(NEW.driver_id, '🆘 تم تسجيل حالة طوارئ', 'الحالة: ' || COALESCE(NEW.status,''), 'driver_emergency', false);
  -- إشعار المديرين
  IF NEW.organization_id IS NOT NULL THEN
    FOR v_member IN SELECT user_id FROM organization_members WHERE organization_id = NEW.organization_id AND status = 'active' AND can_manage_members = true LOOP
      INSERT INTO notifications(user_id, title, message, type, is_read)
      VALUES(v_member.user_id, '🚨 طوارئ سائق!', 'سائق أبلغ عن حالة طوارئ', 'driver_emergency_admin', false);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_driver_emergency ON driver_emergencies;
CREATE TRIGGER trg_notify_driver_emergency AFTER INSERT ON driver_emergencies FOR EACH ROW EXECUTE FUNCTION notify_driver_emergency();

-- 4. Driver Smart Alerts → إشعار تنبيه ذكي
CREATE OR REPLACE FUNCTION notify_driver_smart_alert() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_member RECORD;
BEGIN
  -- إشعار السائق
  INSERT INTO notifications(user_id, title, message, type, is_read)
  VALUES(NEW.driver_id,
    CASE WHEN NEW.severity = 'critical' THEN '🚨 تنبيه حرج' WHEN NEW.severity = 'warning' THEN '⚠️ تنبيه تحذيري' ELSE 'ℹ️ تنبيه' END,
    COALESCE(NEW.alert_type,'تنبيه ذكي'), 'driver_smart_alert', false);
  -- إشعار المديرين للتنبيهات الحرجة
  IF NEW.severity = 'critical' AND NEW.organization_id IS NOT NULL THEN
    FOR v_member IN SELECT user_id FROM organization_members WHERE organization_id = NEW.organization_id AND status = 'active' AND can_manage_members = true LOOP
      INSERT INTO notifications(user_id, title, message, type, is_read)
      VALUES(v_member.user_id, '🚨 تنبيه سائق حرج', COALESCE(NEW.alert_type,''), 'driver_alert_admin', false);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_driver_smart_alert ON driver_smart_alerts;
CREATE TRIGGER trg_notify_driver_smart_alert AFTER INSERT ON driver_smart_alerts FOR EACH ROW EXECUTE FUNCTION notify_driver_smart_alert();

-- 5. Driver Shipment Offers → إشعار عرض شحنة للسائق المستقل
CREATE OR REPLACE FUNCTION notify_driver_shipment_offer() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO notifications(user_id, title, message, type, is_read)
    VALUES(NEW.driver_id, '🚛 عرض شحنة جديد', 'لديك عرض شحنة جديد من ناقل', 'shipment_offer', false);
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    -- إشعار الناقل برد السائق
    IF NEW.organization_id IS NOT NULL THEN
      DECLARE v_member RECORD;
      BEGIN
        FOR v_member IN SELECT user_id FROM organization_members WHERE organization_id = NEW.organization_id AND status = 'active' LOOP
          INSERT INTO notifications(user_id, title, message, type, is_read)
          VALUES(v_member.user_id,
            CASE WHEN NEW.status = 'accepted' THEN '✅ سائق قبل العرض' ELSE '❌ سائق رفض العرض' END,
            'رد السائق على عرض الشحنة', 'shipment_offer_response', false);
        END LOOP;
      END;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_driver_shipment_offer ON driver_shipment_offers;
CREATE TRIGGER trg_notify_driver_shipment_offer AFTER INSERT OR UPDATE ON driver_shipment_offers FOR EACH ROW EXECUTE FUNCTION notify_driver_shipment_offer();

-- 6. Driver Shipment Bids → إشعار مزايدة سائق
CREATE OR REPLACE FUNCTION notify_driver_shipment_bid() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO notifications(user_id, title, message, type, is_read)
    VALUES(NEW.driver_id,
      CASE WHEN NEW.status = 'accepted' THEN '✅ تم قبول مزايدتك' WHEN NEW.status = 'rejected' THEN '❌ تم رفض مزايدتك' ELSE '📋 تحديث مزايدة: ' || NEW.status END,
      'تم تحديث حالة مزايدتك على الشحنة', 'shipment_bid_status', false);
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_driver_shipment_bid ON driver_shipment_bids;
CREATE TRIGGER trg_notify_driver_shipment_bid AFTER UPDATE ON driver_shipment_bids FOR EACH ROW EXECUTE FUNCTION notify_driver_shipment_bid();

-- 7. Driver Hire Contracts → إشعار عقد تأجير سائق
CREATE OR REPLACE FUNCTION notify_driver_hire_contract() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO notifications(user_id, title, message, type, is_read)
  VALUES(NEW.driver_id,
    CASE WHEN TG_OP='INSERT' THEN '📋 عقد تأجير جديد' ELSE '📋 تحديث عقد تأجير: ' || COALESCE(NEW.status,'') END,
    'تم ' || CASE WHEN TG_OP='INSERT' THEN 'إنشاء' ELSE 'تحديث' END || ' عقد تأجير', 'hire_contract', false);
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_driver_hire_contract ON driver_hire_contracts;
CREATE TRIGGER trg_notify_driver_hire_contract AFTER INSERT OR UPDATE ON driver_hire_contracts FOR EACH ROW EXECUTE FUNCTION notify_driver_hire_contract();

-- 8. Driver Compliance Docs → إشعار مستند امتثال
CREATE OR REPLACE FUNCTION notify_driver_compliance_doc() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_member RECORD;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO notifications(user_id, title, message, type, is_read)
    VALUES(NEW.driver_id,
      CASE WHEN NEW.status = 'approved' THEN '✅ تم اعتماد مستندك' WHEN NEW.status = 'rejected' THEN '❌ تم رفض مستندك' ELSE '📄 تحديث مستند: ' || NEW.status END,
      'تم تحديث حالة مستند الامتثال', 'compliance_doc_status', false);
    -- إشعار المنظمة
    IF NEW.organization_id IS NOT NULL THEN
      FOR v_member IN SELECT user_id FROM organization_members WHERE organization_id = NEW.organization_id AND status = 'active' AND can_manage_members = true LOOP
        INSERT INTO notifications(user_id, title, message, type, is_read)
        VALUES(v_member.user_id, '📄 تحديث مستند سائق', 'حالة مستند الامتثال: ' || NEW.status, 'compliance_doc_admin', false);
      END LOOP;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_driver_compliance_doc ON driver_compliance_docs;
CREATE TRIGGER trg_notify_driver_compliance_doc AFTER UPDATE ON driver_compliance_docs FOR EACH ROW EXECUTE FUNCTION notify_driver_compliance_doc();

-- 9. Driver Financial Transactions → إشعار حركة مالية
CREATE OR REPLACE FUNCTION notify_driver_financial_tx() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO notifications(user_id, title, message, type, is_read)
  VALUES(NEW.driver_id, '💳 حركة مالية جديدة', COALESCE(NEW.description,'حركة مالية'), 'driver_financial', false);
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_driver_financial_tx ON driver_financial_transactions;
CREATE TRIGGER trg_notify_driver_financial_tx AFTER INSERT ON driver_financial_transactions FOR EACH ROW EXECUTE FUNCTION notify_driver_financial_tx();

-- 10. Driver Copilot Tasks → إشعار مهمة ذكية
CREATE OR REPLACE FUNCTION notify_driver_copilot_task() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO notifications(user_id, title, message, type, is_read)
    VALUES(NEW.driver_id, '🤖 مهمة ذكية جديدة', 'لديك مهمة جديدة من المساعد الذكي', 'copilot_task', false);
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_driver_copilot_task ON driver_copilot_tasks;
CREATE TRIGGER trg_notify_driver_copilot_task AFTER INSERT ON driver_copilot_tasks FOR EACH ROW EXECUTE FUNCTION notify_driver_copilot_task();
