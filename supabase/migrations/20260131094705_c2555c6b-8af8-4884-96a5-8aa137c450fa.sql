-- Update the trigger function to include pdf_url when creating recycling report notifications
CREATE OR REPLACE FUNCTION public.notify_recycling_report_created()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_shipment RECORD;
  v_recycler_name TEXT;
  v_user_ids UUID[];
  v_user_id UUID;
BEGIN
  -- Get shipment details
  SELECT s.*, g.name as generator_name, t.name as transporter_name, r.name as recycler_name
  INTO v_shipment
  FROM shipments s
  LEFT JOIN organizations g ON s.generator_id = g.id
  LEFT JOIN organizations t ON s.transporter_id = t.id
  LEFT JOIN organizations r ON s.recycler_id = r.id
  WHERE s.id = NEW.shipment_id;

  -- Get recycler name
  SELECT name INTO v_recycler_name FROM organizations WHERE id = NEW.recycler_organization_id;

  -- Notify generator users
  SELECT ARRAY_AGG(p.user_id) INTO v_user_ids
  FROM profiles p
  WHERE p.organization_id = v_shipment.generator_id AND p.is_active = true;

  IF v_user_ids IS NOT NULL THEN
    FOREACH v_user_id IN ARRAY v_user_ids
    LOOP
      INSERT INTO notifications (user_id, title, message, type, shipment_id, pdf_url)
      VALUES (
        v_user_id,
        'شهادة إعادة تدوير جديدة',
        'تم إصدار شهادة إعادة التدوير للشحنة ' || v_shipment.shipment_number || ' من ' || COALESCE(v_recycler_name, 'جهة التدوير'),
        'recycling_report',
        NEW.shipment_id,
        NEW.pdf_url
      );
    END LOOP;
  END IF;

  -- Notify transporter users
  SELECT ARRAY_AGG(p.user_id) INTO v_user_ids
  FROM profiles p
  WHERE p.organization_id = v_shipment.transporter_id AND p.is_active = true;

  IF v_user_ids IS NOT NULL THEN
    FOREACH v_user_id IN ARRAY v_user_ids
    LOOP
      INSERT INTO notifications (user_id, title, message, type, shipment_id, pdf_url)
      VALUES (
        v_user_id,
        'شهادة إعادة تدوير جديدة',
        'تم إصدار شهادة إعادة التدوير للشحنة ' || v_shipment.shipment_number || ' من ' || COALESCE(v_recycler_name, 'جهة التدوير'),
        'recycling_report',
        NEW.shipment_id,
        NEW.pdf_url
      );
    END LOOP;
  END IF;

  -- Notify admin users
  SELECT ARRAY_AGG(ur.user_id) INTO v_user_ids
  FROM user_roles ur
  WHERE ur.role = 'admin';

  IF v_user_ids IS NOT NULL THEN
    FOREACH v_user_id IN ARRAY v_user_ids
    LOOP
      INSERT INTO notifications (user_id, title, message, type, shipment_id, pdf_url)
      VALUES (
        v_user_id,
        'شهادة إعادة تدوير جديدة',
        'تم إصدار شهادة إعادة التدوير للشحنة ' || v_shipment.shipment_number || ' من ' || COALESCE(v_recycler_name, 'جهة التدوير'),
        'recycling_report',
        NEW.shipment_id,
        NEW.pdf_url
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$function$;

-- Also create a trigger to update notifications when pdf_url is updated in recycling_reports
CREATE OR REPLACE FUNCTION public.update_notification_pdf_url()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Update existing notifications with the new pdf_url
  IF NEW.pdf_url IS NOT NULL AND (OLD.pdf_url IS NULL OR OLD.pdf_url <> NEW.pdf_url) THEN
    UPDATE notifications
    SET pdf_url = NEW.pdf_url
    WHERE shipment_id = NEW.shipment_id
      AND type = 'recycling_report';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create the trigger
DROP TRIGGER IF EXISTS on_recycling_report_pdf_update ON recycling_reports;
CREATE TRIGGER on_recycling_report_pdf_update
  AFTER UPDATE ON recycling_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_pdf_url();