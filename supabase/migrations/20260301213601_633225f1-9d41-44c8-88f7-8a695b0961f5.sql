CREATE OR REPLACE FUNCTION public.trigger_whatsapp_shipment_status()
RETURNS TRIGGER AS $$
DECLARE
  _event_type text;
  _org_ids text[];
  _org_id text;
  _gen_name text;
  _trans_name text;
  _rec_name text;
  _driver_name text;
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  CASE NEW.status::text
    WHEN 'new' THEN _event_type := 'shipment_created';
    WHEN 'approved' THEN _event_type := 'shipment_approved';
    WHEN 'collecting' THEN _event_type := 'shipment_collecting';
    WHEN 'in_transit' THEN _event_type := 'shipment_in_transit';
    WHEN 'delivered' THEN _event_type := 'shipment_delivered';
    WHEN 'confirmed' THEN _event_type := 'shipment_confirmed';
    WHEN 'cancelled' THEN _event_type := 'shipment_cancelled';
    ELSE RETURN NEW;
  END CASE;

  SELECT name INTO _gen_name FROM organizations WHERE id = NEW.generator_id;
  SELECT name INTO _trans_name FROM organizations WHERE id = NEW.transporter_id;
  SELECT name INTO _rec_name FROM organizations WHERE id = NEW.recycler_id;
  
  IF NEW.driver_id IS NOT NULL THEN
    SELECT full_name INTO _driver_name FROM profiles WHERE id = NEW.driver_id;
  END IF;

  _org_ids := ARRAY[]::text[];
  IF NEW.generator_id IS NOT NULL THEN _org_ids := _org_ids || NEW.generator_id::text; END IF;
  IF NEW.transporter_id IS NOT NULL THEN _org_ids := _org_ids || NEW.transporter_id::text; END IF;
  IF NEW.recycler_id IS NOT NULL THEN _org_ids := _org_ids || NEW.recycler_id::text; END IF;

  FOREACH _org_id IN ARRAY _org_ids
  LOOP
    BEGIN
      PERFORM dispatch_whatsapp_event(jsonb_build_object(
        'event_type', _event_type,
        'organization_id', _org_id,
        'shipment_id', NEW.id,
        'shipment_number', NEW.shipment_number,
        'status', NEW.status::text,
        'old_status', OLD.status::text,
        'waste_type', NEW.waste_type,
        'generator_name', _gen_name,
        'transporter_name', _trans_name,
        'recycler_name', _rec_name,
        'driver_name', _driver_name
      ));
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'WhatsApp dispatch failed: %', SQLERRM;
    END;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;