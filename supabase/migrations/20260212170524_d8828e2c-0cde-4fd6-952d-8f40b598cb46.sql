
-- Add priority and metadata columns to notifications for driver assignment alerts
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL;

-- Create function to notify driver when assigned to a shipment
CREATE OR REPLACE FUNCTION public.notify_driver_on_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_driver_user_id UUID;
  v_driver_name TEXT;
  v_generator_name TEXT;
  v_transporter_name TEXT;
  v_recycler_name TEXT;
  v_disposal_name TEXT;
  v_pickup_address TEXT;
  v_delivery_address TEXT;
BEGIN
  -- Only fire when driver_id is set or changed
  IF (TG_OP = 'INSERT' AND NEW.driver_id IS NOT NULL)
     OR (TG_OP = 'UPDATE' AND NEW.driver_id IS DISTINCT FROM OLD.driver_id AND NEW.driver_id IS NOT NULL) THEN

    -- Get driver's user_id via profiles
    SELECT p.user_id, p.full_name INTO v_driver_user_id, v_driver_name
    FROM drivers d
    JOIN profiles p ON p.id = d.profile_id
    WHERE d.id = NEW.driver_id;

    IF v_driver_user_id IS NULL THEN
      RETURN NEW;
    END IF;

    -- Get organization names
    SELECT name INTO v_generator_name FROM organizations WHERE id = NEW.generator_id;
    SELECT name INTO v_transporter_name FROM organizations WHERE id = NEW.transporter_id;
    SELECT name INTO v_recycler_name FROM organizations WHERE id = NEW.recycler_id;
    SELECT name INTO v_disposal_name FROM organizations WHERE id = NEW.disposal_facility_id;

    -- Get addresses
    SELECT address INTO v_pickup_address FROM organizations WHERE id = NEW.generator_id;
    SELECT address INTO v_delivery_address FROM organizations WHERE id = COALESCE(NEW.recycler_id, NEW.disposal_facility_id);

    -- Insert priority notification
    INSERT INTO public.notifications (
      user_id, shipment_id, title, message, type, is_read, priority, metadata
    ) VALUES (
      v_driver_user_id,
      NEW.id,
      '🚛 مهمة شحنة جديدة - ' || COALESCE(NEW.shipment_number, 'بدون رقم'),
      'تم تعيينك لنقل شحنة ' || COALESCE(NEW.waste_type, 'نفايات') || ' بكمية ' || COALESCE(NEW.quantity::text, '0') || ' ' || COALESCE(NEW.unit, 'طن') || ' من ' || COALESCE(v_generator_name, 'المولد') || ' إلى ' || COALESCE(v_recycler_name, v_disposal_name, 'الوجهة'),
      'driver_assignment',
      false,
      'urgent',
      jsonb_build_object(
        'shipment_number', COALESCE(NEW.shipment_number, ''),
        'waste_type', COALESCE(NEW.waste_type, ''),
        'quantity', COALESCE(NEW.quantity, 0),
        'unit', COALESCE(NEW.unit, 'طن'),
        'generator_name', COALESCE(v_generator_name, ''),
        'transporter_name', COALESCE(v_transporter_name, ''),
        'recycler_name', COALESCE(v_recycler_name, ''),
        'disposal_name', COALESCE(v_disposal_name, ''),
        'pickup_address', COALESCE(v_pickup_address, ''),
        'delivery_address', COALESCE(v_delivery_address, ''),
        'driver_name', COALESCE(v_driver_name, ''),
        'status', COALESCE(NEW.status, ''),
        'notes', COALESCE(NEW.notes, '')
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on shipments table
DROP TRIGGER IF EXISTS trg_notify_driver_on_assignment ON public.shipments;
CREATE TRIGGER trg_notify_driver_on_assignment
  AFTER INSERT OR UPDATE ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_driver_on_assignment();
