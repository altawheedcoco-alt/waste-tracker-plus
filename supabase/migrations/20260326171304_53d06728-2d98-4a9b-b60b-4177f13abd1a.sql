
-- ============================================================
-- الجزء الأخير: إشعارات الجهات والعمليات المتبقية
-- ============================================================

-- 1) الفواتير (invoices)
CREATE OR REPLACE FUNCTION public.notify_invoice_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _title TEXT; _msg TEXT; _type TEXT; _uid UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    _type := 'invoice_created';
    _title := '🧾 فاتورة جديدة';
    _msg := 'تم إنشاء فاتورة رقم ' || COALESCE(NEW.invoice_number, NEW.id::text);
    _uid := NEW.created_by;
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    _type := 'invoice_status';
    _title := '🧾 تحديث فاتورة';
    _msg := 'فاتورة ' || COALESCE(NEW.invoice_number, NEW.id::text) || ' → ' || NEW.status;
    _uid := NEW.created_by;
  ELSE
    RETURN COALESCE(NEW, OLD);
  END IF;
  INSERT INTO public.notifications(user_id,title,message,type,priority,metadata)
    SELECT _uid, _title, _msg, _type, 'normal',
      jsonb_build_object('invoice_id', NEW.id, 'status', NEW.status)
    WHERE _uid IS NOT NULL;
  IF NEW.organization_id IS NOT NULL THEN
    INSERT INTO public.notifications(user_id,title,message,type,priority,metadata)
      SELECT om.user_id, _title, _msg, _type, 'normal',
        jsonb_build_object('invoice_id', NEW.id)
      FROM public.organization_members om
      WHERE om.organization_id = NEW.organization_id
        AND om.status = 'active' AND om.user_id IS DISTINCT FROM _uid;
  END IF;
  RETURN NEW;
END;$$;
DROP TRIGGER IF EXISTS trg_notify_invoice ON public.invoices;
CREATE TRIGGER trg_notify_invoice AFTER INSERT OR UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.notify_invoice_change();

-- 2) الإيداعات (deposits)
CREATE OR REPLACE FUNCTION public.notify_deposit_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications(user_id,title,message,type,priority,metadata)
      SELECT om.user_id, '💰 إيداع جديد',
        'تم تسجيل إيداع بقيمة ' || NEW.amount,
        'deposit_created', 'normal',
        jsonb_build_object('deposit_id', NEW.id, 'amount', NEW.amount)
      FROM public.organization_members om
      WHERE om.organization_id = NEW.organization_id AND om.status = 'active';
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.notifications(user_id,title,message,type,priority,metadata)
      SELECT om.user_id, '💰 تحديث إيداع',
        'الإيداع → ' || NEW.status,
        'deposit_status', 'normal',
        jsonb_build_object('deposit_id', NEW.id, 'status', NEW.status)
      FROM public.organization_members om
      WHERE om.organization_id = NEW.organization_id AND om.status = 'active';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;$$;
DROP TRIGGER IF EXISTS trg_notify_deposit ON public.deposits;
CREATE TRIGGER trg_notify_deposit AFTER INSERT OR UPDATE ON public.deposits
  FOR EACH ROW EXECUTE FUNCTION public.notify_deposit_change();

-- 3) العقود (contracts)
CREATE OR REPLACE FUNCTION public.notify_contract_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications(user_id,title,message,type,priority,metadata)
      SELECT om.user_id, '📋 عقد جديد', 'تم إنشاء عقد: ' || COALESCE(NEW.title, NEW.id::text),
        'contract_created', 'high', jsonb_build_object('contract_id', NEW.id)
      FROM public.organization_members om
      WHERE om.organization_id = NEW.organization_id AND om.status = 'active';
    IF NEW.partner_organization_id IS NOT NULL THEN
      INSERT INTO public.notifications(user_id,title,message,type,priority,metadata)
        SELECT om.user_id, '📋 عقد جديد وارد', 'تم استلام عقد جديد',
          'contract_received', 'high', jsonb_build_object('contract_id', NEW.id)
        FROM public.organization_members om
        WHERE om.organization_id = NEW.partner_organization_id AND om.status = 'active';
    END IF;
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.notifications(user_id,title,message,type,priority,metadata)
      SELECT om.user_id, '📋 تحديث عقد', 'العقد → ' || NEW.status,
        'contract_status', 'normal', jsonb_build_object('contract_id', NEW.id, 'status', NEW.status)
      FROM public.organization_members om
      WHERE om.organization_id = NEW.organization_id AND om.status = 'active';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;$$;
DROP TRIGGER IF EXISTS trg_notify_contract ON public.contracts;
CREATE TRIGGER trg_notify_contract AFTER INSERT OR UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.notify_contract_change();

-- 4) طلبات الموافقة (approval_requests)
CREATE OR REPLACE FUNCTION public.notify_approval_request()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.reviewer_id IS NOT NULL THEN
      INSERT INTO public.notifications(user_id,title,message,type,priority,metadata)
        VALUES(NEW.reviewer_id, '📝 طلب موافقة جديد',
          'يوجد طلب بانتظار مراجعتك: ' || COALESCE(NEW.request_type,''),
          'approval_pending', 'high',
          jsonb_build_object('request_id', NEW.id, 'type', NEW.request_type));
    END IF;
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.notifications(user_id,title,message,type,priority,metadata)
      SELECT NEW.requester_id,
        CASE WHEN NEW.status = 'approved' THEN '✅ تمت الموافقة' ELSE '❌ تم الرفض' END,
        'طلبك ' || COALESCE(NEW.request_type,'') || ' → ' || NEW.status,
        'approval_' || NEW.status, 'high',
        jsonb_build_object('request_id', NEW.id, 'status', NEW.status)
      WHERE NEW.requester_id IS NOT NULL;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;$$;
DROP TRIGGER IF EXISTS trg_notify_approval ON public.approval_requests;
CREATE TRIGGER trg_notify_approval AFTER INSERT OR UPDATE ON public.approval_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_approval_request();

-- 5) مركبات الأسطول (fleet_vehicles)
CREATE OR REPLACE FUNCTION public.notify_fleet_vehicle()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications(user_id,title,message,type,metadata)
      SELECT om.user_id, '🚛 مركبة جديدة',
        'تمت إضافة مركبة: ' || COALESCE(NEW.plate_number, NEW.id::text),
        'fleet_vehicle_added', jsonb_build_object('vehicle_id', NEW.id)
      FROM public.organization_members om
      WHERE om.organization_id = NEW.organization_id AND om.status = 'active'
        AND om.role IN ('admin','manager');
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.notifications(user_id,title,message,type,metadata)
      SELECT om.user_id, '🚛 تحديث مركبة',
        COALESCE(NEW.plate_number,'') || ' → ' || NEW.status,
        'fleet_vehicle_status', jsonb_build_object('vehicle_id', NEW.id, 'status', NEW.status)
      FROM public.organization_members om
      WHERE om.organization_id = NEW.organization_id AND om.status = 'active';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;$$;
DROP TRIGGER IF EXISTS trg_notify_fleet_vehicle ON public.fleet_vehicles;
CREATE TRIGGER trg_notify_fleet_vehicle AFTER INSERT OR UPDATE ON public.fleet_vehicles
  FOR EACH ROW EXECUTE FUNCTION public.notify_fleet_vehicle();

-- 6) الإعلانات (advertisements)
CREATE OR REPLACE FUNCTION public.notify_advertisement()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.advertiser_user_id IS NOT NULL THEN
      INSERT INTO public.notifications(user_id,title,message,type,metadata)
        VALUES(NEW.advertiser_user_id,
          CASE NEW.status
            WHEN 'approved' THEN '✅ تمت الموافقة على إعلانك'
            WHEN 'rejected' THEN '❌ تم رفض إعلانك'
            WHEN 'active' THEN '🟢 إعلانك نشط الآن'
            WHEN 'expired' THEN '⏰ انتهت صلاحية إعلانك'
            ELSE '📢 تحديث إعلان'
          END,
          'إعلان "' || NEW.title || '" → ' || NEW.status,
          'ad_status', jsonb_build_object('ad_id', NEW.id, 'status', NEW.status));
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;$$;
DROP TRIGGER IF EXISTS trg_notify_ad ON public.advertisements;
CREATE TRIGGER trg_notify_ad AFTER UPDATE ON public.advertisements
  FOR EACH ROW EXECUTE FUNCTION public.notify_advertisement();

-- 7) مشاركة المستندات الذكية (ai_document_shares)
CREATE OR REPLACE FUNCTION public.notify_ai_doc_share()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _doc_title TEXT;
BEGIN
  SELECT title INTO _doc_title FROM public.ai_documents WHERE id = NEW.document_id;
  IF NEW.shared_with_org_id IS NOT NULL THEN
    INSERT INTO public.notifications(user_id,title,message,type,metadata)
      SELECT om.user_id, '📄 مستند مشارك جديد',
        'تمت مشاركة مستند: ' || COALESCE(_doc_title, ''),
        'document_shared', jsonb_build_object('document_id', NEW.document_id, 'share_id', NEW.id)
      FROM public.organization_members om
      WHERE om.organization_id = NEW.shared_with_org_id AND om.status = 'active';
  END IF;
  RETURN NEW;
END;$$;
DROP TRIGGER IF EXISTS trg_notify_ai_doc_share ON public.ai_document_shares;
CREATE TRIGGER trg_notify_ai_doc_share AFTER INSERT ON public.ai_document_shares
  FOR EACH ROW EXECUTE FUNCTION public.notify_ai_doc_share();

-- 8) سجل المحاسبة (accounting_ledger)
CREATE OR REPLACE FUNCTION public.notify_ledger_entry()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.entry_type IN ('credit','debit') THEN
    INSERT INTO public.notifications(user_id,title,message,type,metadata)
      SELECT om.user_id,
        CASE NEW.entry_type WHEN 'credit' THEN '💚 قيد دائن' ELSE '💛 قيد مدين' END,
        COALESCE(NEW.description, 'قيد محاسبي') || ' - ' || NEW.amount,
        'ledger_entry', jsonb_build_object('ledger_id', NEW.id, 'amount', NEW.amount, 'type', NEW.entry_type)
      FROM public.organization_members om
      WHERE om.organization_id = NEW.organization_id AND om.status = 'active'
        AND om.role IN ('admin','accountant','manager');
  END IF;
  RETURN NEW;
END;$$;
DROP TRIGGER IF EXISTS trg_notify_ledger ON public.accounting_ledger;
CREATE TRIGGER trg_notify_ledger AFTER INSERT ON public.accounting_ledger
  FOR EACH ROW EXECUTE FUNCTION public.notify_ledger_entry();

-- 9) الرسائل المباشرة (direct_messages)
CREATE OR REPLACE FUNCTION public.notify_direct_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _sender_name TEXT;
BEGIN
  SELECT full_name INTO _sender_name FROM public.profiles WHERE id = NEW.sender_id;
  IF NEW.receiver_organization_id IS NOT NULL THEN
    INSERT INTO public.notifications(user_id,title,message,type,metadata)
      SELECT om.user_id, '💬 رسالة جديدة',
        'رسالة من ' || COALESCE(_sender_name, 'مستخدم'),
        'direct_message',
        jsonb_build_object('message_id', NEW.id, 'sender_id', NEW.sender_id)
      FROM public.organization_members om
      WHERE om.organization_id = NEW.receiver_organization_id AND om.status = 'active'
        AND om.user_id IS DISTINCT FROM NEW.sender_id;
  END IF;
  RETURN NEW;
END;$$;
DROP TRIGGER IF EXISTS trg_notify_dm ON public.direct_messages;
CREATE TRIGGER trg_notify_dm AFTER INSERT ON public.direct_messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_direct_message();

-- 10) عروض السوق (marketplace_listings)
CREATE OR REPLACE FUNCTION public.notify_marketplace_listing()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.notifications(user_id,title,message,type,metadata)
      SELECT om.user_id,
        CASE NEW.status
          WHEN 'sold' THEN '🎉 تم بيع عرضك'
          WHEN 'expired' THEN '⏰ انتهى عرضك'
          ELSE '🏪 تحديث عرض'
        END,
        COALESCE(NEW.title, '') || ' → ' || NEW.status,
        'marketplace_status', jsonb_build_object('listing_id', NEW.id, 'status', NEW.status)
      FROM public.organization_members om
      WHERE om.organization_id = NEW.organization_id AND om.status = 'active';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;$$;
DROP TRIGGER IF EXISTS trg_notify_marketplace_listing ON public.marketplace_listings;
CREATE TRIGGER trg_notify_marketplace_listing AFTER UPDATE ON public.marketplace_listings
  FOR EACH ROW EXECUTE FUNCTION public.notify_marketplace_listing();

-- 11) طلبات التوظيف (agency_candidates)
CREATE OR REPLACE FUNCTION public.notify_job_application()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications(user_id,title,message,type,metadata)
      SELECT om.user_id, '👤 طلب توظيف جديد',
        'تقدم مرشح جديد',
        'job_application', jsonb_build_object('application_id', NEW.id)
      FROM public.recruitment_agencies ra
      JOIN public.organization_members om ON om.organization_id = ra.organization_id
      WHERE ra.id = NEW.agency_id AND om.status = 'active' AND om.role IN ('admin','hr');
  END IF;
  RETURN NEW;
END;$$;
DROP TRIGGER IF EXISTS trg_notify_job_app ON public.agency_candidates;
CREATE TRIGGER trg_notify_job_app AFTER INSERT ON public.agency_candidates
  FOR EACH ROW EXECUTE FUNCTION public.notify_job_application();

-- 12) تصعيد محادثات AI (ai_agent_conversations)
CREATE OR REPLACE FUNCTION public.notify_ai_conversation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status = 'escalated' AND OLD.status IS DISTINCT FROM 'escalated' THEN
    IF NEW.escalated_to IS NOT NULL THEN
      INSERT INTO public.notifications(user_id,title,message,type,priority,metadata)
        VALUES(NEW.escalated_to, '🤖 تصعيد محادثة AI',
          'تم تصعيد محادثة تحتاج تدخلك: ' || COALESCE(NEW.escalation_reason, ''),
          'ai_escalation', 'high',
          jsonb_build_object('conversation_id', NEW.id));
    END IF;
    INSERT INTO public.notifications(user_id,title,message,type,priority,metadata)
      SELECT om.user_id, '🤖 تصعيد محادثة',
        'محادثة AI تحتاج مراجعة',
        'ai_escalation', 'high',
        jsonb_build_object('conversation_id', NEW.id)
      FROM public.organization_members om
      WHERE om.organization_id = NEW.organization_id AND om.status = 'active'
        AND om.role IN ('admin','support') AND om.user_id IS DISTINCT FROM NEW.escalated_to;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;$$;
DROP TRIGGER IF EXISTS trg_notify_ai_conv ON public.ai_agent_conversations;
CREATE TRIGGER trg_notify_ai_conv AFTER UPDATE ON public.ai_agent_conversations
  FOR EACH ROW EXECUTE FUNCTION public.notify_ai_conversation();

-- 13) طلبات AI Agent (ai_agent_orders)
CREATE OR REPLACE FUNCTION public.notify_ai_order()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications(user_id,title,message,type,priority,metadata)
      SELECT om.user_id, '🤖 طلب جديد من AI',
        'طلب من ' || COALESCE(NEW.customer_name, 'عميل') || ' عبر ' || NEW.channel,
        'ai_order_created', 'high',
        jsonb_build_object('order_id', NEW.id, 'customer', NEW.customer_name)
      FROM public.organization_members om
      WHERE om.organization_id = NEW.organization_id AND om.status = 'active'
        AND om.role IN ('admin','sales','manager');
  END IF;
  RETURN NEW;
END;$$;
DROP TRIGGER IF EXISTS trg_notify_ai_order ON public.ai_agent_orders;
CREATE TRIGGER trg_notify_ai_order AFTER INSERT ON public.ai_agent_orders
  FOR EACH ROW EXECUTE FUNCTION public.notify_ai_order();
