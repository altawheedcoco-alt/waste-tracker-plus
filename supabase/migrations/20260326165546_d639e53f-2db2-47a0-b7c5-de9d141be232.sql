
-- ========================================
-- 16. Audit Sessions → إشعار جلسة تدقيق
-- ========================================
CREATE OR REPLACE FUNCTION notify_audit_session() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_member RECORD;
BEGIN
  IF TG_OP = 'INSERT' THEN
    FOR v_member IN SELECT user_id FROM organization_members WHERE organization_id = NEW.organization_id AND status = 'active' LOOP
      INSERT INTO notifications(user_id, title, message, type, is_read)
      VALUES(v_member.user_id, '📊 جلسة تدقيق جديدة', COALESCE(NEW.audit_type,'تدقيق') || ' - ' || COALESCE(NEW.status,''), 'audit_session', false);
    END LOOP;
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    FOR v_member IN SELECT user_id FROM organization_members WHERE organization_id = NEW.organization_id AND status = 'active' LOOP
      INSERT INTO notifications(user_id, title, message, type, is_read)
      VALUES(v_member.user_id, '📊 تحديث تدقيق', 'الحالة: ' || NEW.status, 'audit_session_status', false);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_audit_session ON audit_sessions;
CREATE TRIGGER trg_notify_audit_session AFTER INSERT OR UPDATE ON audit_sessions FOR EACH ROW EXECUTE FUNCTION notify_audit_session();

-- ========================================
-- 17. Award Letters → إشعار خطاب ترسية
-- ========================================
CREATE OR REPLACE FUNCTION notify_award_letter() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_member RECORD;
BEGIN
  FOR v_member IN SELECT user_id FROM organization_members WHERE organization_id = NEW.organization_id AND status = 'active' LOOP
    INSERT INTO notifications(user_id, title, message, type, is_read)
    VALUES(v_member.user_id,
      CASE WHEN TG_OP='INSERT' THEN '🏆 خطاب ترسية جديد' ELSE '🏆 تحديث خطاب ترسية' END,
      'الحالة: ' || COALESCE(NEW.status,''), 'award_letter', false);
  END LOOP;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_award_letter ON award_letters;
CREATE TRIGGER trg_notify_award_letter AFTER INSERT OR UPDATE ON award_letters FOR EACH ROW EXECUTE FUNCTION notify_award_letter();

-- ========================================
-- 18. Contract Penalties → إشعار غرامة عقد
-- ========================================
CREATE OR REPLACE FUNCTION notify_contract_penalty() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_member RECORD;
BEGIN
  FOR v_member IN SELECT user_id FROM organization_members WHERE organization_id = NEW.organization_id AND status = 'active' LOOP
    INSERT INTO notifications(user_id, title, message, type, is_read)
    VALUES(v_member.user_id, '⚠️ غرامة عقد جديدة', 'الحالة: ' || COALESCE(NEW.status,''), 'contract_penalty', false);
  END LOOP;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_contract_penalty ON contract_penalties;
CREATE TRIGGER trg_notify_contract_penalty AFTER INSERT ON contract_penalties FOR EACH ROW EXECUTE FUNCTION notify_contract_penalty();

-- ========================================
-- 19. Customer Conversations → إشعار محادثة عميل
-- ========================================
CREATE OR REPLACE FUNCTION notify_customer_conversation() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_member RECORD;
BEGIN
  IF TG_OP = 'INSERT' THEN
    FOR v_member IN SELECT user_id FROM organization_members WHERE organization_id = NEW.organization_id AND status = 'active' LOOP
      INSERT INTO notifications(user_id, title, message, type, is_read)
      VALUES(v_member.user_id, '💬 محادثة عميل جديدة', 'عميل جديد بدأ محادثة', 'customer_conversation', false);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_customer_conversation ON customer_conversations;
CREATE TRIGGER trg_notify_customer_conversation AFTER INSERT ON customer_conversations FOR EACH ROW EXECUTE FUNCTION notify_customer_conversation();

-- ========================================
-- 20. Disposal Incoming Requests → إشعار طلب تخلص وارد
-- ========================================
CREATE OR REPLACE FUNCTION notify_disposal_incoming_request() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_member RECORD;
BEGIN
  IF NEW.facility_id IS NOT NULL THEN
    FOR v_member IN SELECT om.user_id FROM organization_members om
      JOIN disposal_facilities df ON df.organization_id = om.organization_id
      WHERE df.id = NEW.facility_id AND om.status = 'active'
    LOOP
      INSERT INTO notifications(user_id, title, message, type, is_read)
      VALUES(v_member.user_id,
        CASE WHEN TG_OP='INSERT' THEN '📥 طلب تخلص وارد جديد' ELSE '📥 تحديث طلب تخلص' END,
        'الحالة: ' || COALESCE(NEW.status,''), 'disposal_request', false);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_disposal_incoming ON disposal_incoming_requests;
CREATE TRIGGER trg_notify_disposal_incoming AFTER INSERT OR UPDATE ON disposal_incoming_requests FOR EACH ROW EXECUTE FUNCTION notify_disposal_incoming_request();

-- ========================================
-- 21. Disposal Operations → إشعار عملية تخلص
-- ========================================
CREATE OR REPLACE FUNCTION notify_disposal_operation() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_member RECORD;
BEGIN
  FOR v_member IN SELECT user_id FROM organization_members WHERE organization_id = NEW.organization_id AND status = 'active' LOOP
    INSERT INTO notifications(user_id, title, message, type, is_read)
    VALUES(v_member.user_id,
      CASE WHEN TG_OP='INSERT' THEN '🏭 عملية تخلص جديدة' ELSE '🏭 تحديث عملية تخلص' END,
      'الحالة: ' || COALESCE(NEW.status,''), 'disposal_operation', false);
  END LOOP;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_disposal_operation ON disposal_operations;
CREATE TRIGGER trg_notify_disposal_operation AFTER INSERT OR UPDATE ON disposal_operations FOR EACH ROW EXECUTE FUNCTION notify_disposal_operation();

-- ========================================
-- 22. Support Tickets → إشعار تذكرة دعم
-- ========================================
CREATE OR REPLACE FUNCTION notify_support_ticket() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.assigned_to IS NOT NULL THEN
      INSERT INTO notifications(user_id, title, message, type, is_read)
      VALUES(NEW.assigned_to, '🎫 تذكرة دعم جديدة', COALESCE(NEW.subject, LEFT(COALESCE(NEW.description,''),80)), 'support_ticket', false);
    END IF;
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.created_by IS NOT NULL THEN
      INSERT INTO notifications(user_id, title, message, type, is_read)
      VALUES(NEW.created_by, '🎫 تحديث تذكرة دعم', 'الحالة: ' || NEW.status, 'support_ticket_status', false);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_support_ticket ON support_tickets;
CREATE TRIGGER trg_notify_support_ticket AFTER INSERT OR UPDATE ON support_tickets FOR EACH ROW EXECUTE FUNCTION notify_support_ticket();

-- ========================================
-- 23. Quotations → إشعار عرض سعر
-- ========================================
CREATE OR REPLACE FUNCTION notify_quotation() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_member RECORD;
BEGIN
  FOR v_member IN SELECT user_id FROM organization_members WHERE organization_id = NEW.organization_id AND status = 'active' LOOP
    INSERT INTO notifications(user_id, title, message, type, is_read)
    VALUES(v_member.user_id,
      CASE WHEN TG_OP='INSERT' THEN '💰 عرض سعر جديد' ELSE '💰 تحديث عرض سعر' END,
      'الحالة: ' || COALESCE(NEW.status,''), 'quotation', false);
  END LOOP;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_quotation ON quotations;
CREATE TRIGGER trg_notify_quotation AFTER INSERT OR UPDATE ON quotations FOR EACH ROW EXECUTE FUNCTION notify_quotation();

-- ========================================
-- 24. Marketplace Listings → إشعار إعلان سوق
-- ========================================
CREATE OR REPLACE FUNCTION notify_marketplace_listing() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_member RECORD;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    FOR v_member IN SELECT user_id FROM organization_members WHERE organization_id = NEW.organization_id AND status = 'active' LOOP
      INSERT INTO notifications(user_id, title, message, type, is_read)
      VALUES(v_member.user_id, '🏪 تحديث إعلان السوق', 'الحالة: ' || NEW.status, 'marketplace_listing', false);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_marketplace_listing ON marketplace_listings;
CREATE TRIGGER trg_notify_marketplace_listing AFTER UPDATE ON marketplace_listings FOR EACH ROW EXECUTE FUNCTION notify_marketplace_listing();

-- ========================================
-- 25. Consultant Reviews → إشعار مراجعة استشاري
-- ========================================
CREATE OR REPLACE FUNCTION notify_consultant_review() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_member RECORD;
BEGIN
  IF NEW.organization_id IS NOT NULL THEN
    FOR v_member IN SELECT user_id FROM organization_members WHERE organization_id = NEW.organization_id AND status = 'active' LOOP
      INSERT INTO notifications(user_id, title, message, type, is_read)
      VALUES(v_member.user_id, '📋 مراجعة استشارية جديدة', COALESCE(NEW.review_type,'مراجعة'), 'consultant_review', false);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_consultant_review ON consultant_reviews;
CREATE TRIGGER trg_notify_consultant_review AFTER INSERT ON consultant_reviews FOR EACH ROW EXECUTE FUNCTION notify_consultant_review();

-- ========================================
-- 26. Chat Channel Messages → إشعار رسالة قناة
-- ========================================
CREATE OR REPLACE FUNCTION notify_chat_channel_message() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_member RECORD; v_sender_name TEXT;
BEGIN
  SELECT full_name INTO v_sender_name FROM profiles WHERE id = NEW.sender_id;
  FOR v_member IN SELECT user_id FROM chat_channel_members WHERE channel_id = NEW.channel_id AND user_id != NEW.sender_id LOOP
    INSERT INTO notifications(user_id, title, message, type, is_read)
    VALUES(v_member.user_id, '💬 رسالة في القناة', COALESCE(v_sender_name,'عضو') || ': ' || LEFT(COALESCE(NEW.content,''),60), 'channel_message', false);
  END LOOP;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_chat_channel_message ON chat_channel_messages;
CREATE TRIGGER trg_notify_chat_channel_message AFTER INSERT ON chat_channel_messages FOR EACH ROW EXECUTE FUNCTION notify_chat_channel_message();
