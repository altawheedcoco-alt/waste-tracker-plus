
-- =========================================================
-- Helper function: notify all parties related to a resource
-- Inserts notifications for all members of specified orgs
-- The existing WhatsApp trigger handles sending automatically
-- =========================================================
CREATE OR REPLACE FUNCTION notify_related_parties(
  _org_id uuid,
  _partner_org_id uuid DEFAULT NULL,
  _shipment_id uuid DEFAULT NULL,
  _title text DEFAULT '',
  _message text DEFAULT '',
  _type text DEFAULT 'general',
  _reference_id text DEFAULT NULL,
  _reference_type text DEFAULT NULL,
  _exclude_user_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _all_org_ids uuid[];
  _gen_org uuid;
  _trans_org uuid;
  _rec_org uuid;
  _user_record record;
BEGIN
  -- Start with the primary org
  _all_org_ids := ARRAY[_org_id];

  -- Add partner org if provided
  IF _partner_org_id IS NOT NULL THEN
    _all_org_ids := array_append(_all_org_ids, _partner_org_id);
  END IF;

  -- If shipment linked, get all 3 parties
  IF _shipment_id IS NOT NULL THEN
    SELECT generator_organization_id, transporter_organization_id, recycler_organization_id
    INTO _gen_org, _trans_org, _rec_org
    FROM shipments WHERE id = _shipment_id;

    IF _gen_org IS NOT NULL AND NOT (_gen_org = ANY(_all_org_ids)) THEN
      _all_org_ids := array_append(_all_org_ids, _gen_org);
    END IF;
    IF _trans_org IS NOT NULL AND NOT (_trans_org = ANY(_all_org_ids)) THEN
      _all_org_ids := array_append(_all_org_ids, _trans_org);
    END IF;
    IF _rec_org IS NOT NULL AND NOT (_rec_org = ANY(_all_org_ids)) THEN
      _all_org_ids := array_append(_all_org_ids, _rec_org);
    END IF;
  END IF;

  -- Insert notification for every member of every org
  FOR _user_record IN
    SELECT DISTINCT p.id as user_id
    FROM profiles p
    WHERE p.organization_id = ANY(_all_org_ids)
      AND p.is_active = true
      AND (_exclude_user_id IS NULL OR p.id != _exclude_user_id)
  LOOP
    INSERT INTO notifications (user_id, title, message, type, is_read, shipment_id, reference_id, reference_type)
    VALUES (
      _user_record.user_id,
      _title,
      _message,
      _type,
      false,
      _shipment_id,
      _reference_id,
      _reference_type
    );
  END LOOP;
END;
$$;


-- =========================================================
-- TRIGGER 1: entity_documents (INSERT / DELETE)
-- =========================================================
CREATE OR REPLACE FUNCTION trg_notify_entity_document()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _title text;
  _message text;
  _doc_title text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    _doc_title := COALESCE(NEW.title, NEW.file_name, 'مستند');
    _title := '📎 مستند جديد: ' || _doc_title;
    _message := 'تم رفع مستند جديد "' || _doc_title || '" من نوع ' || COALESCE(NEW.document_type, 'عام');
    
    PERFORM notify_related_parties(
      NEW.organization_id,
      NEW.partner_organization_id,
      NEW.shipment_id,
      _title,
      _message,
      'document_uploaded',
      NEW.id,
      'entity_document',
      NEW.uploaded_by
    );
  ELSIF TG_OP = 'DELETE' THEN
    _doc_title := COALESCE(OLD.title, OLD.file_name, 'مستند');
    _title := '🗑️ حذف مستند: ' || _doc_title;
    _message := 'تم حذف المستند "' || _doc_title || '"';
    
    PERFORM notify_related_parties(
      OLD.organization_id,
      OLD.partner_organization_id,
      OLD.shipment_id,
      _title,
      _message,
      'document_deleted',
      OLD.id,
      'entity_document'
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_entity_document_notify ON entity_documents;
CREATE TRIGGER trg_entity_document_notify
  AFTER INSERT OR DELETE ON entity_documents
  FOR EACH ROW EXECUTE FUNCTION trg_notify_entity_document();


-- =========================================================
-- TRIGGER 2: document_signatures (INSERT)
-- =========================================================
CREATE OR REPLACE FUNCTION trg_notify_document_signature()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _title text;
  _message text;
  _shipment_id uuid;
  _doc_type text;
BEGIN
  _doc_type := COALESCE(NEW.document_type, 'مستند');
  _title := '✍️ توقيع جديد على ' || _doc_type;
  _message := 'قام ' || COALESCE(NEW.signer_name, 'مستخدم') || ' بالتوقيع على ' || _doc_type;
  
  IF NEW.stamp_applied = true THEN
    _message := _message || ' (مع ختم رسمي)';
  END IF;

  -- Try to find linked shipment through entity_documents
  SELECT ed.shipment_id INTO _shipment_id
  FROM entity_documents ed
  WHERE ed.id::text = NEW.document_id
  LIMIT 1;

  PERFORM notify_related_parties(
    NEW.organization_id,
    NULL,
    _shipment_id,
    _title,
    _message,
    'document_signed',
    NEW.id,
    'document_signature',
    NEW.signed_by
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_document_signature_notify ON document_signatures;
CREATE TRIGGER trg_document_signature_notify
  AFTER INSERT ON document_signatures
  FOR EACH ROW EXECUTE FUNCTION trg_notify_document_signature();


-- =========================================================
-- TRIGGER 3: invoices (INSERT / UPDATE on status)
-- =========================================================
CREATE OR REPLACE FUNCTION trg_notify_invoice()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _title text;
  _message text;
  _status_label text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    _title := '🧾 فاتورة جديدة #' || NEW.invoice_number;
    _message := 'تم إصدار فاتورة جديدة بقيمة ' || NEW.total_amount || ' ' || COALESCE(NEW.currency, 'ج.م');
    
    PERFORM notify_related_parties(
      NEW.organization_id,
      NEW.partner_organization_id,
      NULL,
      _title,
      _message,
      'invoice_created',
      NEW.id,
      'invoice',
      NEW.created_by
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    _status_label := CASE NEW.status
      WHEN 'paid' THEN 'مدفوعة'
      WHEN 'partially_paid' THEN 'مدفوعة جزئياً'
      WHEN 'overdue' THEN 'متأخرة'
      WHEN 'cancelled' THEN 'ملغاة'
      WHEN 'approved' THEN 'معتمدة'
      WHEN 'draft' THEN 'مسودة'
      ELSE NEW.status
    END;
    
    _title := '🧾 تحديث فاتورة #' || NEW.invoice_number;
    _message := 'تم تغيير حالة الفاتورة إلى: ' || _status_label || ' | المبلغ: ' || NEW.total_amount || ' ' || COALESCE(NEW.currency, 'ج.م');
    
    PERFORM notify_related_parties(
      NEW.organization_id,
      NEW.partner_organization_id,
      NULL,
      _title,
      _message,
      'invoice_updated',
      NEW.id,
      'invoice'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_invoice_notify ON invoices;
CREATE TRIGGER trg_invoice_notify
  AFTER INSERT OR UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION trg_notify_invoice();


-- =========================================================
-- TRIGGER 4: deposits (INSERT)
-- =========================================================
CREATE OR REPLACE FUNCTION trg_notify_deposit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _title text;
  _message text;
BEGIN
  _title := '💰 إيداع مالي جديد: ' || NEW.amount || ' ' || COALESCE(NEW.currency, 'ج.م');
  _message := 'تم تسجيل إيداع بقيمة ' || NEW.amount || ' ' || COALESCE(NEW.currency, 'ج.م') 
    || ' من ' || COALESCE(NEW.depositor_name, 'غير محدد')
    || ' | طريقة الدفع: ' || COALESCE(NEW.transfer_method, 'غير محدد');
  
  IF NEW.reference_number IS NOT NULL THEN
    _message := _message || ' | المرجع: ' || NEW.reference_number;
  END IF;

  PERFORM notify_related_parties(
    NEW.organization_id,
    NEW.partner_organization_id,
    NULL,
    _title,
    _message,
    'deposit_created',
    NEW.id,
    'deposit',
    NEW.created_by
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_deposit_notify ON deposits;
CREATE TRIGGER trg_deposit_notify
  AFTER INSERT ON deposits
  FOR EACH ROW EXECUTE FUNCTION trg_notify_deposit();
