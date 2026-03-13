
CREATE OR REPLACE FUNCTION public.trg_notify_shipment_created()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  _ship_num text;
  _gen_name text;
  _gen_org_id uuid;
  _trans_org_id uuid;
  _recycler_org_id uuid;
BEGIN
  _ship_num := COALESCE(NEW.shipment_number, 'بدون رقم');
  _gen_org_id := (SELECT organization_id FROM profiles WHERE id = NEW.generator_id LIMIT 1);
  _trans_org_id := (SELECT organization_id FROM profiles WHERE id = NEW.transporter_id LIMIT 1);
  SELECT name INTO _gen_name FROM organizations WHERE id = _gen_org_id;
  _gen_name := COALESCE(_gen_name, 'مولّد');

  IF NEW.transporter_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, message, type, is_read, shipment_id)
    VALUES (NEW.transporter_id, '📦 شحنة جديدة #' || _ship_num,
      'تم إسناد شحنة جديدة إليكم من ' || _gen_name || ' - يرجى المراجعة والقبول',
      'new_shipment', false, NEW.id);
    IF _trans_org_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, title, message, type, is_read, shipment_id)
      SELECT p.id, '📦 شحنة جديدة #' || _ship_num, 'تم إسناد شحنة جديدة من ' || _gen_name,
        'new_shipment', false, NEW.id
      FROM profiles p WHERE p.organization_id = _trans_org_id AND p.id != NEW.transporter_id AND p.is_active = true;
    END IF;
  END IF;

  IF NEW.recycler_id IS NOT NULL AND NEW.recycler_id IS DISTINCT FROM NEW.transporter_id THEN
    _recycler_org_id := (SELECT organization_id FROM profiles WHERE id = NEW.recycler_id LIMIT 1);
    IF _recycler_org_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, title, message, type, is_read, shipment_id)
      SELECT p.id, '📦 شحنة واردة #' || _ship_num, 'شحنة جديدة في الطريق إليكم من ' || _gen_name,
        'new_shipment', false, NEW.id
      FROM profiles p WHERE p.organization_id = _recycler_org_id AND p.is_active = true;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
