
CREATE OR REPLACE FUNCTION public.trg_notify_shipment_created()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  _ship_num text;
  _gen_name text;
BEGIN
  _ship_num := COALESCE(NEW.shipment_number, 'بدون رقم');
  
  -- Get generator org name
  SELECT o.name INTO _gen_name 
  FROM organizations o 
  WHERE o.id = NEW.generator_id;
  _gen_name := COALESCE(_gen_name, 'مولّد');

  -- Notify transporter org members
  IF NEW.transporter_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, message, type, is_read, shipment_id)
    SELECT p.id, '📦 شحنة جديدة #' || _ship_num, 
      'تم إسناد شحنة جديدة إليكم من ' || _gen_name || ' - يرجى المراجعة والقبول',
      'new_shipment', false, NEW.id
    FROM profiles p WHERE p.organization_id = NEW.transporter_id AND p.is_active = true;
  END IF;

  -- Notify recycler org members
  IF NEW.recycler_id IS NOT NULL AND NEW.recycler_id IS DISTINCT FROM NEW.transporter_id THEN
    INSERT INTO notifications (user_id, title, message, type, is_read, shipment_id)
    SELECT p.id, '📦 شحنة واردة #' || _ship_num, 
      'شحنة جديدة في الطريق إليكم من ' || _gen_name,
      'new_shipment', false, NEW.id
    FROM profiles p WHERE p.organization_id = NEW.recycler_id AND p.is_active = true;
  END IF;
  
  RETURN NEW;
END;
$$;
