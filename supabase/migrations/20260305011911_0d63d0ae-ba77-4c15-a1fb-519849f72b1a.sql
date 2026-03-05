
-- =============================================
-- 1. COLLECTION REQUESTS TRIGGER
-- =============================================
CREATE OR REPLACE FUNCTION public.notify_collection_request_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title TEXT;
  v_message TEXT;
  v_type TEXT;
  v_member RECORD;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_title := '📋 طلب جمع جديد';
    v_message := 'طلب جمع جديد من ' || NEW.customer_name || ' - ' || NEW.waste_type || ' في ' || NEW.pickup_address;
    v_type := 'collection_request';
    
    FOR v_member IN
      SELECT p.id FROM profiles p WHERE p.organization_id = NEW.organization_id
    LOOP
      INSERT INTO notifications (user_id, title, message, type, is_read)
      VALUES (v_member.id, v_title, v_message, v_type, false);
    END LOOP;
    
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    v_type := 'collection_request';
    
    CASE NEW.status
      WHEN 'accepted' THEN
        v_title := '✅ تم قبول طلب الجمع';
        v_message := 'تم قبول طلب جمع ' || NEW.waste_type || ' من ' || NEW.customer_name;
      WHEN 'rejected' THEN
        v_title := '❌ تم رفض طلب الجمع';
        v_message := 'تم رفض طلب جمع ' || NEW.waste_type || ' من ' || NEW.customer_name;
      WHEN 'in_progress' THEN
        v_title := '🚛 جاري تنفيذ طلب الجمع';
        v_message := 'بدأ تنفيذ طلب جمع ' || NEW.waste_type || ' من ' || NEW.customer_name;
      WHEN 'completed' THEN
        v_title := '✅ اكتمل طلب الجمع';
        v_message := 'تم إتمام طلب جمع ' || NEW.waste_type || ' من ' || NEW.customer_name;
      WHEN 'cancelled' THEN
        v_title := '🚫 تم إلغاء طلب الجمع';
        v_message := 'تم إلغاء طلب جمع ' || NEW.waste_type || ' من ' || NEW.customer_name;
        IF NEW.cancellation_reason IS NOT NULL THEN
          v_message := v_message || ' | السبب: ' || NEW.cancellation_reason;
        END IF;
      ELSE
        v_title := '📋 تحديث طلب جمع';
        v_message := 'تم تحديث حالة طلب جمع ' || NEW.waste_type || ' إلى ' || NEW.status;
    END CASE;

    FOR v_member IN
      SELECT p.id FROM profiles p WHERE p.organization_id = NEW.organization_id
    LOOP
      INSERT INTO notifications (user_id, title, message, type, is_read)
      VALUES (v_member.id, v_title, v_message, v_type, false);
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_collection_request_notify ON collection_requests;
CREATE TRIGGER trg_collection_request_notify
  AFTER INSERT OR UPDATE ON collection_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_collection_request_changes();

-- =============================================
-- 2. WASTE AUCTIONS TRIGGER
-- =============================================
CREATE OR REPLACE FUNCTION public.notify_waste_auction_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title TEXT;
  v_message TEXT;
  v_type TEXT := 'auction';
  v_member RECORD;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_title := '🔨 مزاد جديد';
    v_message := 'تم إنشاء مزاد جديد: ' || NEW.title || ' - ' || NEW.waste_type || ' (' || NEW.estimated_quantity || ' ' || COALESCE(NEW.unit, 'طن') || ')';
    
    FOR v_member IN
      SELECT p.id FROM profiles p WHERE p.organization_id = NEW.organization_id
    LOOP
      INSERT INTO notifications (user_id, title, message, type, is_read)
      VALUES (v_member.id, v_title, v_message, v_type, false);
    END LOOP;

    FOR v_member IN
      SELECT ur.user_id FROM user_roles ur WHERE ur.role = 'admin'
    LOOP
      INSERT INTO notifications (user_id, title, message, type, is_read)
      VALUES (v_member.user_id, '🔨 مزاد جديد يتطلب موافقة', v_message, 'admin', false);
    END LOOP;
    
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    CASE NEW.status
      WHEN 'approved' THEN
        v_title := '✅ تمت الموافقة على المزاد';
        v_message := 'تمت الموافقة على مزاد: ' || NEW.title;
      WHEN 'active' THEN
        v_title := '🟢 المزاد نشط الآن';
        v_message := 'المزاد نشط: ' || NEW.title || ' - المزايدة مفتوحة';
      WHEN 'closed' THEN
        v_title := '🔴 انتهى المزاد';
        v_message := 'انتهى مزاد: ' || NEW.title;
      WHEN 'cancelled' THEN
        v_title := '🚫 تم إلغاء المزاد';
        v_message := 'تم إلغاء مزاد: ' || NEW.title;
      ELSE
        v_title := '📋 تحديث مزاد';
        v_message := 'تم تحديث مزاد: ' || NEW.title || ' إلى ' || NEW.status;
    END CASE;

    FOR v_member IN
      SELECT p.id FROM profiles p WHERE p.organization_id = NEW.organization_id
    LOOP
      INSERT INTO notifications (user_id, title, message, type, is_read)
      VALUES (v_member.id, v_title, v_message, v_type, false);
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_waste_auction_notify ON waste_auctions;
CREATE TRIGGER trg_waste_auction_notify
  AFTER INSERT OR UPDATE ON waste_auctions
  FOR EACH ROW
  EXECUTE FUNCTION notify_waste_auction_changes();

-- =============================================
-- 3. AUCTION BIDS TRIGGER
-- =============================================
CREATE OR REPLACE FUNCTION public.notify_auction_bid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auction RECORD;
  v_member RECORD;
  v_title TEXT;
  v_message TEXT;
BEGIN
  SELECT title, organization_id INTO v_auction
  FROM waste_auctions WHERE id = NEW.auction_id;

  IF TG_OP = 'INSERT' THEN
    v_title := '💰 عرض سعر جديد';
    v_message := 'عرض سعر جديد بقيمة ' || NEW.amount || ' على مزاد: ' || v_auction.title;

    FOR v_member IN
      SELECT p.id FROM profiles p WHERE p.organization_id = v_auction.organization_id
    LOOP
      INSERT INTO notifications (user_id, title, message, type, is_read)
      VALUES (v_member.id, v_title, v_message, 'auction_bid', false);
    END LOOP;

    FOR v_member IN
      SELECT p.id FROM profiles p WHERE p.organization_id = NEW.bidder_organization_id
    LOOP
      INSERT INTO notifications (user_id, title, message, type, is_read)
      VALUES (v_member.id, '📤 تم تقديم عرضك', 'تم تقديم عرض بقيمة ' || NEW.amount || ' على مزاد: ' || v_auction.title, 'auction_bid', false);
    END LOOP;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    CASE NEW.status
      WHEN 'accepted' THEN
        v_title := '🎉 تم قبول عرضك';
        v_message := 'تم قبول عرضك بقيمة ' || NEW.amount || ' على مزاد: ' || v_auction.title;
      WHEN 'rejected' THEN
        v_title := '❌ تم رفض عرضك';
        v_message := 'تم رفض عرضك على مزاد: ' || v_auction.title;
      ELSE
        v_title := '📋 تحديث العرض';
        v_message := 'تم تحديث حالة عرضك على مزاد: ' || v_auction.title;
    END CASE;

    FOR v_member IN
      SELECT p.id FROM profiles p WHERE p.organization_id = NEW.bidder_organization_id
    LOOP
      INSERT INTO notifications (user_id, title, message, type, is_read)
      VALUES (v_member.id, v_title, v_message, 'auction_bid', false);
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auction_bid_notify ON auction_bids;
CREATE TRIGGER trg_auction_bid_notify
  AFTER INSERT OR UPDATE ON auction_bids
  FOR EACH ROW
  EXECUTE FUNCTION notify_auction_bid();

-- =============================================
-- 4. APPROVAL REQUESTS TRIGGER
-- =============================================
CREATE OR REPLACE FUNCTION public.notify_approval_request_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member RECORD;
  v_title TEXT;
  v_message TEXT;
  v_type TEXT := 'approval';
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_title := '📝 طلب موافقة جديد';
    v_message := NEW.request_title;
    IF NEW.request_description IS NOT NULL THEN
      v_message := v_message || ' - ' || LEFT(NEW.request_description, 100);
    END IF;

    FOR v_member IN
      SELECT ur.user_id FROM user_roles ur WHERE ur.role = 'admin'
    LOOP
      INSERT INTO notifications (user_id, title, message, type, is_read)
      VALUES (v_member.user_id, v_title, v_message, v_type, false);
    END LOOP;

    IF NEW.requester_user_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, title, message, type, is_read)
      VALUES (NEW.requester_user_id, '📤 تم إرسال طلبك', 'تم إرسال طلب: ' || NEW.request_title || ' وهو قيد المراجعة', v_type, false);
    END IF;

    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    CASE NEW.status
      WHEN 'approved' THEN
        v_title := '✅ تمت الموافقة على طلبك';
        v_message := 'تمت الموافقة على: ' || NEW.request_title;
      WHEN 'rejected' THEN
        v_title := '❌ تم رفض طلبك';
        v_message := 'تم رفض: ' || NEW.request_title;
        IF NEW.admin_notes IS NOT NULL THEN
          v_message := v_message || ' | ملاحظات: ' || LEFT(NEW.admin_notes, 100);
        END IF;
      WHEN 'in_review' THEN
        v_title := '🔍 طلبك قيد المراجعة';
        v_message := 'جاري مراجعة: ' || NEW.request_title;
      ELSE
        v_title := '📋 تحديث الطلب';
        v_message := 'تم تحديث حالة: ' || NEW.request_title || ' إلى ' || NEW.status;
    END CASE;

    IF NEW.requester_user_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, title, message, type, is_read)
      VALUES (NEW.requester_user_id, v_title, v_message, v_type, false);
    END IF;

    IF NEW.requester_organization_id IS NOT NULL THEN
      FOR v_member IN
        SELECT p.id FROM profiles p 
        WHERE p.organization_id = NEW.requester_organization_id
        AND p.id IS DISTINCT FROM NEW.requester_user_id
      LOOP
        INSERT INTO notifications (user_id, title, message, type, is_read)
        VALUES (v_member.id, v_title, v_message, v_type, false);
      END LOOP;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_approval_request_notify ON approval_requests;
CREATE TRIGGER trg_approval_request_notify
  AFTER INSERT OR UPDATE ON approval_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_approval_request_changes();
