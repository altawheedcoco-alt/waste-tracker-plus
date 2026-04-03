
-- Update shipment status change trigger to include driver and disposal facility
CREATE OR REPLACE FUNCTION public.notify_shipment_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _shipment_num text;
  _status_label text;
  _title text;
  _message text;
  _driver_user_id uuid;
BEGIN
  -- Only trigger on status change
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  _shipment_num := COALESCE(NEW.tracking_number, NEW.id::text);
  
  -- Map status to Arabic label
  _status_label := CASE NEW.status
    WHEN 'pending' THEN 'قيد الانتظار'
    WHEN 'accepted' THEN 'مقبولة'
    WHEN 'assigned' THEN 'تم التكليف'
    WHEN 'picked_up' THEN 'تم الاستلام'
    WHEN 'in_transit' THEN 'في الطريق'
    WHEN 'delivered' THEN 'تم التسليم'
    WHEN 'completed' THEN 'مكتملة'
    WHEN 'cancelled' THEN 'ملغاة'
    WHEN 'rejected' THEN 'مرفوضة'
    WHEN 'confirmed' THEN 'مؤكدة'
    WHEN 'new' THEN 'جديدة'
    WHEN 'approved' THEN 'معتمدة'
    WHEN 'collecting' THEN 'جاري التجميع'
    ELSE NEW.status
  END;

  _title := 'تحديث شحنة #' || _shipment_num;
  _message := 'تم تغيير حالة الشحنة إلى: ' || _status_label;

  -- Notify generator org members
  IF NEW.generator_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, priority, reference_id, reference_type, organization_id, shipment_id)
    SELECT p.user_id, _title, _message, 'shipment_status_change', 
           CASE WHEN NEW.status IN ('cancelled','rejected') THEN 'high' ELSE 'normal' END,
           NEW.id::text, 'shipment', NEW.generator_id, NEW.id
    FROM public.profiles p
    WHERE p.organization_id = NEW.generator_id AND p.is_active = true AND p.user_id IS NOT NULL;
  END IF;

  -- Notify transporter org members
  IF NEW.transporter_id IS NOT NULL AND NEW.transporter_id IS DISTINCT FROM NEW.generator_id THEN
    INSERT INTO public.notifications (user_id, title, message, type, priority, reference_id, reference_type, organization_id, shipment_id)
    SELECT p.user_id, _title, _message, 'shipment_status_change',
           CASE WHEN NEW.status IN ('cancelled','rejected') THEN 'high' ELSE 'normal' END,
           NEW.id::text, 'shipment', NEW.transporter_id, NEW.id
    FROM public.profiles p
    WHERE p.organization_id = NEW.transporter_id AND p.is_active = true AND p.user_id IS NOT NULL;
  END IF;

  -- Notify recycler org members
  IF NEW.recycler_id IS NOT NULL 
     AND NEW.recycler_id IS DISTINCT FROM NEW.generator_id 
     AND NEW.recycler_id IS DISTINCT FROM NEW.transporter_id THEN
    INSERT INTO public.notifications (user_id, title, message, type, priority, reference_id, reference_type, organization_id, shipment_id)
    SELECT p.user_id, _title, _message, 'shipment_status_change',
           CASE WHEN NEW.status IN ('cancelled','rejected') THEN 'high' ELSE 'normal' END,
           NEW.id::text, 'shipment', NEW.recycler_id, NEW.id
    FROM public.profiles p
    WHERE p.organization_id = NEW.recycler_id AND p.is_active = true AND p.user_id IS NOT NULL;
  END IF;

  -- Notify disposal facility org members (if different from recycler)
  IF NEW.disposal_facility_id IS NOT NULL
     AND NEW.disposal_facility_id IS DISTINCT FROM NEW.generator_id
     AND NEW.disposal_facility_id IS DISTINCT FROM NEW.transporter_id
     AND NEW.disposal_facility_id IS DISTINCT FROM NEW.recycler_id THEN
    INSERT INTO public.notifications (user_id, title, message, type, priority, reference_id, reference_type, organization_id, shipment_id)
    SELECT p.user_id, _title, _message, 'shipment_status_change',
           CASE WHEN NEW.status IN ('cancelled','rejected') THEN 'high' ELSE 'normal' END,
           NEW.id::text, 'shipment', NEW.disposal_facility_id, NEW.id
    FROM public.profiles p
    WHERE p.organization_id = NEW.disposal_facility_id AND p.is_active = true AND p.user_id IS NOT NULL;
  END IF;

  -- Notify assigned driver directly
  IF NEW.driver_id IS NOT NULL THEN
    SELECT user_id INTO _driver_user_id FROM public.drivers WHERE id = NEW.driver_id LIMIT 1;
    IF _driver_user_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, message, type, priority, reference_id, reference_type, shipment_id)
      VALUES (_driver_user_id, _title, _message, 'shipment_status_change',
              CASE WHEN NEW.status IN ('cancelled','rejected') THEN 'high' ELSE 'normal' END,
              NEW.id::text, 'shipment', NEW.id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS trg_shipment_status_notify ON public.shipments;
CREATE TRIGGER trg_shipment_status_notify
  AFTER UPDATE ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_shipment_status_change();
