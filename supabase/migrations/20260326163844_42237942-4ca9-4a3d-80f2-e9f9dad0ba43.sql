
-- ========================================
-- 7. Waste Auction status change → notify bidders
-- ========================================
CREATE OR REPLACE FUNCTION public.notify_waste_auction_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  bidder_rec RECORD;
  status_label text;
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;
  status_label := CASE NEW.status
    WHEN 'active' THEN 'مفتوح للمزايدة' WHEN 'closed' THEN 'مغلق'
    WHEN 'awarded' THEN 'تم الترسية' WHEN 'cancelled' THEN 'ملغي'
    ELSE NEW.status END;

  -- Notify all bidders
  FOR bidder_rec IN
    SELECT DISTINCT ab.bidder_id as user_id FROM auction_bids ab WHERE ab.auction_id = NEW.id
  LOOP
    INSERT INTO notifications (user_id, title, message, type, is_read, reference_id, reference_type)
    VALUES (bidder_rec.user_id, '🏷️ تحديث المزاد', 'تم تحديث حالة المزاد إلى: ' || status_label, 'auction_status', false, NEW.id, 'waste_auction');
  END LOOP;

  -- Notify org members
  FOR bidder_rec IN
    SELECT DISTINCT p.id as user_id FROM profiles p WHERE p.organization_id = NEW.organization_id
  LOOP
    INSERT INTO notifications (user_id, title, message, type, is_read, reference_id, reference_type)
    VALUES (bidder_rec.user_id, '🏷️ تحديث المزاد', 'تم تحديث حالة المزاد إلى: ' || status_label, 'auction_status', false, NEW.id, 'waste_auction');
  END LOOP;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_waste_auction_status ON waste_auctions;
CREATE TRIGGER trg_notify_waste_auction_status AFTER UPDATE ON waste_auctions FOR EACH ROW EXECUTE FUNCTION notify_waste_auction_status();

-- ========================================
-- 8. Shipment Dispute → notify all shipment parties
-- ========================================
CREATE OR REPLACE FUNCTION public.notify_shipment_dispute_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  member_rec RECORD;
  ship RECORD;
  org_ids uuid[];
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status = NEW.status THEN RETURN NEW; END IF;

  SELECT generator_id, transporter_id, recycler_id, disposal_facility_id, shipment_number
  INTO ship FROM shipments WHERE id = NEW.shipment_id;

  org_ids := ARRAY[]::uuid[];
  IF ship.generator_id IS NOT NULL THEN org_ids := org_ids || ship.generator_id; END IF;
  IF ship.transporter_id IS NOT NULL THEN org_ids := org_ids || ship.transporter_id; END IF;
  IF ship.recycler_id IS NOT NULL THEN org_ids := org_ids || ship.recycler_id; END IF;
  IF ship.disposal_facility_id IS NOT NULL THEN org_ids := org_ids || ship.disposal_facility_id; END IF;

  FOR member_rec IN
    SELECT DISTINCT p.id as user_id FROM profiles p WHERE p.organization_id = ANY(org_ids)
  LOOP
    INSERT INTO notifications (user_id, title, message, type, is_read, shipment_id, reference_id, reference_type)
    VALUES (member_rec.user_id,
      CASE WHEN TG_OP = 'INSERT' THEN '⚠️ نزاع جديد على شحنة' ELSE '📋 تحديث نزاع الشحنة' END,
      'شحنة ' || COALESCE(ship.shipment_number, '') || ' - الحالة: ' || NEW.status,
      'shipment_dispute', false, NEW.shipment_id, NEW.id, 'shipment_dispute');
  END LOOP;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_dispute_change ON shipment_disputes;
CREATE TRIGGER trg_notify_dispute_change AFTER INSERT OR UPDATE ON shipment_disputes FOR EACH ROW EXECUTE FUNCTION notify_shipment_dispute_status();

-- ========================================
-- 9. Operational Plan → notify org members (already exists but let's ensure status change too)
-- ========================================
CREATE OR REPLACE FUNCTION public.notify_operational_plan_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  member_rec RECORD;
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;

  FOR member_rec IN
    SELECT DISTINCT p.id as user_id FROM profiles p WHERE p.organization_id = NEW.organization_id
  LOOP
    INSERT INTO notifications (user_id, title, message, type, is_read, reference_id, reference_type)
    VALUES (member_rec.user_id, '📋 تحديث الخطة التشغيلية', 'تم تحديث حالة الخطة إلى: ' || NEW.status, 'operational_plan', false, NEW.id, 'operational_plan');
  END LOOP;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_operational_plan_status ON operational_plans;
CREATE TRIGGER trg_notify_operational_plan_status AFTER UPDATE ON operational_plans FOR EACH ROW EXECUTE FUNCTION notify_operational_plan_status();

-- ========================================
-- 10. Driver Mission Offer response → notify org
-- ========================================
CREATE OR REPLACE FUNCTION public.notify_driver_mission_response()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  member_rec RECORD;
  driver_name text;
  ship RECORD;
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;
  IF NEW.status NOT IN ('accepted','rejected','expired') THEN RETURN NEW; END IF;

  SELECT full_name INTO driver_name FROM profiles p
  JOIN driver_profiles dp ON dp.user_id = p.id WHERE dp.id = NEW.driver_id;
  driver_name := COALESCE(driver_name, 'سائق');

  SELECT transporter_id, shipment_number INTO ship FROM shipments WHERE id = NEW.shipment_id;

  IF ship.transporter_id IS NOT NULL THEN
    FOR member_rec IN
      SELECT DISTINCT p.id as user_id FROM profiles p
      JOIN organization_members om ON om.organization_id = ship.transporter_id AND (om.profile_id = p.id OR om.user_id = p.id)
      WHERE om.member_role IN ('owner','admin','manager')
    LOOP
      INSERT INTO notifications (user_id, title, message, type, is_read, shipment_id, reference_id, reference_type)
      VALUES (member_rec.user_id,
        CASE NEW.status WHEN 'accepted' THEN '✅ ' || driver_name || ' قبل المهمة' WHEN 'rejected' THEN '❌ ' || driver_name || ' رفض المهمة' ELSE '⏰ انتهت مهلة العرض' END,
        'شحنة ' || COALESCE(ship.shipment_number, ''), 'mission_response', false, NEW.shipment_id, NEW.id, 'driver_mission');
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_driver_mission_response ON driver_mission_offers;
CREATE TRIGGER trg_notify_driver_mission_response AFTER UPDATE ON driver_mission_offers FOR EACH ROW EXECUTE FUNCTION notify_driver_mission_response();

-- ========================================
-- 11. Signing Request rejected → notify requester
-- ========================================
CREATE OR REPLACE FUNCTION public.notify_signing_rejected()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;
  IF NEW.status != 'rejected' THEN RETURN NEW; END IF;
  IF NEW.requested_by IS NULL THEN RETURN NEW; END IF;

  INSERT INTO notifications (user_id, title, message, type, is_read, reference_id, reference_type)
  VALUES (NEW.requested_by, '❌ تم رفض طلب التوقيع', 'تم رفض طلب التوقيع على المستند', 'signing_rejected', false, NEW.id, 'signing_request');
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_signing_rejected ON signing_requests;
CREATE TRIGGER trg_notify_signing_rejected AFTER UPDATE ON signing_requests FOR EACH ROW EXECUTE FUNCTION notify_signing_rejected();

-- ========================================
-- 12. Document Signature rejected → notify document owner
-- ========================================
CREATE OR REPLACE FUNCTION public.notify_doc_signature_rejected()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  doc_owner uuid;
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;
  IF NEW.status != 'rejected' THEN RETURN NEW; END IF;

  SELECT created_by INTO doc_owner FROM shipment_doc_signatures WHERE id = NEW.id;
  IF doc_owner IS NULL THEN RETURN NEW; END IF;

  INSERT INTO notifications (user_id, title, message, type, is_read, reference_id, reference_type)
  VALUES (doc_owner, '❌ رفض توقيع مستند', 'تم رفض التوقيع على أحد المستندات', 'signature_rejected', false, NEW.id, 'document_signature');
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_doc_signature_rejected ON document_signatures;
CREATE TRIGGER trg_notify_doc_signature_rejected AFTER UPDATE ON document_signatures FOR EACH ROW EXECUTE FUNCTION notify_doc_signature_rejected();
