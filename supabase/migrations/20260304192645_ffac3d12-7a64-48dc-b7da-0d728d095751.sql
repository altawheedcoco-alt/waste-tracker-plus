
-- 1. Add user-level WhatsApp preferences columns to notification_channels
ALTER TABLE public.notification_channels 
  ADD COLUMN IF NOT EXISTS notify_driver_assignments boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_delivery_confirmations boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_daily_reports boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS notify_weekly_reports boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_emergency_alerts boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'ar',
  ADD COLUMN IF NOT EXISTS quiet_hours_start time DEFAULT null,
  ADD COLUMN IF NOT EXISTS quiet_hours_end time DEFAULT null;

-- 2. Create function to auto-trigger WhatsApp on shipment status changes
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
  v_supabase_url text;
  v_service_role_key text;
BEGIN
  -- Only fire on status change
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Map status to event type
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

  -- Get driver info
  IF NEW.driver_id IS NOT NULL THEN
    SELECT p.full_name, p.phone INTO v_driver_name, v_driver_phone
    FROM drivers d
    JOIN profiles p ON p.id = d.profile_id
    WHERE d.id = NEW.driver_id;
  END IF;

  -- Fire async HTTP request to whatsapp-event edge function
  PERFORM net.http_post(
    url := current_setting('app.settings.supabase_url', true) || '/functions/v1/whatsapp-event',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
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
END;
$$;

-- 3. Create trigger on shipments table
DROP TRIGGER IF EXISTS trg_whatsapp_shipment_status ON public.shipments;
CREATE TRIGGER trg_whatsapp_shipment_status
  AFTER UPDATE ON public.shipments
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.trigger_whatsapp_on_shipment_change();

-- 4. Create function to auto-trigger WhatsApp on invoice creation
CREATE OR REPLACE FUNCTION public.trigger_whatsapp_on_invoice_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_shipment_number text;
  v_generator_org_id uuid;
  v_transporter_org_id uuid;
  v_recycler_org_id uuid;
BEGIN
  -- Get shipment info
  IF NEW.shipment_id IS NOT NULL THEN
    SELECT shipment_number, generator_id, transporter_id, recycler_id
    INTO v_shipment_number, v_generator_org_id, v_transporter_org_id, v_recycler_org_id
    FROM shipments WHERE id = NEW.shipment_id;
  END IF;

  PERFORM net.http_post(
    url := current_setting('app.settings.supabase_url', true) || '/functions/v1/whatsapp-event',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object(
      'event_type', 'invoice_generated',
      'organization_id', NEW.organization_id,
      'shipment_id', NEW.shipment_id,
      'shipment_number', COALESCE(v_shipment_number, ''),
      'generator_org_id', v_generator_org_id,
      'transporter_org_id', v_transporter_org_id,
      'recycler_org_id', v_recycler_org_id,
      'extra', jsonb_build_object('invoice_number', NEW.invoice_number, 'amount', NEW.total_amount)
    )
  );

  RETURN NEW;
END;
$$;

-- 5. Create trigger on invoices table
DROP TRIGGER IF EXISTS trg_whatsapp_invoice_created ON public.invoices;
CREATE TRIGGER trg_whatsapp_invoice_created
  AFTER INSERT ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_whatsapp_on_invoice_created();

-- 6. Create function for driver assignment WhatsApp notification
CREATE OR REPLACE FUNCTION public.trigger_whatsapp_on_driver_assigned()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_driver_name text;
  v_driver_phone text;
BEGIN
  -- Only fire when driver_id changes from null to a value
  IF OLD.driver_id IS NOT DISTINCT FROM NEW.driver_id THEN
    RETURN NEW;
  END IF;

  IF NEW.driver_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get driver info
  SELECT p.full_name, p.phone INTO v_driver_name, v_driver_phone
  FROM drivers d
  JOIN profiles p ON p.id = d.profile_id
  WHERE d.id = NEW.driver_id;

  PERFORM net.http_post(
    url := current_setting('app.settings.supabase_url', true) || '/functions/v1/whatsapp-event',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object(
      'event_type', 'driver_assigned',
      'shipment_id', NEW.id,
      'shipment_number', NEW.shipment_number,
      'driver_name', v_driver_name,
      'driver_phone', v_driver_phone,
      'generator_org_id', NEW.generator_id,
      'transporter_org_id', NEW.transporter_id,
      'recycler_org_id', NEW.recycler_id,
      'extra', jsonb_build_object('waste_type', NEW.waste_type, 'quantity', NEW.quantity, 'pickup_address', NEW.pickup_address, 'delivery_address', NEW.delivery_address)
    )
  );

  RETURN NEW;
END;
$$;

-- 7. Create trigger for driver assignment
DROP TRIGGER IF EXISTS trg_whatsapp_driver_assigned ON public.shipments;
CREATE TRIGGER trg_whatsapp_driver_assigned
  AFTER UPDATE ON public.shipments
  FOR EACH ROW
  WHEN (OLD.driver_id IS DISTINCT FROM NEW.driver_id AND NEW.driver_id IS NOT NULL)
  EXECUTE FUNCTION public.trigger_whatsapp_on_driver_assigned();

-- 8. Make sure pg_net extension is enabled
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
