
-- Create function to auto-notify on shipment status change
CREATE OR REPLACE FUNCTION public.notify_shipment_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _org_id uuid;
  _user_ids uuid[];
  _title text;
  _message text;
  _status_label text;
  _shipment_num text;
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
    ELSE NEW.status
  END;

  _title := 'تحديث شحنة #' || _shipment_num;
  _message := 'تم تغيير حالة الشحنة إلى: ' || _status_label;

  -- Notify generator org
  IF NEW.generator_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, priority, reference_id, reference_type, organization_id)
    SELECT p.user_id, _title, _message, 'shipment_status_change', 
           CASE WHEN NEW.status IN ('cancelled','rejected') THEN 'high' ELSE 'normal' END,
           NEW.id::text, 'shipment', NEW.generator_id
    FROM public.profiles p
    WHERE p.organization_id = NEW.generator_id AND p.is_active = true AND p.user_id IS NOT NULL;
  END IF;

  -- Notify transporter org
  IF NEW.transporter_id IS NOT NULL AND NEW.transporter_id != NEW.generator_id THEN
    INSERT INTO public.notifications (user_id, title, message, type, priority, reference_id, reference_type, organization_id)
    SELECT p.user_id, _title, _message, 'shipment_status_change',
           CASE WHEN NEW.status IN ('cancelled','rejected') THEN 'high' ELSE 'normal' END,
           NEW.id::text, 'shipment', NEW.transporter_id
    FROM public.profiles p
    WHERE p.organization_id = NEW.transporter_id AND p.is_active = true AND p.user_id IS NOT NULL;
  END IF;

  -- Notify recycler/disposal org
  IF NEW.recycler_id IS NOT NULL AND NEW.recycler_id != NEW.generator_id AND NEW.recycler_id != NEW.transporter_id THEN
    INSERT INTO public.notifications (user_id, title, message, type, priority, reference_id, reference_type, organization_id)
    SELECT p.user_id, _title, _message, 'shipment_status_change',
           CASE WHEN NEW.status IN ('cancelled','rejected') THEN 'high' ELSE 'normal' END,
           NEW.id::text, 'shipment', NEW.recycler_id
    FROM public.profiles p
    WHERE p.organization_id = NEW.recycler_id AND p.is_active = true AND p.user_id IS NOT NULL;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trg_shipment_status_notify ON public.shipments;
CREATE TRIGGER trg_shipment_status_notify
  AFTER UPDATE ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_shipment_status_change();
