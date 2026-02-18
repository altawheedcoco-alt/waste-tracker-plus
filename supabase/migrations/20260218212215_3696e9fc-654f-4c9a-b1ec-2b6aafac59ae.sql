
-- ============================================
-- WhatsApp Event Notification System
-- Triggers that fire on system events and call whatsapp-event edge function
-- ============================================

-- Central function to dispatch WhatsApp events via pg_net
CREATE OR REPLACE FUNCTION public.dispatch_whatsapp_event(event_payload jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _url text;
  _anon_key text;
BEGIN
  _url := 'https://jejwizkssmqzxwseqsre.supabase.co/functions/v1/whatsapp-event';
  _anon_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Implandpemtzc21xenh3c2Vxc3JlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MDI2MTcsImV4cCI6MjA4NTM3ODYxN30.cuO0gX41P_QIdCrdj4-yw8q8otcr-hUPDySuoXNiUPY';

  PERFORM net.http_post(
    url := _url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _anon_key
    ),
    body := event_payload
  );
END;
$$;

-- ============================================
-- 1. SHIPMENT STATUS CHANGES
-- ============================================
CREATE OR REPLACE FUNCTION public.trigger_whatsapp_shipment_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _event_type text;
  _org_ids text[];
  _org_id text;
  _gen_name text;
  _trans_name text;
  _rec_name text;
  _driver_name text;
BEGIN
  -- Only fire on status change
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  -- Map status to event type
  CASE NEW.status
    WHEN 'pending' THEN _event_type := 'shipment_created';
    WHEN 'approved' THEN _event_type := 'shipment_approved';
    WHEN 'collecting' THEN _event_type := 'shipment_collecting';
    WHEN 'in_transit' THEN _event_type := 'shipment_in_transit';
    WHEN 'delivered' THEN _event_type := 'shipment_delivered';
    WHEN 'confirmed' THEN _event_type := 'shipment_confirmed';
    WHEN 'cancelled' THEN _event_type := 'shipment_cancelled';
    ELSE RETURN NEW; -- Unknown status, skip
  END CASE;

  -- Get org names
  SELECT name INTO _gen_name FROM organizations WHERE id = NEW.generator_id;
  SELECT name INTO _trans_name FROM organizations WHERE id = NEW.transporter_id;
  SELECT name INTO _rec_name FROM organizations WHERE id = NEW.recycler_id;
  
  IF NEW.driver_id IS NOT NULL THEN
    SELECT full_name INTO _driver_name FROM profiles WHERE id = NEW.driver_id;
  END IF;

  -- Notify all involved orgs
  _org_ids := ARRAY[]::text[];
  IF NEW.generator_id IS NOT NULL THEN _org_ids := _org_ids || NEW.generator_id::text; END IF;
  IF NEW.transporter_id IS NOT NULL THEN _org_ids := _org_ids || NEW.transporter_id::text; END IF;
  IF NEW.recycler_id IS NOT NULL THEN _org_ids := _org_ids || NEW.recycler_id::text; END IF;

  FOREACH _org_id IN ARRAY _org_ids
  LOOP
    PERFORM dispatch_whatsapp_event(jsonb_build_object(
      'event_type', _event_type,
      'organization_id', _org_id,
      'shipment_id', NEW.id,
      'shipment_number', NEW.shipment_number,
      'status', NEW.status,
      'old_status', OLD.status,
      'waste_type', NEW.waste_type,
      'generator_name', _gen_name,
      'transporter_name', _trans_name,
      'recycler_name', _rec_name,
      'driver_name', _driver_name
    ));
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_whatsapp_shipment_status ON shipments;
CREATE TRIGGER trg_whatsapp_shipment_status
  AFTER UPDATE ON shipments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_whatsapp_shipment_status();

-- ============================================
-- 2. INVOICE EVENTS
-- ============================================
CREATE OR REPLACE FUNCTION public.trigger_whatsapp_invoice()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _event_type text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    _event_type := 'invoice_created';
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    CASE NEW.status
      WHEN 'paid' THEN _event_type := 'invoice_paid';
      WHEN 'overdue' THEN _event_type := 'invoice_overdue';
      ELSE RETURN NEW;
    END CASE;
  ELSE
    RETURN NEW;
  END IF;

  -- Notify issuing org and partner org
  PERFORM dispatch_whatsapp_event(jsonb_build_object(
    'event_type', _event_type,
    'organization_id', NEW.organization_id,
    'invoice_id', NEW.id,
    'invoice_number', NEW.invoice_number,
    'amount', NEW.total_amount
  ));

  IF NEW.partner_organization_id IS NOT NULL THEN
    PERFORM dispatch_whatsapp_event(jsonb_build_object(
      'event_type', _event_type,
      'organization_id', NEW.partner_organization_id,
      'invoice_id', NEW.id,
      'invoice_number', NEW.invoice_number,
      'amount', NEW.total_amount
    ));
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_whatsapp_invoice ON invoices;
CREATE TRIGGER trg_whatsapp_invoice
  AFTER INSERT OR UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION trigger_whatsapp_invoice();

-- ============================================
-- 3. DEPOSIT EVENTS
-- ============================================
CREATE OR REPLACE FUNCTION public.trigger_whatsapp_deposit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM dispatch_whatsapp_event(jsonb_build_object(
    'event_type', 'deposit_received',
    'organization_id', NEW.organization_id,
    'deposit_id', NEW.id,
    'amount', NEW.amount,
    'depositor_name', NEW.depositor_name
  ));

  IF NEW.partner_organization_id IS NOT NULL THEN
    PERFORM dispatch_whatsapp_event(jsonb_build_object(
      'event_type', 'deposit_received',
      'organization_id', NEW.partner_organization_id,
      'deposit_id', NEW.id,
      'amount', NEW.amount,
      'depositor_name', NEW.depositor_name
    ));
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_whatsapp_deposit ON deposits;
CREATE TRIGGER trg_whatsapp_deposit
  AFTER INSERT ON deposits
  FOR EACH ROW
  EXECUTE FUNCTION trigger_whatsapp_deposit();

-- ============================================
-- 4. COLLECTION REQUEST EVENTS
-- ============================================
CREATE OR REPLACE FUNCTION public.trigger_whatsapp_collection_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _event_type text;
  _driver_name text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    _event_type := 'collection_request_new';
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    CASE NEW.status
      WHEN 'assigned' THEN _event_type := 'collection_request_assigned';
      WHEN 'picked_up' THEN _event_type := 'collection_request_picked_up';
      WHEN 'completed' THEN _event_type := 'collection_request_completed';
      WHEN 'cancelled' THEN _event_type := 'collection_request_cancelled';
      ELSE RETURN NEW;
    END CASE;
  ELSE
    RETURN NEW;
  END IF;

  IF NEW.assigned_driver_id IS NOT NULL THEN
    SELECT full_name INTO _driver_name FROM profiles WHERE id = NEW.assigned_driver_id;
  END IF;

  PERFORM dispatch_whatsapp_event(jsonb_build_object(
    'event_type', _event_type,
    'organization_id', NEW.organization_id,
    'collection_request_id', NEW.id,
    'customer_name', NEW.customer_name,
    'customer_phone', NEW.customer_phone,
    'waste_type', NEW.waste_type,
    'driver_name', _driver_name,
    'extra', jsonb_build_object('reason', NEW.cancellation_reason)
  ));

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_whatsapp_collection_request ON collection_requests;
CREATE TRIGGER trg_whatsapp_collection_request
  AFTER INSERT OR UPDATE ON collection_requests
  FOR EACH ROW
  EXECUTE FUNCTION trigger_whatsapp_collection_request();

-- ============================================
-- 5. APPROVAL REQUEST EVENTS
-- ============================================
CREATE OR REPLACE FUNCTION public.trigger_whatsapp_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _event_type text;
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  CASE NEW.status
    WHEN 'approved' THEN _event_type := 'approval_approved';
    WHEN 'rejected' THEN _event_type := 'approval_rejected';
    ELSE RETURN NEW;
  END CASE;

  IF NEW.requester_organization_id IS NOT NULL THEN
    PERFORM dispatch_whatsapp_event(jsonb_build_object(
      'event_type', _event_type,
      'organization_id', NEW.requester_organization_id,
      'approval_id', NEW.id,
      'request_title', NEW.request_title,
      'extra', jsonb_build_object('reason', NEW.admin_notes)
    ));
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_whatsapp_approval ON approval_requests;
CREATE TRIGGER trg_whatsapp_approval
  AFTER UPDATE ON approval_requests
  FOR EACH ROW
  EXECUTE FUNCTION trigger_whatsapp_approval();
