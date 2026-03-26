
-- Trigger function: auto-create notifications for all shipment parties on new shipment
CREATE OR REPLACE FUNCTION public.notify_shipment_parties()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_ids uuid[];
  member_record RECORD;
  shipment_num text;
BEGIN
  -- Collect all party org IDs (non-null)
  org_ids := ARRAY[]::uuid[];
  IF NEW.generator_id IS NOT NULL THEN org_ids := org_ids || NEW.generator_id; END IF;
  IF NEW.transporter_id IS NOT NULL THEN org_ids := org_ids || NEW.transporter_id; END IF;
  IF NEW.recycler_id IS NOT NULL THEN org_ids := org_ids || NEW.recycler_id; END IF;
  IF NEW.disposal_facility_id IS NOT NULL THEN org_ids := org_ids || NEW.disposal_facility_id; END IF;

  shipment_num := COALESCE(NEW.shipment_number, NEW.id::text);

  -- Insert notification for each member of each party org (excluding creator)
  FOR member_record IN
    SELECT DISTINCT p.id as user_id, o.name as org_name
    FROM profiles p
    JOIN organizations o ON o.id = p.organization_id
    WHERE p.organization_id = ANY(org_ids)
      AND p.id != COALESCE(NEW.created_by, '00000000-0000-0000-0000-000000000000')
  LOOP
    INSERT INTO notifications (user_id, title, message, type, is_read, shipment_id, reference_id, reference_type)
    VALUES (
      member_record.user_id,
      '🚛 شحنة جديدة - ' || shipment_num,
      'تم إنشاء شحنة جديدة تتضمن منشأتكم',
      'shipment_created',
      false,
      NEW.id,
      NEW.id,
      'shipment'
    );
  END LOOP;

  -- Also notify the creator with a confirmation
  IF NEW.created_by IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, message, type, is_read, shipment_id, reference_id, reference_type)
    VALUES (
      NEW.created_by,
      '✅ تم إنشاء الشحنة - ' || shipment_num,
      'تم إنشاء شحنتك بنجاح وإشعار جميع الأطراف',
      'shipment_created',
      false,
      NEW.id,
      NEW.id,
      'shipment'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on shipments table
DROP TRIGGER IF EXISTS trg_notify_shipment_parties ON shipments;
CREATE TRIGGER trg_notify_shipment_parties
  AFTER INSERT ON shipments
  FOR EACH ROW
  EXECUTE FUNCTION notify_shipment_parties();

-- Also create trigger for shipment STATUS changes
CREATE OR REPLACE FUNCTION public.notify_shipment_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_ids uuid[];
  member_record RECORD;
  shipment_num text;
  status_label text;
BEGIN
  -- Only fire on status change
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;

  org_ids := ARRAY[]::uuid[];
  IF NEW.generator_id IS NOT NULL THEN org_ids := org_ids || NEW.generator_id; END IF;
  IF NEW.transporter_id IS NOT NULL THEN org_ids := org_ids || NEW.transporter_id; END IF;
  IF NEW.recycler_id IS NOT NULL THEN org_ids := org_ids || NEW.recycler_id; END IF;
  IF NEW.disposal_facility_id IS NOT NULL THEN org_ids := org_ids || NEW.disposal_facility_id; END IF;

  shipment_num := COALESCE(NEW.shipment_number, NEW.id::text);

  -- Map status to Arabic label
  status_label := CASE NEW.status
    WHEN 'approved' THEN 'تمت الموافقة'
    WHEN 'collecting' THEN 'جاري التحصيل'
    WHEN 'in_transit' THEN 'في الطريق'
    WHEN 'delivered' THEN 'تم التسليم'
    WHEN 'confirmed' THEN 'تم التأكيد'
    WHEN 'cancelled' THEN 'ملغية'
    WHEN 'rejected' THEN 'مرفوضة'
    ELSE NEW.status
  END;

  FOR member_record IN
    SELECT DISTINCT p.id as user_id
    FROM profiles p
    WHERE p.organization_id = ANY(org_ids)
  LOOP
    INSERT INTO notifications (user_id, title, message, type, is_read, shipment_id, reference_id, reference_type)
    VALUES (
      member_record.user_id,
      '📦 تحديث حالة - ' || shipment_num,
      'تم تحديث حالة الشحنة إلى: ' || status_label,
      'shipment_status',
      false,
      NEW.id,
      NEW.id,
      'shipment'
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_shipment_status_change ON shipments;
CREATE TRIGGER trg_notify_shipment_status_change
  AFTER UPDATE ON shipments
  FOR EACH ROW
  EXECUTE FUNCTION notify_shipment_status_change();
