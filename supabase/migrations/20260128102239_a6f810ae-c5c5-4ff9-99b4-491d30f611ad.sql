-- Create function to send notifications on shipment status change
CREATE OR REPLACE FUNCTION public.notify_shipment_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_generator_user_ids UUID[];
  v_transporter_user_ids UUID[];
  v_recycler_user_ids UUID[];
  v_user_id UUID;
  v_status_label TEXT;
  v_title TEXT;
  v_message TEXT;
BEGIN
  -- Only trigger on status change
  IF OLD.status IS NOT NULL AND OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Get status label in Arabic
  v_status_label := CASE NEW.status
    WHEN 'new' THEN 'جديدة'
    WHEN 'approved' THEN 'معتمدة'
    WHEN 'collecting' THEN 'جاري التجميع'
    WHEN 'in_transit' THEN 'في الطريق'
    WHEN 'delivered' THEN 'تم التسليم'
    WHEN 'confirmed' THEN 'مكتملة'
    ELSE NEW.status::TEXT
  END;

  v_title := 'تحديث حالة الشحنة ' || NEW.shipment_number;
  v_message := 'تم تغيير حالة الشحنة إلى: ' || v_status_label;

  -- Get user IDs from generator organization
  SELECT ARRAY_AGG(p.user_id) INTO v_generator_user_ids
  FROM profiles p
  WHERE p.organization_id = NEW.generator_id AND p.is_active = true;

  -- Get user IDs from transporter organization
  SELECT ARRAY_AGG(p.user_id) INTO v_transporter_user_ids
  FROM profiles p
  WHERE p.organization_id = NEW.transporter_id AND p.is_active = true;

  -- Get user IDs from recycler organization
  SELECT ARRAY_AGG(p.user_id) INTO v_recycler_user_ids
  FROM profiles p
  WHERE p.organization_id = NEW.recycler_id AND p.is_active = true;

  -- Send notifications to generator users
  IF v_generator_user_ids IS NOT NULL THEN
    FOREACH v_user_id IN ARRAY v_generator_user_ids
    LOOP
      INSERT INTO notifications (user_id, title, message, type, shipment_id)
      VALUES (v_user_id, v_title, v_message, 'shipment_status', NEW.id);
    END LOOP;
  END IF;

  -- Send notifications to transporter users
  IF v_transporter_user_ids IS NOT NULL THEN
    FOREACH v_user_id IN ARRAY v_transporter_user_ids
    LOOP
      INSERT INTO notifications (user_id, title, message, type, shipment_id)
      VALUES (v_user_id, v_title, v_message, 'shipment_status', NEW.id);
    END LOOP;
  END IF;

  -- Send notifications to recycler users
  IF v_recycler_user_ids IS NOT NULL THEN
    FOREACH v_user_id IN ARRAY v_recycler_user_ids
    LOOP
      INSERT INTO notifications (user_id, title, message, type, shipment_id)
      VALUES (v_user_id, v_title, v_message, 'shipment_status', NEW.id);
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for shipment status changes
DROP TRIGGER IF EXISTS trigger_shipment_status_notification ON public.shipments;
CREATE TRIGGER trigger_shipment_status_notification
AFTER UPDATE ON public.shipments
FOR EACH ROW
EXECUTE FUNCTION public.notify_shipment_status_change();

-- Also create a function for new shipment notifications
CREATE OR REPLACE FUNCTION public.notify_new_shipment()
RETURNS TRIGGER AS $$
DECLARE
  v_generator_user_ids UUID[];
  v_recycler_user_ids UUID[];
  v_user_id UUID;
  v_title TEXT;
  v_message TEXT;
BEGIN
  v_title := 'شحنة جديدة ' || NEW.shipment_number;
  v_message := 'تم إنشاء شحنة جديدة تتضمن منشأتكم';

  -- Get user IDs from generator organization
  SELECT ARRAY_AGG(p.user_id) INTO v_generator_user_ids
  FROM profiles p
  WHERE p.organization_id = NEW.generator_id AND p.is_active = true;

  -- Get user IDs from recycler organization
  SELECT ARRAY_AGG(p.user_id) INTO v_recycler_user_ids
  FROM profiles p
  WHERE p.organization_id = NEW.recycler_id AND p.is_active = true;

  -- Send notifications to generator users
  IF v_generator_user_ids IS NOT NULL THEN
    FOREACH v_user_id IN ARRAY v_generator_user_ids
    LOOP
      INSERT INTO notifications (user_id, title, message, type, shipment_id)
      VALUES (v_user_id, v_title, v_message, 'shipment_created', NEW.id);
    END LOOP;
  END IF;

  -- Send notifications to recycler users
  IF v_recycler_user_ids IS NOT NULL THEN
    FOREACH v_user_id IN ARRAY v_recycler_user_ids
    LOOP
      INSERT INTO notifications (user_id, title, message, type, shipment_id)
      VALUES (v_user_id, v_title, v_message, 'shipment_created', NEW.id);
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new shipments
DROP TRIGGER IF EXISTS trigger_new_shipment_notification ON public.shipments;
CREATE TRIGGER trigger_new_shipment_notification
AFTER INSERT ON public.shipments
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_shipment();