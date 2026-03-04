
CREATE OR REPLACE FUNCTION public.trigger_whatsapp_on_shipment_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_type text;
  v_shipment_number text;
  v_generator_org_id uuid;
  v_transporter_org_id uuid;
  v_recycler_org_id uuid;
  v_driver_name text;
  v_driver_phone text;
  v_url text;
  v_key text;
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  v_event_type := CASE NEW.status
    WHEN 'approved' THEN 'shipment_approved'
    WHEN 'in_transit' THEN 'shipment_in_transit'
    WHEN 'delivered' THEN 'shipment_delivered'
    WHEN 'confirmed' THEN 'shipment_completed'
    ELSE NULL
  END;

  IF v_event_type IS NULL THEN
    RETURN NEW;
  END IF;

  v_shipment_number := NEW.shipment_number;
  v_generator_org_id := NEW.generator_id;
  v_transporter_org_id := NEW.transporter_id;
  v_recycler_org_id := NEW.recycler_id;

  IF NEW.driver_id IS NOT NULL THEN
    SELECT p.full_name, p.phone INTO v_driver_name, v_driver_phone
    FROM drivers d
    JOIN profiles p ON p.id = d.profile_id
    WHERE d.id = NEW.driver_id;
  END IF;

  v_url := 'https://jejwizkssmqzxwseqsre.supabase.co';
  v_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Implandpemtzc21xenh3c2Vxc3JlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MDI2MTcsImV4cCI6MjA4NTM3ODYxN30.cuO0gX41P_QIdCrdj4-yw8q8otcr-hUPDySuoXNiUPY';

  PERFORM net.http_post(
    url := v_url || '/functions/v1/whatsapp-event',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_key,
      'apikey', v_key
    ),
    body := jsonb_build_object(
      'event_type', v_event_type,
      'shipment_id', NEW.id,
      'shipment_number', v_shipment_number,
      'generator_org_id', v_generator_org_id,
      'transporter_org_id', v_transporter_org_id,
      'recycler_org_id', v_recycler_org_id,
      'driver_name', v_driver_name,
      'driver_phone', v_driver_phone
    )
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'WhatsApp shipment trigger error: %', SQLERRM;
  RETURN NEW;
END;
$$;
