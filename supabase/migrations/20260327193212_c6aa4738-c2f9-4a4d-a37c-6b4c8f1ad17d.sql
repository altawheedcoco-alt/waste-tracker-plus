
-- ══════════════════════════════════════════════════════════════
-- fn_auto_notify: Auto-create notifications on table changes
-- Covers: shipments, contracts, invoices, organization_members,
--         entity_documents, driver_profiles, verified_partnerships
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.fn_auto_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_type TEXT;
  v_title TEXT;
  v_message TEXT;
  v_priority TEXT := 'normal';
  v_ship_id TEXT;
  v_org_id TEXT;
  v_target_ids UUID[];
  v_meta JSONB := '{}'::jsonb;
  v_uid UUID;
BEGIN
  -- ─── SHIPMENTS ───
  IF TG_TABLE_NAME = 'shipments' AND TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      v_ship_id := NEW.id;
      v_org_id := COALESCE(NEW.generator_id, NEW.transporter_id);
      
      -- Map status to notification type
      v_type := CASE NEW.status
        WHEN 'approved' THEN 'shipment_approved'
        WHEN 'rejected' THEN 'shipment_rejected'
        WHEN 'cancelled' THEN 'shipment_cancelled'
        WHEN 'confirmed' THEN 'shipment_confirmed'
        WHEN 'delivered' THEN 'shipment_delivered'
        WHEN 'in_transit' THEN 'shipment_assigned'
        WHEN 'pickup_in_progress' THEN 'pickup_started'
        WHEN 'picked_up' THEN 'pickup_completed'
        WHEN 'delivery_in_progress' THEN 'delivery_started'
        WHEN 'disputed' THEN 'shipment_disputed'
        ELSE 'status_update'
      END;

      v_title := CASE NEW.status
        WHEN 'approved' THEN '✅ تمت الموافقة على الشحنة'
        WHEN 'rejected' THEN '❌ تم رفض الشحنة'
        WHEN 'cancelled' THEN '🚫 تم إلغاء الشحنة'
        WHEN 'confirmed' THEN '✅ تم تأكيد الشحنة'
        WHEN 'delivered' THEN '📍 تم تسليم الشحنة'
        WHEN 'disputed' THEN '⚠️ نزاع على الشحنة'
        ELSE '🔄 تحديث حالة الشحنة'
      END;

      v_message := 'شحنة #' || COALESCE(NEW.shipment_number, LEFT(NEW.id::text, 8));
      
      IF NEW.status IN ('disputed', 'rejected', 'cancelled') THEN
        v_priority := 'high';
      END IF;

      -- Collect all org member IDs
      SELECT array_agg(DISTINCT id) INTO v_target_ids
      FROM profiles
      WHERE organization_id IN (
        SELECT unnest(ARRAY[NEW.generator_id, NEW.transporter_id, NEW.recycler_id, NEW.disposal_facility_id])
        WHERE unnest IS NOT NULL
      ) AND is_active = true;

    END IF;

  -- ─── CONTRACTS ───
  ELSIF TG_TABLE_NAME = 'contracts' AND TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      v_type := CASE NEW.status
        WHEN 'signed' THEN 'contract_signed'
        WHEN 'terminated' THEN 'contract_terminated'
        WHEN 'renewed' THEN 'contract_renewed'
        WHEN 'pending_signature' THEN 'contract_pending_signature'
        ELSE 'contract_created'
      END;
      v_title := CASE NEW.status
        WHEN 'signed' THEN '✍️ تم توقيع العقد'
        WHEN 'terminated' THEN '🚫 تم إنهاء العقد'
        WHEN 'renewed' THEN '🔄 تم تجديد العقد'
        WHEN 'pending_signature' THEN '⏳ عقد بانتظار التوقيع'
        ELSE '📝 تحديث عقد'
      END;
      v_message := COALESCE(NEW.title, 'عقد');
      v_org_id := NEW.organization_id;
      v_meta := jsonb_build_object('contract_id', NEW.id);

      SELECT array_agg(DISTINCT id) INTO v_target_ids
      FROM profiles
      WHERE organization_id IN (NEW.organization_id, NEW.partner_organization_id)
        AND is_active = true
        AND NEW.partner_organization_id IS NOT NULL
      UNION
      SELECT array_agg(DISTINCT id)
      FROM profiles
      WHERE organization_id = NEW.organization_id AND is_active = true;
    END IF;

  -- ─── INVOICES ───
  ELSIF TG_TABLE_NAME = 'invoices' THEN
    IF TG_OP = 'INSERT' THEN
      v_type := 'invoice_created';
      v_title := '🧾 فاتورة جديدة';
      v_message := 'فاتورة #' || COALESCE(NEW.invoice_number, LEFT(NEW.id::text, 8));
      v_org_id := NEW.organization_id;
      v_meta := jsonb_build_object('invoice_id', NEW.id);
      SELECT array_agg(DISTINCT id) INTO v_target_ids
      FROM profiles WHERE organization_id = NEW.organization_id AND is_active = true;
    ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
      v_type := CASE NEW.status
        WHEN 'paid' THEN 'invoice_paid'
        WHEN 'overdue' THEN 'invoice_overdue'
        ELSE 'invoice_created'
      END;
      v_title := CASE NEW.status
        WHEN 'paid' THEN '✅ تم دفع الفاتورة'
        WHEN 'overdue' THEN '⚠️ فاتورة متأخرة'
        ELSE '🧾 تحديث فاتورة'
      END;
      v_message := 'فاتورة #' || COALESCE(NEW.invoice_number, LEFT(NEW.id::text, 8));
      v_org_id := NEW.organization_id;
      v_meta := jsonb_build_object('invoice_id', NEW.id);
      IF NEW.status = 'overdue' THEN v_priority := 'high'; END IF;
      SELECT array_agg(DISTINCT id) INTO v_target_ids
      FROM profiles WHERE organization_id = NEW.organization_id AND is_active = true;
    END IF;

  -- ─── VERIFIED PARTNERSHIPS ───
  ELSIF TG_TABLE_NAME = 'verified_partnerships' THEN
    IF TG_OP = 'INSERT' THEN
      v_type := 'partnership_request';
      v_title := '🤝 طلب شراكة جديد';
      v_org_id := NEW.partner_org_id;
      v_meta := jsonb_build_object('partner_org_id', NEW.requester_org_id);
      SELECT name INTO v_message FROM organizations WHERE id = NEW.requester_org_id;
      v_message := COALESCE(v_message, 'جهة جديدة');
      SELECT array_agg(DISTINCT id) INTO v_target_ids
      FROM profiles WHERE organization_id = NEW.partner_org_id AND is_active = true;
    ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
      v_type := CASE NEW.status
        WHEN 'active' THEN 'partnership_accepted'
        WHEN 'rejected' THEN 'partnership_rejected'
        WHEN 'suspended' THEN 'partnership_suspended'
        ELSE 'partner_linked'
      END;
      v_title := CASE NEW.status
        WHEN 'active' THEN '✅ تم قبول الشراكة'
        WHEN 'rejected' THEN '❌ تم رفض الشراكة'
        WHEN 'suspended' THEN '⏸️ تم تعليق الشراكة'
        ELSE '🔗 تحديث شراكة'
      END;
      SELECT name INTO v_message FROM organizations WHERE id = NEW.requester_org_id;
      v_message := COALESCE(v_message, 'شريك');
      v_org_id := NEW.partner_org_id;
      -- Notify both sides
      SELECT array_agg(DISTINCT id) INTO v_target_ids
      FROM profiles
      WHERE organization_id IN (NEW.requester_org_id, NEW.partner_org_id) AND is_active = true;
    END IF;

  -- ─── ENTITY DOCUMENTS ───
  ELSIF TG_TABLE_NAME = 'entity_documents' AND TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      IF NEW.status = 'expired' THEN
        v_type := 'document_expired';
        v_title := '⚠️ مستند منتهي الصلاحية';
      ELSIF NEW.status = 'rejected' THEN
        v_type := 'document_rejected';
        v_title := '❌ تم رفض المستند';
      ELSE
        v_type := 'document_uploaded';
        v_title := '📄 تحديث مستند';
      END IF;
      v_message := COALESCE(NEW.name, 'مستند');
      v_org_id := NEW.organization_id;
      IF NEW.status IN ('expired', 'rejected') THEN v_priority := 'high'; END IF;
      SELECT array_agg(DISTINCT id) INTO v_target_ids
      FROM profiles WHERE organization_id = NEW.organization_id AND is_active = true;
    END IF;
  END IF;

  -- ─── INSERT NOTIFICATIONS ───
  IF v_type IS NOT NULL AND v_target_ids IS NOT NULL AND array_length(v_target_ids, 1) > 0 THEN
    INSERT INTO notifications (user_id, title, message, type, priority, shipment_id, organization_id, metadata, is_read)
    SELECT
      uid,
      v_title,
      v_message,
      v_type,
      v_priority,
      v_ship_id,
      v_org_id,
      v_meta,
      false
    FROM unnest(v_target_ids) AS uid;
  END IF;

  RETURN NEW;
END;
$$;

-- ═══ Create triggers on key tables ═══

-- Shipments
DROP TRIGGER IF EXISTS trg_auto_notify_shipments ON shipments;
CREATE TRIGGER trg_auto_notify_shipments
  AFTER UPDATE ON shipments
  FOR EACH ROW EXECUTE FUNCTION fn_auto_notify();

-- Contracts
DROP TRIGGER IF EXISTS trg_auto_notify_contracts ON contracts;
CREATE TRIGGER trg_auto_notify_contracts
  AFTER UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION fn_auto_notify();

-- Invoices
DROP TRIGGER IF EXISTS trg_auto_notify_invoices ON invoices;
CREATE TRIGGER trg_auto_notify_invoices
  AFTER INSERT OR UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION fn_auto_notify();

-- Verified Partnerships
DROP TRIGGER IF EXISTS trg_auto_notify_partnerships ON verified_partnerships;
CREATE TRIGGER trg_auto_notify_partnerships
  AFTER INSERT OR UPDATE ON verified_partnerships
  FOR EACH ROW EXECUTE FUNCTION fn_auto_notify();

-- Entity Documents
DROP TRIGGER IF EXISTS trg_auto_notify_documents ON entity_documents;
CREATE TRIGGER trg_auto_notify_documents
  AFTER UPDATE ON entity_documents
  FOR EACH ROW EXECUTE FUNCTION fn_auto_notify();
