CREATE OR REPLACE FUNCTION public.trg_notify_document_signature()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _title text;
  _message text;
  _shipment_id uuid;
  _doc_type text;
BEGIN
  _doc_type := COALESCE(NEW.document_type, 'مستند');
  _title := '✍️ توقيع جديد على ' || _doc_type;
  _message := 'قام ' || COALESCE(NEW.signer_name, 'مستخدم') || ' بالتوقيع على ' || _doc_type;
  
  IF NEW.stamp_applied = true THEN
    _message := _message || ' (مع ختم رسمي)';
  END IF;

  -- Try to find linked shipment
  BEGIN
    SELECT ed.shipment_id INTO _shipment_id
    FROM entity_documents ed
    WHERE ed.id = NEW.document_id
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    _shipment_id := NULL;
  END;

  -- Send notifications but don't fail the insert if notifications error
  BEGIN
    PERFORM notify_related_parties(
      NEW.organization_id,
      NULL::uuid,
      _shipment_id,
      _title,
      _message,
      'document_signed'::text,
      NEW.id::text,
      'document_signature'::text,
      NEW.signed_by
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Notification failed for document signature %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$function$;