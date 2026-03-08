
-- =========================================================
-- Comprehensive Event Notification Triggers
-- WhatsApp trigger (trg_whatsapp_on_notification) fires automatically on every INSERT into notifications
-- =========================================================

-- 1. SHIPMENT CREATION → Notify transporter + destination
CREATE OR REPLACE FUNCTION public.trg_notify_shipment_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _ship_num text;
  _gen_name text;
  _gen_org_id uuid;
  _trans_org_id uuid;
  _recycler_org_id uuid;
BEGIN
  _ship_num := COALESCE(NEW.shipment_number, 'بدون رقم');
  _gen_org_id := (SELECT organization_id FROM profiles WHERE id = NEW.generator_id LIMIT 1);
  _trans_org_id := (SELECT organization_id FROM profiles WHERE id = NEW.transporter_id LIMIT 1);
  SELECT name INTO _gen_name FROM organizations WHERE id = _gen_org_id;
  _gen_name := COALESCE(_gen_name, 'مولّد');

  IF NEW.transporter_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, message, type, is_read, shipment_id, reference_id, reference_type)
    VALUES (NEW.transporter_id, '📦 شحنة جديدة #' || _ship_num,
      'تم إسناد شحنة جديدة إليكم من ' || _gen_name || ' - يرجى المراجعة والقبول',
      'new_shipment', false, NEW.id, NEW.id::text, 'shipment');
    IF _trans_org_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, title, message, type, is_read, shipment_id, reference_id, reference_type)
      SELECT p.id, '📦 شحنة جديدة #' || _ship_num, 'تم إسناد شحنة جديدة من ' || _gen_name,
        'new_shipment', false, NEW.id, NEW.id::text, 'shipment'
      FROM profiles p WHERE p.organization_id = _trans_org_id AND p.id != NEW.transporter_id AND p.is_active = true;
    END IF;
  END IF;

  IF NEW.recycler_id IS NOT NULL AND NEW.recycler_id IS DISTINCT FROM NEW.transporter_id THEN
    _recycler_org_id := (SELECT organization_id FROM profiles WHERE id = NEW.recycler_id LIMIT 1);
    IF _recycler_org_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, title, message, type, is_read, shipment_id, reference_id, reference_type)
      SELECT p.id, '📦 شحنة واردة #' || _ship_num, 'شحنة جديدة في الطريق إليكم من ' || _gen_name,
        'new_shipment', false, NEW.id, NEW.id::text, 'shipment'
      FROM profiles p WHERE p.organization_id = _recycler_org_id AND p.is_active = true;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_shipment_created_notify ON public.shipments;
CREATE TRIGGER trg_shipment_created_notify
  AFTER INSERT ON public.shipments FOR EACH ROW EXECUTE FUNCTION public.trg_notify_shipment_created();

-- 2. SHIPMENT CANCELLATION
CREATE OR REPLACE FUNCTION public.trg_notify_shipment_cancelled()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _ship_num text; _notify_ids uuid[];
BEGIN
  _ship_num := COALESCE(NEW.shipment_number, '');
  _notify_ids := ARRAY[]::uuid[];
  IF NEW.generator_id IS NOT NULL THEN _notify_ids := array_append(_notify_ids, NEW.generator_id); END IF;
  IF NEW.transporter_id IS NOT NULL THEN _notify_ids := array_append(_notify_ids, NEW.transporter_id); END IF;
  IF NEW.recycler_id IS NOT NULL THEN _notify_ids := array_append(_notify_ids, NEW.recycler_id); END IF;
  IF NEW.driver_id IS NOT NULL THEN _notify_ids := array_append(_notify_ids, NEW.driver_id); END IF;

  INSERT INTO notifications (user_id, title, message, type, is_read, shipment_id, reference_id, reference_type)
  SELECT DISTINCT unnest(_notify_ids), '❌ إلغاء الشحنة #' || _ship_num,
    'تم إلغاء الشحنة #' || _ship_num || '. السبب: ' || COALESCE(NEW.cancellation_reason, 'غير محدد'),
    'shipment_cancelled', false, NEW.id, NEW.id::text, 'shipment';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_shipment_cancelled_notify ON public.shipments;
CREATE TRIGGER trg_shipment_cancelled_notify
  AFTER UPDATE ON public.shipments FOR EACH ROW
  WHEN (NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled')
  EXECUTE FUNCTION public.trg_notify_shipment_cancelled();

-- 3. DRIVER CHANGE
CREATE OR REPLACE FUNCTION public.trg_notify_driver_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _ship_num text; _driver_name text; _notify_ids uuid[];
BEGIN
  _ship_num := COALESCE(NEW.shipment_number, '');
  SELECT full_name INTO _driver_name FROM profiles WHERE id = NEW.driver_id;
  _notify_ids := ARRAY[]::uuid[];
  IF NEW.generator_id IS NOT NULL THEN _notify_ids := array_append(_notify_ids, NEW.generator_id); END IF;
  IF NEW.recycler_id IS NOT NULL THEN _notify_ids := array_append(_notify_ids, NEW.recycler_id); END IF;

  INSERT INTO notifications (user_id, title, message, type, is_read, shipment_id, reference_id, reference_type)
  SELECT DISTINCT unnest(_notify_ids), '🔄 تغيير السائق - شحنة #' || _ship_num,
    'تم تغيير السائق للشحنة #' || _ship_num || ' إلى: ' || COALESCE(_driver_name, 'سائق جديد'),
    'driver_change', false, NEW.id, NEW.id::text, 'shipment';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_driver_change_notify ON public.shipments;
CREATE TRIGGER trg_driver_change_notify
  AFTER UPDATE ON public.shipments FOR EACH ROW
  WHEN (NEW.driver_id IS DISTINCT FROM OLD.driver_id AND NEW.driver_id IS NOT NULL)
  EXECUTE FUNCTION public.trg_notify_driver_change();

-- 4. WEIGHT DISCREPANCY
CREATE OR REPLACE FUNCTION public.trg_notify_weight_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _ship_num text; _diff numeric; _notify_ids uuid[];
BEGIN
  IF NEW.quantity IS NOT NULL AND NEW.quantity > 0 THEN
    _ship_num := COALESCE(NEW.shipment_number, '');
    _diff := ROUND(((NEW.actual_weight - NEW.quantity) / NEW.quantity * 100)::numeric, 1);
    _notify_ids := ARRAY[]::uuid[];
    IF NEW.generator_id IS NOT NULL THEN _notify_ids := array_append(_notify_ids, NEW.generator_id); END IF;
    IF NEW.transporter_id IS NOT NULL THEN _notify_ids := array_append(_notify_ids, NEW.transporter_id); END IF;
    IF NEW.recycler_id IS NOT NULL THEN _notify_ids := array_append(_notify_ids, NEW.recycler_id); END IF;

    INSERT INTO notifications (user_id, title, message, type, is_read, shipment_id, reference_id, reference_type)
    SELECT DISTINCT unnest(_notify_ids), '⚖️ تحديث الوزن - شحنة #' || _ship_num,
      'الوزن المتوقع: ' || NEW.quantity || ' كجم | الوزن الفعلي: ' || NEW.actual_weight || ' كجم | الفارق: ' || _diff || '%',
      'weight_update', false, NEW.id, NEW.id::text, 'shipment';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_weight_change_notify ON public.shipments;
CREATE TRIGGER trg_weight_change_notify
  AFTER UPDATE ON public.shipments FOR EACH ROW
  WHEN (NEW.actual_weight IS DISTINCT FROM OLD.actual_weight AND NEW.actual_weight IS NOT NULL)
  EXECUTE FUNCTION public.trg_notify_weight_change();

-- 5. PARTNERSHIP EVENTS
CREATE OR REPLACE FUNCTION public.trg_notify_partnership_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _org_name text; _partner_name text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT name INTO _org_name FROM organizations WHERE id = NEW.organization_id;
    INSERT INTO notifications (user_id, title, message, type, is_read, reference_id, reference_type)
    SELECT p.id, '🤝 طلب شراكة جديد', 'تلقيتم طلب ربط شراكة من "' || COALESCE(_org_name, 'جهة') || '"',
      'partnership_request', false, NEW.id::text, 'partner_link'
    FROM profiles p WHERE p.organization_id = NEW.partner_organization_id AND p.is_active = true;
  ELSIF TG_OP = 'UPDATE' THEN
    SELECT name INTO _org_name FROM organizations WHERE id = NEW.organization_id;
    SELECT name INTO _partner_name FROM organizations WHERE id = NEW.partner_organization_id;
    IF NEW.status = 'active' AND OLD.status IS DISTINCT FROM 'active' THEN
      INSERT INTO notifications (user_id, title, message, type, is_read, reference_id, reference_type)
      SELECT p.id, '✅ تم قبول طلب الشراكة', 'تم قبول طلب الشراكة مع "' || COALESCE(_partner_name, 'جهة') || '"',
        'partnership_accepted', false, NEW.id::text, 'partner_link'
      FROM profiles p WHERE p.organization_id = NEW.organization_id AND p.is_active = true;
    END IF;
    IF NEW.status = 'rejected' AND OLD.status IS DISTINCT FROM 'rejected' THEN
      INSERT INTO notifications (user_id, title, message, type, is_read, reference_id, reference_type)
      SELECT p.id, '❌ رفض طلب الشراكة', 'تم رفض طلب الشراكة مع "' || COALESCE(_partner_name, 'جهة') || '"',
        'partnership_rejected', false, NEW.id::text, 'partner_link'
      FROM profiles p WHERE p.organization_id = NEW.organization_id AND p.is_active = true;
    END IF;
    IF NEW.is_expired = true AND OLD.is_expired IS DISTINCT FROM true THEN
      INSERT INTO notifications (user_id, title, message, type, is_read, reference_id, reference_type)
      SELECT p.id, '⏰ انتهاء صلاحية الشراكة',
        'انتهت صلاحية الربط بين "' || COALESCE(_org_name, '') || '" و "' || COALESCE(_partner_name, '') || '"',
        'partnership_expired', false, NEW.id::text, 'partner_link'
      FROM profiles p WHERE p.organization_id IN (NEW.organization_id, NEW.partner_organization_id) AND p.is_active = true;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    SELECT name INTO _org_name FROM organizations WHERE id = OLD.organization_id;
    SELECT name INTO _partner_name FROM organizations WHERE id = OLD.partner_organization_id;
    INSERT INTO notifications (user_id, title, message, type, is_read, reference_id, reference_type)
    SELECT p.id, '🔗 فك ارتباط الشراكة',
      'تم فك الربط بين "' || COALESCE(_org_name, '') || '" و "' || COALESCE(_partner_name, '') || '"',
      'partnership_unlinked', false, OLD.id::text, 'partner_link'
    FROM profiles p WHERE p.organization_id IN (OLD.organization_id, OLD.partner_organization_id) AND p.is_active = true;
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_partnership_event_notify ON public.partner_links;
CREATE TRIGGER trg_partnership_event_notify
  AFTER INSERT OR UPDATE OR DELETE ON public.partner_links
  FOR EACH ROW EXECUTE FUNCTION public.trg_notify_partnership_event();

-- 6. ORG SUSPENSION/REACTIVATION → Notify partners
CREATE OR REPLACE FUNCTION public.trg_notify_org_suspension()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _org_name text; _partner record;
BEGIN
  _org_name := COALESCE(NEW.name, 'جهة');
  IF NEW.is_suspended = true AND OLD.is_suspended IS DISTINCT FROM true THEN
    FOR _partner IN
      SELECT DISTINCT partner_organization_id AS pid FROM partner_links WHERE organization_id = NEW.id AND status = 'active'
      UNION SELECT DISTINCT organization_id AS pid FROM partner_links WHERE partner_organization_id = NEW.id AND status = 'active'
    LOOP
      INSERT INTO notifications (user_id, title, message, type, is_read, reference_id, reference_type)
      SELECT p.id, '⛔ تعليق حساب شريك',
        'تم تعليق حساب "' || _org_name || '" - السبب: ' || COALESCE(NEW.suspension_reason, 'غير محدد'),
        'partner_suspended', false, NEW.id::text, 'organization'
      FROM profiles p WHERE p.organization_id = _partner.pid AND p.is_active = true;
    END LOOP;
  END IF;
  IF NEW.is_suspended = false AND OLD.is_suspended = true THEN
    FOR _partner IN
      SELECT DISTINCT partner_organization_id AS pid FROM partner_links WHERE organization_id = NEW.id AND status = 'active'
      UNION SELECT DISTINCT organization_id AS pid FROM partner_links WHERE partner_organization_id = NEW.id AND status = 'active'
    LOOP
      INSERT INTO notifications (user_id, title, message, type, is_read, reference_id, reference_type)
      SELECT p.id, '✅ إعادة تفعيل حساب شريك', 'تم إعادة تفعيل حساب "' || _org_name || '"',
        'partner_reactivated', false, NEW.id::text, 'organization'
      FROM profiles p WHERE p.organization_id = _partner.pid AND p.is_active = true;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_org_suspension_notify ON public.organizations;
CREATE TRIGGER trg_org_suspension_notify
  AFTER UPDATE ON public.organizations FOR EACH ROW
  WHEN (NEW.is_suspended IS DISTINCT FROM OLD.is_suspended)
  EXECUTE FUNCTION public.trg_notify_org_suspension();

-- 7. PARTNER RATING
CREATE OR REPLACE FUNCTION public.trg_notify_partner_rating()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _rater_name text;
BEGIN
  SELECT name INTO _rater_name FROM organizations WHERE id = NEW.rater_organization_id;
  INSERT INTO notifications (user_id, title, message, type, is_read, reference_id, reference_type)
  SELECT p.id, '⭐ تقييم جديد من شريك',
    'حصلتم على تقييم ' || NEW.overall_rating || '/5 من "' || COALESCE(_rater_name, 'شريك') || '"' ||
    CASE WHEN NEW.comment IS NOT NULL THEN ' - ' || LEFT(NEW.comment, 100) ELSE '' END,
    'partner_rating', false, NEW.id::text, 'partner_rating'
  FROM profiles p WHERE p.organization_id = NEW.rated_organization_id AND p.is_active = true;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_partner_rating_notify ON public.partner_ratings;
CREATE TRIGGER trg_partner_rating_notify
  AFTER INSERT ON public.partner_ratings FOR EACH ROW EXECUTE FUNCTION public.trg_notify_partner_rating();

-- 8. RECYCLER/GENERATOR APPROVAL STATUS (rejection handled here instead of enum)
CREATE OR REPLACE FUNCTION public.trg_notify_approval_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _ship_num text; _notify_ids uuid[];
BEGIN
  _ship_num := COALESCE(NEW.shipment_number, '');

  -- Recycler rejected
  IF NEW.recycler_approval_status = 'rejected' AND OLD.recycler_approval_status IS DISTINCT FROM 'rejected' THEN
    _notify_ids := ARRAY[]::uuid[];
    IF NEW.generator_id IS NOT NULL THEN _notify_ids := array_append(_notify_ids, NEW.generator_id); END IF;
    IF NEW.transporter_id IS NOT NULL THEN _notify_ids := array_append(_notify_ids, NEW.transporter_id); END IF;
    IF NEW.driver_id IS NOT NULL THEN _notify_ids := array_append(_notify_ids, NEW.driver_id); END IF;

    INSERT INTO notifications (user_id, title, message, type, is_read, shipment_id, reference_id, reference_type)
    SELECT DISTINCT unnest(_notify_ids), '🚫 رفض استلام الشحنة #' || _ship_num,
      'تم رفض استلام الشحنة من المستقبِل. السبب: ' || COALESCE(NEW.recycler_rejection_reason, 'غير محدد'),
      'shipment_rejected', false, NEW.id, NEW.id::text, 'shipment';
  END IF;

  -- Recycler approved
  IF NEW.recycler_approval_status = 'approved' AND OLD.recycler_approval_status IS DISTINCT FROM 'approved' THEN
    _notify_ids := ARRAY[]::uuid[];
    IF NEW.generator_id IS NOT NULL THEN _notify_ids := array_append(_notify_ids, NEW.generator_id); END IF;
    IF NEW.transporter_id IS NOT NULL THEN _notify_ids := array_append(_notify_ids, NEW.transporter_id); END IF;

    INSERT INTO notifications (user_id, title, message, type, is_read, shipment_id, reference_id, reference_type)
    SELECT DISTINCT unnest(_notify_ids), '✅ تم اعتماد الشحنة #' || _ship_num,
      'تم اعتماد استلام الشحنة من المستقبِل',
      'shipment_approved', false, NEW.id, NEW.id::text, 'shipment';
  END IF;

  -- Generator rejected
  IF NEW.generator_approval_status = 'rejected' AND OLD.generator_approval_status IS DISTINCT FROM 'rejected' THEN
    _notify_ids := ARRAY[]::uuid[];
    IF NEW.transporter_id IS NOT NULL THEN _notify_ids := array_append(_notify_ids, NEW.transporter_id); END IF;
    IF NEW.recycler_id IS NOT NULL THEN _notify_ids := array_append(_notify_ids, NEW.recycler_id); END IF;

    INSERT INTO notifications (user_id, title, message, type, is_read, shipment_id, reference_id, reference_type)
    SELECT DISTINCT unnest(_notify_ids), '🚫 رفض الشحنة من المولّد #' || _ship_num,
      'تم رفض الشحنة من المولّد. السبب: ' || COALESCE(NEW.generator_rejection_reason, 'غير محدد'),
      'shipment_rejected', false, NEW.id, NEW.id::text, 'shipment';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_approval_status_notify ON public.shipments;
CREATE TRIGGER trg_approval_status_notify
  AFTER UPDATE ON public.shipments FOR EACH ROW
  WHEN (NEW.recycler_approval_status IS DISTINCT FROM OLD.recycler_approval_status
     OR NEW.generator_approval_status IS DISTINCT FROM OLD.generator_approval_status)
  EXECUTE FUNCTION public.trg_notify_approval_status_change();

-- 9. DRIVER SIGNAL LOSS → Notify active shipment parties
CREATE OR REPLACE FUNCTION public.trg_notify_signal_loss_to_shipment_parties()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _driver_name text; _shipment record;
BEGIN
  IF NEW.is_online = false AND OLD.is_online = true THEN
    SELECT full_name INTO _driver_name FROM profiles WHERE id = NEW.driver_id;
    _driver_name := COALESCE(_driver_name, 'سائق');
    FOR _shipment IN
      SELECT id, shipment_number, generator_id, recycler_id FROM shipments
      WHERE driver_id = NEW.driver_id AND status IN ('in_transit', 'collecting', 'approved')
    LOOP
      IF _shipment.generator_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, title, message, type, is_read, shipment_id, reference_id, reference_type)
        VALUES (_shipment.generator_id, '⚠️ انقطاع إشارة السائق',
          'السائق ' || _driver_name || ' المسؤول عن شحنتكم #' || COALESCE(_shipment.shipment_number, '') || ' غير متصل حالياً',
          'signal_lost', false, _shipment.id, _shipment.id::text, 'shipment');
      END IF;
      IF _shipment.recycler_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, title, message, type, is_read, shipment_id, reference_id, reference_type)
        VALUES (_shipment.recycler_id, '⚠️ انقطاع إشارة السائق',
          'السائق ' || _driver_name || ' المتجه إليكم بالشحنة #' || COALESCE(_shipment.shipment_number, '') || ' غير متصل',
          'signal_lost', false, _shipment.id, _shipment.id::text, 'shipment');
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_signal_loss_shipment_notify ON public.driver_signal_status;
CREATE TRIGGER trg_signal_loss_shipment_notify
  AFTER UPDATE ON public.driver_signal_status FOR EACH ROW
  WHEN (NEW.is_online = false AND OLD.is_online = true)
  EXECUTE FUNCTION public.trg_notify_signal_loss_to_shipment_parties();

-- 10. SHIPMENT DISPUTE
CREATE OR REPLACE FUNCTION public.trg_notify_shipment_dispute()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _ship_num text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT shipment_number INTO _ship_num FROM shipments WHERE id = NEW.shipment_id;
    INSERT INTO notifications (user_id, title, message, type, is_read, reference_id, reference_type)
    SELECT p.id, '⚠️ نزاع جديد على الشحنة #' || COALESCE(_ship_num, ''),
      COALESCE(NEW.title, 'تم فتح نزاع جديد') || ' - الخطورة: ' || COALESCE(NEW.severity, 'عادي'),
      'dispute_opened', false, NEW.id::text, 'dispute'
    FROM profiles p WHERE p.organization_id = NEW.against_organization_id AND p.is_active = true;

    INSERT INTO notifications (user_id, title, message, type, is_read, reference_id, reference_type)
    SELECT p.id, '📋 تم تسجيل نزاعكم على الشحنة #' || COALESCE(_ship_num, ''),
      'تم فتح نزاع: ' || COALESCE(NEW.title, '') || ' وسيتم متابعته',
      'dispute_opened', false, NEW.id::text, 'dispute'
    FROM profiles p WHERE p.organization_id = NEW.raised_by_organization_id AND p.is_active = true;
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    SELECT shipment_number INTO _ship_num FROM shipments WHERE id = NEW.shipment_id;
    INSERT INTO notifications (user_id, title, message, type, is_read, reference_id, reference_type)
    SELECT p.id, '📋 تحديث النزاع - شحنة #' || COALESCE(_ship_num, ''),
      'تم تحديث حالة النزاع إلى: ' || NEW.status || CASE WHEN NEW.resolution IS NOT NULL THEN ' - ' || LEFT(NEW.resolution, 150) ELSE '' END,
      'dispute_updated', false, NEW.id::text, 'dispute'
    FROM profiles p WHERE p.organization_id IN (NEW.raised_by_organization_id, NEW.against_organization_id) AND p.is_active = true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_shipment_dispute_notify ON public.shipment_disputes;
CREATE TRIGGER trg_shipment_dispute_notify
  AFTER INSERT OR UPDATE ON public.shipment_disputes
  FOR EACH ROW EXECUTE FUNCTION public.trg_notify_shipment_dispute();

-- 11. LICENSE EXPIRY → Notify partners
CREATE OR REPLACE FUNCTION public.trg_notify_license_expiry_to_partners()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _partner record; _days_left int;
BEGIN
  IF NEW.license_expiry_date IS NOT NULL AND NEW.organization_type = 'transporter'
     AND (OLD.license_expiry_date IS NULL OR NEW.license_expiry_date IS DISTINCT FROM OLD.license_expiry_date) THEN
    _days_left := (NEW.license_expiry_date::date - CURRENT_DATE);
    IF _days_left <= 14 AND _days_left > 0 THEN
      FOR _partner IN
        SELECT DISTINCT partner_organization_id AS pid FROM partner_links WHERE organization_id = NEW.id AND status = 'active'
        UNION SELECT DISTINCT organization_id AS pid FROM partner_links WHERE partner_organization_id = NEW.id AND status = 'active'
      LOOP
        INSERT INTO notifications (user_id, title, message, type, is_read, reference_id, reference_type)
        SELECT p.id, '⚠️ ترخيص ناقل شريك ينتهي قريباً',
          'ترخيص النقل لشركة "' || COALESCE(NEW.name, '') || '" ينتهي خلال ' || _days_left || ' يوم',
          'partner_license_expiry', false, NEW.id::text, 'organization'
        FROM profiles p WHERE p.organization_id = _partner.pid AND p.is_active = true;
      END LOOP;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_license_expiry_partners_notify ON public.organizations;
CREATE TRIGGER trg_license_expiry_partners_notify
  AFTER UPDATE ON public.organizations FOR EACH ROW
  WHEN (NEW.license_expiry_date IS DISTINCT FROM OLD.license_expiry_date)
  EXECUTE FUNCTION public.trg_notify_license_expiry_to_partners();

-- 12. COMPLIANCE VIOLATION
CREATE OR REPLACE FUNCTION public.trg_notify_compliance_violation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _ship_num text;
BEGIN
  IF NEW.event_type IN ('violation', 'non_compliance', 'waste_mismatch', 'license_mismatch') THEN
    IF NEW.shipment_id IS NOT NULL THEN
      SELECT shipment_number INTO _ship_num FROM shipments WHERE id = NEW.shipment_id;
    END IF;
    INSERT INTO notifications (user_id, title, message, type, is_read, reference_id, reference_type)
    SELECT p.id,
      '🚨 مخالفة امتثال' || CASE WHEN _ship_num IS NOT NULL THEN ' - شحنة #' || _ship_num ELSE '' END,
      COALESCE(NEW.description, 'تم رصد مخالفة امتثال') ||
      CASE WHEN NEW.severity IS NOT NULL THEN ' | الخطورة: ' || NEW.severity ELSE '' END,
      'compliance_violation', false, NEW.id::text, 'wmis_event'
    FROM profiles p WHERE p.organization_id = NEW.organization_id AND p.is_active = true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_compliance_violation_notify ON public.wmis_events;
CREATE TRIGGER trg_compliance_violation_notify
  AFTER INSERT ON public.wmis_events FOR EACH ROW
  WHEN (NEW.event_type IN ('violation', 'non_compliance', 'waste_mismatch', 'license_mismatch'))
  EXECUTE FUNCTION public.trg_notify_compliance_violation();

-- 13. SHIPMENT DELAY
CREATE OR REPLACE FUNCTION public.trg_notify_shipment_delay()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _ship_num text; _notify_ids uuid[];
BEGIN
  _ship_num := COALESCE(NEW.shipment_number, '');
  _notify_ids := ARRAY[]::uuid[];
  IF NEW.generator_id IS NOT NULL THEN _notify_ids := array_append(_notify_ids, NEW.generator_id); END IF;
  IF NEW.transporter_id IS NOT NULL THEN _notify_ids := array_append(_notify_ids, NEW.transporter_id); END IF;
  IF NEW.recycler_id IS NOT NULL THEN _notify_ids := array_append(_notify_ids, NEW.recycler_id); END IF;

  INSERT INTO notifications (user_id, title, message, type, is_read, shipment_id, reference_id, reference_type)
  SELECT DISTINCT unnest(_notify_ids), '⏰ تأخر الشحنة #' || _ship_num,
    'الشحنة #' || _ship_num || ' متأخرة عن الموعد المحدد. السبب: ' || COALESCE(NEW.delay_reason, 'غير محدد'),
    'shipment_delayed', false, NEW.id, NEW.id::text, 'shipment';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_shipment_delay_notify ON public.shipments;
CREATE TRIGGER trg_shipment_delay_notify
  AFTER UPDATE ON public.shipments FOR EACH ROW
  WHEN (NEW.delay_notified = true AND OLD.delay_notified IS DISTINCT FROM true)
  EXECUTE FUNCTION public.trg_notify_shipment_delay();
