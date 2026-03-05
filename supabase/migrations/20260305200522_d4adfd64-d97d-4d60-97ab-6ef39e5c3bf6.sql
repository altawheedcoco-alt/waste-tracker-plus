CREATE OR REPLACE FUNCTION public.trg_notify_document_signature()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  -- Try to find linked shipment through entity_documents
  SELECT ed.shipment_id INTO _shipment_id
  FROM entity_documents ed
  WHERE ed.id = NEW.document_id
  LIMIT 1;

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

  RETURN NEW;
END;
$$;