
CREATE OR REPLACE FUNCTION notify_driver_on_assignment()
RETURNS TRIGGER AS $$
DECLARE
  v_driver_user_id UUID;
  v_generator_name TEXT;
  v_transporter_name TEXT;
  v_recycler_name TEXT;
  v_disposal_name TEXT;
  v_driver_name TEXT;
  v_pickup_address TEXT;
  v_delivery_address TEXT;
BEGIN
  -- Only trigger when driver_id changes from NULL to a value or changes
  IF (TG_OP = 'INSERT' AND NEW.driver_id IS NOT NULL) OR 
     (TG_OP = 'UPDATE' AND NEW.driver_id IS DISTINCT FROM OLD.driver_id AND NEW.driver_id IS NOT NULL) THEN
    
    -- Get driver's user_id
    SELECT user_id INTO v_driver_user_id FROM public.drivers WHERE id = NEW.driver_id;
    
    IF v_driver_user_id IS NULL THEN
      RETURN NEW;
    END IF;

    -- Get names
    SELECT name INTO v_generator_name FROM public.organizations WHERE id = NEW.generator_id;
    SELECT name INTO v_transporter_name FROM public.organizations WHERE id = NEW.transporter_id;
    SELECT name INTO v_recycler_name FROM public.organizations WHERE id = NEW.recycler_id;
    SELECT name INTO v_disposal_name FROM public.organizations WHERE id = NEW.disposal_facility_id;
    SELECT full_name INTO v_driver_name FROM public.profiles WHERE id = v_driver_user_id;

    v_pickup_address := COALESCE(NEW.pickup_address, '');
    v_delivery_address := COALESCE(NEW.delivery_address, '');

    INSERT INTO public.notifications (
      user_id, shipment_id, title, message, type, is_read, priority, metadata
    ) VALUES (
      v_driver_user_id,
      NEW.id,
      '🚛 مهمة شحنة جديدة - ' || COALESCE(NEW.shipment_number, 'بدون رقم'),
      'تم تعيينك لنقل شحنة ' || COALESCE(NEW.waste_type::text, 'نفايات') || ' بكمية ' || COALESCE(NEW.quantity::text, '0') || ' ' || COALESCE(NEW.unit, 'طن') || ' من ' || COALESCE(v_generator_name, 'المولد') || ' إلى ' || COALESCE(v_recycler_name, v_disposal_name, 'الوجهة'),
      'driver_assignment',
      false,
      'urgent',
      jsonb_build_object(
        'shipment_number', COALESCE(NEW.shipment_number, ''),
        'waste_type', COALESCE(NEW.waste_type::text, ''),
        'quantity', COALESCE(NEW.quantity, 0),
        'unit', COALESCE(NEW.unit, 'طن'),
        'generator_name', COALESCE(v_generator_name, ''),
        'transporter_name', COALESCE(v_transporter_name, ''),
        'recycler_name', COALESCE(v_recycler_name, ''),
        'disposal_name', COALESCE(v_disposal_name, ''),
        'pickup_address', v_pickup_address,
        'delivery_address', v_delivery_address,
        'driver_name', COALESCE(v_driver_name, ''),
        'status', COALESCE(NEW.status::text, ''),
        'notes', COALESCE(NEW.notes, '')
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
