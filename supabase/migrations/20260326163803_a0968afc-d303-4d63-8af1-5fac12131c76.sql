
-- ========================================
-- 1. Wallet Transaction → notify wallet owner
-- ========================================
CREATE OR REPLACE FUNCTION public.notify_wallet_transaction()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  wallet_owner_id uuid;
  tx_label text;
BEGIN
  SELECT user_id INTO wallet_owner_id FROM driver_wallets WHERE id = NEW.wallet_id;
  IF wallet_owner_id IS NULL THEN RETURN NEW; END IF;

  tx_label := CASE NEW.transaction_type
    WHEN 'deposit' THEN '💰 إيداع' WHEN 'withdrawal' THEN '💸 سحب'
    WHEN 'escrow_hold' THEN '🔒 حجز ضمان' WHEN 'escrow_release' THEN '🔓 تحرير ضمان'
    WHEN 'earning' THEN '💵 أرباح' ELSE '💳 معاملة مالية' END;

  INSERT INTO notifications (user_id, title, message, type, is_read, reference_id, reference_type)
  VALUES (wallet_owner_id, tx_label, COALESCE(NEW.description, 'مبلغ: ' || NEW.amount::text || ' ج.م'), 'wallet', false, NEW.id, 'wallet_transaction');
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_wallet_transaction ON wallet_transactions;
CREATE TRIGGER trg_notify_wallet_transaction AFTER INSERT ON wallet_transactions FOR EACH ROW EXECUTE FUNCTION notify_wallet_transaction();

-- ========================================
-- 2. Vehicle Maintenance → notify org supervisors
-- ========================================
CREATE OR REPLACE FUNCTION public.notify_vehicle_maintenance()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  member_rec RECORD;
BEGIN
  FOR member_rec IN
    SELECT DISTINCT p.id as user_id FROM profiles p WHERE p.organization_id = NEW.organization_id
  LOOP
    INSERT INTO notifications (user_id, title, message, type, is_read, reference_id, reference_type)
    VALUES (member_rec.user_id, '🔧 صيانة مركبة', 'تم تسجيل طلب صيانة: ' || COALESCE(NEW.maintenance_type, 'عامة'), 'vehicle_maintenance', false, NEW.id, 'vehicle_maintenance');
  END LOOP;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_vehicle_maintenance ON vehicle_maintenance;
CREATE TRIGGER trg_notify_vehicle_maintenance AFTER INSERT ON vehicle_maintenance FOR EACH ROW EXECUTE FUNCTION notify_vehicle_maintenance();

-- ========================================
-- 3. Vehicle Maintenance Status Change → notify
-- ========================================
CREATE OR REPLACE FUNCTION public.notify_vehicle_maintenance_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  member_rec RECORD;
  status_label text;
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;
  status_label := CASE NEW.status
    WHEN 'completed' THEN 'اكتملت' WHEN 'in_progress' THEN 'قيد التنفيذ'
    WHEN 'cancelled' THEN 'ملغاة' ELSE NEW.status END;

  FOR member_rec IN
    SELECT DISTINCT p.id as user_id FROM profiles p WHERE p.organization_id = NEW.organization_id
  LOOP
    INSERT INTO notifications (user_id, title, message, type, is_read, reference_id, reference_type)
    VALUES (member_rec.user_id, '🔧 تحديث صيانة المركبة', 'حالة الصيانة: ' || status_label, 'vehicle_maintenance', false, NEW.id, 'vehicle_maintenance');
  END LOOP;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_vehicle_maintenance_status ON vehicle_maintenance;
CREATE TRIGGER trg_notify_vehicle_maintenance_status AFTER UPDATE ON vehicle_maintenance FOR EACH ROW EXECUTE FUNCTION notify_vehicle_maintenance_status();

-- ========================================
-- 4. Manual Shipment Draft → notify org on status change
-- ========================================
CREATE OR REPLACE FUNCTION public.notify_manual_draft_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  member_rec RECORD;
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;
  IF NEW.status NOT IN ('approved', 'rejected', 'converted') THEN RETURN NEW; END IF;

  FOR member_rec IN
    SELECT DISTINCT p.id as user_id FROM profiles p WHERE p.organization_id = NEW.organization_id
  LOOP
    INSERT INTO notifications (user_id, title, message, type, is_read, reference_id, reference_type)
    VALUES (member_rec.user_id,
      CASE NEW.status WHEN 'approved' THEN '✅ تم اعتماد المسودة' WHEN 'rejected' THEN '❌ تم رفض المسودة' WHEN 'converted' THEN '🔄 تم تحويل المسودة لشحنة' END,
      'تم تحديث حالة مسودة الشحنة', 'draft_status', false, NEW.id, 'manual_draft');
  END LOOP;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_manual_draft_status ON manual_shipment_drafts;
CREATE TRIGGER trg_notify_manual_draft_status AFTER UPDATE ON manual_shipment_drafts FOR EACH ROW EXECUTE FUNCTION notify_manual_draft_status();

-- ========================================
-- 5. Loading Worker status change → notify org
-- ========================================
CREATE OR REPLACE FUNCTION public.notify_loading_worker_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  member_rec RECORD;
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;

  FOR member_rec IN
    SELECT DISTINCT p.id as user_id FROM profiles p
    JOIN organization_members om ON om.organization_id = NEW.organization_id AND (om.profile_id = p.id OR om.user_id = p.id)
    WHERE om.member_role IN ('owner','admin','manager')
  LOOP
    INSERT INTO notifications (user_id, title, message, type, is_read, reference_id, reference_type)
    VALUES (member_rec.user_id, '👷 تحديث حالة عامل التحميل', 'تم تغيير حالة العامل إلى: ' || NEW.status, 'loading_worker', false, NEW.id, 'loading_worker');
  END LOOP;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_loading_worker_status ON loading_workers;
CREATE TRIGGER trg_notify_loading_worker_status AFTER UPDATE ON loading_workers FOR EACH ROW EXECUTE FUNCTION notify_loading_worker_status();

-- ========================================
-- 6. Municipal Contract status change → notify
-- ========================================
CREATE OR REPLACE FUNCTION public.notify_municipal_contract_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  member_rec RECORD;
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;

  FOR member_rec IN
    SELECT DISTINCT p.id as user_id FROM profiles p WHERE p.organization_id = NEW.organization_id
  LOOP
    INSERT INTO notifications (user_id, title, message, type, is_read, reference_id, reference_type)
    VALUES (member_rec.user_id, '📜 تحديث العقد البلدي', 'تم تحديث حالة العقد ' || COALESCE(NEW.contract_number, '') || ' إلى: ' || NEW.status, 'municipal_contract', false, NEW.id, 'municipal_contract');
  END LOOP;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_municipal_contract_status ON municipal_contracts;
CREATE TRIGGER trg_notify_municipal_contract_status AFTER UPDATE ON municipal_contracts FOR EACH ROW EXECUTE FUNCTION notify_municipal_contract_status();
