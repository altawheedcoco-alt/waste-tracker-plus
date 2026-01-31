-- Update notify_new_shipment function to also send confirmation notification to the creator
CREATE OR REPLACE FUNCTION public.notify_new_shipment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_generator_user_ids UUID[];
  v_recycler_user_ids UUID[];
  v_transporter_user_ids UUID[];
  v_driver_user_id UUID;
  v_user_id UUID;
  v_creator_user_id UUID;
  v_title TEXT;
  v_message TEXT;
  v_is_driver_created BOOLEAN;
BEGIN
  v_title := 'شحنة جديدة ' || NEW.shipment_number;
  v_message := 'تم إنشاء شحنة جديدة تتضمن منشأتكم';

  -- Get creator's user_id
  SELECT p.user_id INTO v_creator_user_id
  FROM profiles p
  WHERE p.id = NEW.created_by;

  -- Check if created by a driver
  SELECT EXISTS (
    SELECT 1 FROM drivers d 
    JOIN profiles p ON p.id = d.profile_id 
    WHERE p.id = NEW.created_by
  ) INTO v_is_driver_created;

  -- Get user IDs from generator organization
  SELECT ARRAY_AGG(p.user_id) INTO v_generator_user_ids
  FROM profiles p
  WHERE p.organization_id = NEW.generator_id AND p.is_active = true;

  -- Get user IDs from recycler organization
  SELECT ARRAY_AGG(p.user_id) INTO v_recycler_user_ids
  FROM profiles p
  WHERE p.organization_id = NEW.recycler_id AND p.is_active = true;

  -- Get user IDs from transporter organization (for driver-created shipments)
  SELECT ARRAY_AGG(p.user_id) INTO v_transporter_user_ids
  FROM profiles p
  WHERE p.organization_id = NEW.transporter_id AND p.is_active = true;

  -- Get driver's user_id if shipment is assigned to a driver
  IF NEW.driver_id IS NOT NULL THEN
    SELECT p.user_id INTO v_driver_user_id
    FROM drivers d
    JOIN profiles p ON p.id = d.profile_id
    WHERE d.id = NEW.driver_id;
  END IF;

  -- Send confirmation notification to creator (sender)
  IF v_creator_user_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.user_id = v_creator_user_id
        AND n.type = 'shipment_created'
        AND n.shipment_id = NEW.id
        AND n.title = 'تم إنشاء الشحنة بنجاح'
    ) THEN
      INSERT INTO notifications (user_id, title, message, type, shipment_id)
      VALUES (
        v_creator_user_id, 
        'تم إنشاء الشحنة بنجاح', 
        'تم إنشاء الشحنة ' || NEW.shipment_number || ' بنجاح وإرسالها للأطراف المعنية', 
        'shipment_created', 
        NEW.id
      );
    END IF;
  END IF;

  -- Send notifications to generator users (excluding creator to avoid duplicate)
  IF v_generator_user_ids IS NOT NULL THEN
    FOREACH v_user_id IN ARRAY v_generator_user_ids
    LOOP
      IF v_user_id != COALESCE(v_creator_user_id, '00000000-0000-0000-0000-000000000000'::uuid) THEN
        IF NOT EXISTS (
          SELECT 1 FROM notifications n
          WHERE n.user_id = v_user_id
            AND n.type = 'shipment_created'
            AND n.shipment_id = NEW.id
            AND n.title = v_title
            AND n.message = v_message
        ) THEN
          INSERT INTO notifications (user_id, title, message, type, shipment_id)
          VALUES (v_user_id, v_title, v_message, 'shipment_created', NEW.id);
        END IF;
      END IF;
    END LOOP;
  END IF;

  -- Send notifications to recycler users (excluding creator)
  IF v_recycler_user_ids IS NOT NULL THEN
    FOREACH v_user_id IN ARRAY v_recycler_user_ids
    LOOP
      IF v_user_id != COALESCE(v_creator_user_id, '00000000-0000-0000-0000-000000000000'::uuid) THEN
        IF NOT EXISTS (
          SELECT 1 FROM notifications n
          WHERE n.user_id = v_user_id
            AND n.type = 'shipment_created'
            AND n.shipment_id = NEW.id
            AND n.title = v_title
            AND n.message = v_message
        ) THEN
          INSERT INTO notifications (user_id, title, message, type, shipment_id)
          VALUES (v_user_id, v_title, v_message, 'shipment_created', NEW.id);
        END IF;
      END IF;
    END LOOP;
  END IF;

  -- Send notifications to transporter users (excluding creator)
  IF v_transporter_user_ids IS NOT NULL THEN
    FOREACH v_user_id IN ARRAY v_transporter_user_ids
    LOOP
      IF v_user_id != COALESCE(v_creator_user_id, '00000000-0000-0000-0000-000000000000'::uuid) THEN
        IF NOT EXISTS (
          SELECT 1 FROM notifications n
          WHERE n.user_id = v_user_id
            AND n.type = 'shipment_created'
            AND n.shipment_id = NEW.id
            AND n.title = v_title
            AND n.message = v_message
        ) THEN
          INSERT INTO notifications (user_id, title, message, type, shipment_id)
          VALUES (v_user_id, v_title, v_message, 'shipment_created', NEW.id);
        END IF;
      END IF;
    END LOOP;
  END IF;

  -- Send notification to assigned driver if different from creator
  IF v_driver_user_id IS NOT NULL AND v_driver_user_id != COALESCE(v_creator_user_id, '00000000-0000-0000-0000-000000000000'::uuid) THEN
    -- Check if driver wasn't already notified as part of transporter org
    IF NOT (v_transporter_user_ids IS NOT NULL AND v_driver_user_id = ANY(v_transporter_user_ids)) THEN
      IF NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.user_id = v_driver_user_id
          AND n.type = 'shipment_assigned'
          AND n.shipment_id = NEW.id
          AND n.title = 'شحنة جديدة مسندة إليك'
          AND n.message = ('تم إسناد شحنة جديدة ' || NEW.shipment_number || ' إليك')
      ) THEN
        INSERT INTO notifications (user_id, title, message, type, shipment_id)
        VALUES (v_driver_user_id, 'شحنة جديدة مسندة إليك', 'تم إسناد شحنة جديدة ' || NEW.shipment_number || ' إليك', 'shipment_assigned', NEW.id);
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;