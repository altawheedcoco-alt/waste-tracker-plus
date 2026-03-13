
CREATE OR REPLACE FUNCTION public.trg_notify_partnership_event()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  _org_name text;
BEGIN
  SELECT name INTO _org_name FROM organizations WHERE id = NEW.organization_id;
  
  IF NEW.partner_organization_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, message, type, is_read, shipment_id)
    SELECT p.user_id, '🤝 طلب شراكة جديد', 'تلقيتم طلب ربط شراكة من "' || COALESCE(_org_name, 'جهة') || '"',
      'partnership_request', false, NULL
    FROM profiles p WHERE p.organization_id = NEW.partner_organization_id AND p.is_active = true AND p.user_id IS NOT NULL;
  END IF;
  
  RETURN NEW;
END;
$$;
