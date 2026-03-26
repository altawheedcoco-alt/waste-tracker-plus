
-- ========================================
-- 1. Work Order: new order → notify recipients
-- ========================================
CREATE OR REPLACE FUNCTION public.notify_work_order_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  member_rec RECORD;
  order_num text;
BEGIN
  order_num := COALESCE(NEW.order_number, NEW.id::text);

  -- Notify members of each recipient organization
  FOR member_rec IN
    SELECT DISTINCT p.id as user_id
    FROM work_order_recipients wor
    JOIN profiles p ON p.organization_id = wor.recipient_organization_id
    WHERE wor.work_order_id = NEW.id
      AND wor.recipient_organization_id IS NOT NULL
  LOOP
    INSERT INTO notifications (user_id, title, message, type, is_read, reference_id, reference_type)
    VALUES (member_rec.user_id, '📋 أمر شغل جديد - ' || order_num, 'تم استلام أمر شغل جديد يتطلب مراجعتك', 'work_order', false, NEW.id, 'work_order');
  END LOOP;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_work_order_created ON work_orders;
CREATE TRIGGER trg_notify_work_order_created AFTER INSERT ON work_orders FOR EACH ROW EXECUTE FUNCTION notify_work_order_created();

-- ========================================
-- 2. Work Order Counter-Offer → notify original creator
-- ========================================
CREATE OR REPLACE FUNCTION public.notify_work_order_counter_offer()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  wo RECORD;
  creator_id uuid;
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;
  IF NEW.status NOT IN ('counter_offer', 'accepted', 'rejected') THEN RETURN NEW; END IF;

  SELECT id, created_by, order_number INTO wo FROM work_orders WHERE id = NEW.work_order_id;
  creator_id := wo.created_by;
  IF creator_id IS NULL THEN RETURN NEW; END IF;

  IF NEW.status = 'counter_offer' THEN
    INSERT INTO notifications (user_id, title, message, type, is_read, reference_id, reference_type)
    VALUES (creator_id, '🔄 عرض مقابل على أمر الشغل', 'تم تقديم عرض مقابل على أمر الشغل ' || COALESCE(wo.order_number, ''), 'work_order_counter', false, NEW.work_order_id, 'work_order');
  ELSIF NEW.status = 'accepted' THEN
    INSERT INTO notifications (user_id, title, message, type, is_read, reference_id, reference_type)
    VALUES (creator_id, '✅ تم قبول أمر الشغل', 'تم قبول أمر الشغل ' || COALESCE(wo.order_number, ''), 'work_order_accepted', false, NEW.work_order_id, 'work_order');
  ELSIF NEW.status = 'rejected' THEN
    INSERT INTO notifications (user_id, title, message, type, is_read, reference_id, reference_type)
    VALUES (creator_id, '❌ تم رفض أمر الشغل', 'تم رفض أمر الشغل ' || COALESCE(wo.order_number, ''), 'work_order_rejected', false, NEW.work_order_id, 'work_order');
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_work_order_response ON work_order_recipients;
CREATE TRIGGER trg_notify_work_order_response AFTER UPDATE ON work_order_recipients FOR EACH ROW EXECUTE FUNCTION notify_work_order_counter_offer();

-- ========================================
-- 3. Collection Request status change → notify parties
-- ========================================
CREATE OR REPLACE FUNCTION public.notify_collection_request_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  member_rec RECORD;
  status_label text;
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;
  status_label := CASE NEW.status
    WHEN 'approved' THEN 'تمت الموافقة' WHEN 'rejected' THEN 'مرفوض'
    WHEN 'in_progress' THEN 'قيد التنفيذ' WHEN 'completed' THEN 'مكتمل'
    ELSE NEW.status END;

  FOR member_rec IN
    SELECT DISTINCT p.id as user_id FROM profiles p WHERE p.organization_id = NEW.organization_id
  LOOP
    INSERT INTO notifications (user_id, title, message, type, is_read, reference_id, reference_type)
    VALUES (member_rec.user_id, '📦 تحديث طلب الجمع', 'تم تحديث حالة طلب الجمع إلى: ' || status_label, 'collection_request', false, NEW.id, 'collection_request');
  END LOOP;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_collection_request_status ON collection_requests;
CREATE TRIGGER trg_notify_collection_request_status AFTER UPDATE ON collection_requests FOR EACH ROW EXECUTE FUNCTION notify_collection_request_status();

-- ========================================
-- 4. New Organization Member → notify existing members
-- ========================================
CREATE OR REPLACE FUNCTION public.notify_new_org_member()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  member_rec RECORD;
  new_member_name text;
  org_name text;
BEGIN
  IF NEW.status != 'active' THEN RETURN NEW; END IF;

  SELECT full_name INTO new_member_name FROM profiles WHERE id = COALESCE(NEW.profile_id, NEW.user_id);
  new_member_name := COALESCE(new_member_name, 'عضو جديد');
  SELECT name INTO org_name FROM organizations WHERE id = NEW.organization_id;

  FOR member_rec IN
    SELECT DISTINCT p.id as user_id FROM profiles p
    WHERE p.organization_id = NEW.organization_id
      AND p.id != COALESCE(NEW.profile_id, NEW.user_id)
  LOOP
    INSERT INTO notifications (user_id, title, message, type, is_read, reference_id, reference_type)
    VALUES (member_rec.user_id, '👤 عضو جديد انضم للمنظمة', new_member_name || ' انضم إلى ' || COALESCE(org_name, 'المنظمة'), 'member_joined', false, NEW.id, 'organization_member');
  END LOOP;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_new_org_member ON organization_members;
CREATE TRIGGER trg_notify_new_org_member AFTER INSERT ON organization_members FOR EACH ROW EXECUTE FUNCTION notify_new_org_member();
