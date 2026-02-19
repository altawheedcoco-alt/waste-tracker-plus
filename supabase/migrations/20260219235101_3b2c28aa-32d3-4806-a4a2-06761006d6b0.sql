
-- Create trigger function for signing_requests notifications
CREATE OR REPLACE FUNCTION public.notify_signing_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user RECORD;
  _sender_org_name TEXT;
BEGIN
  -- Get sender organization name
  SELECT name INTO _sender_org_name FROM organizations WHERE id = NEW.sender_organization_id;

  -- Notify all users in the recipient organization
  FOR _user IN
    SELECT user_id FROM profiles WHERE organization_id = NEW.recipient_organization_id
  LOOP
    INSERT INTO notifications (user_id, organization_id, title, message, type, priority, metadata)
    VALUES (
      _user.user_id,
      NEW.recipient_organization_id,
      'طلب توقيع جديد: ' || COALESCE(NEW.document_title, 'مستند'),
      'وصلك طلب توقيع من ' || COALESCE(_sender_org_name, 'جهة شريكة') || ' - ' || COALESCE(NEW.document_description, ''),
      'signing_request',
      COALESCE(NEW.priority, 'normal'),
      jsonb_build_object(
        'signing_request_id', NEW.id,
        'document_type', NEW.document_type,
        'sender_organization_id', NEW.sender_organization_id,
        'requires_stamp', NEW.requires_stamp
      )
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER on_signing_request_created
  AFTER INSERT ON public.signing_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_signing_request();
