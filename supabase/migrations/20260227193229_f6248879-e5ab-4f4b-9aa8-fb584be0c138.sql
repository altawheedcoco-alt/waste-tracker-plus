
-- 1. Trigger: Auto-update shipment_documents status when all signatures are completed
CREATE OR REPLACE FUNCTION public.update_shipment_document_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  doc_id UUID;
  total_required INT;
  completed_count INT;
  all_required_signed BOOLEAN;
BEGIN
  doc_id := NEW.document_id;
  
  -- Count completed signatures
  SELECT COUNT(*) INTO completed_count
  FROM public.shipment_doc_signatures
  WHERE document_id = doc_id AND status = 'signed';
  
  -- Update completed_signatures count
  UPDATE public.shipment_documents
  SET completed_signatures = completed_count,
      updated_at = now()
  WHERE id = doc_id;
  
  -- Check if all required signatures are done
  SELECT NOT EXISTS(
    SELECT 1 FROM public.shipment_doc_signatures
    WHERE document_id = doc_id AND is_required = true AND status != 'signed'
  ) INTO all_required_signed;
  
  -- Update document status
  IF all_required_signed THEN
    UPDATE public.shipment_documents
    SET status = 'completed', completed_at = now(), updated_at = now()
    WHERE id = doc_id AND status != 'completed';
  ELSIF completed_count > 0 THEN
    UPDATE public.shipment_documents
    SET status = 'in_progress', updated_at = now()
    WHERE id = doc_id AND status = 'pending';
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_doc_status ON public.shipment_doc_signatures;
CREATE TRIGGER trg_update_doc_status
  AFTER UPDATE OF status ON public.shipment_doc_signatures
  FOR EACH ROW
  WHEN (NEW.status = 'signed')
  EXECUTE FUNCTION public.update_shipment_document_status();

-- 2. Trigger: Auto-attach templates with auto_attach=true to new shipments
CREATE OR REPLACE FUNCTION public.auto_attach_document_templates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tpl RECORD;
  sig RECORD;
  new_doc_id UUID;
  sig_count INT;
BEGIN
  -- Find auto-attach templates for the shipment's generator organization
  FOR tpl IN
    SELECT * FROM public.document_templates
    WHERE organization_id = NEW.generator_id
      AND auto_attach = true
      AND is_active = true
  LOOP
    -- Count signatories
    SELECT COUNT(*) INTO sig_count
    FROM public.document_template_signatories
    WHERE template_id = tpl.id;
    
    -- Create shipment document
    INSERT INTO public.shipment_documents (
      shipment_id, template_id, organization_id, document_name,
      is_mandatory, is_sequential, total_signatures_required
    ) VALUES (
      NEW.id, tpl.id, tpl.organization_id, tpl.name,
      tpl.is_mandatory, tpl.is_sequential, sig_count
    ) RETURNING id INTO new_doc_id;
    
    -- Create signature slots
    FOR sig IN
      SELECT * FROM public.document_template_signatories
      WHERE template_id = tpl.id
      ORDER BY sign_order
    LOOP
      INSERT INTO public.shipment_doc_signatures (
        document_id, signatory_template_id, signer_name, signer_title,
        party_type, sign_order, is_required
      ) VALUES (
        new_doc_id, sig.id, sig.role_title, sig.role_title,
        sig.party_type, sig.sign_order, sig.is_required
      );
    END LOOP;
  END LOOP;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_attach_templates ON public.shipments;
CREATE TRIGGER trg_auto_attach_templates
  AFTER INSERT ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_attach_document_templates();

-- 3. Trigger: Send notification when signing is requested
CREATE OR REPLACE FUNCTION public.notify_signing_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  doc_record RECORD;
  ship_record RECORD;
BEGIN
  -- Get document info
  SELECT sd.*, s.shipment_number, s.generator_id, s.transporter_id, s.recycler_id
  INTO doc_record
  FROM public.shipment_documents sd
  JOIN public.shipments s ON s.id = sd.shipment_id
  WHERE sd.id = NEW.document_id;
  
  IF doc_record IS NULL THEN RETURN NEW; END IF;
  
  -- Determine target org based on party_type
  DECLARE
    target_org_id UUID;
  BEGIN
    target_org_id := CASE NEW.party_type
      WHEN 'generator_staff' THEN doc_record.generator_id
      WHEN 'transporter' THEN doc_record.transporter_id
      WHEN 'driver' THEN doc_record.transporter_id
      WHEN 'recycler' THEN doc_record.recycler_id
      ELSE doc_record.organization_id
    END;
    
    IF target_org_id IS NOT NULL THEN
      -- Send notification to all org members
      INSERT INTO public.notifications (user_id, title, message, type, reference_id, reference_type)
      SELECT p.id,
        'طلب توقيع مستند',
        'مطلوب توقيعك على مستند "' || doc_record.document_name || '" للشحنة ' || doc_record.shipment_number,
        'signing_request',
        doc_record.shipment_id::text,
        'shipment'
      FROM public.profiles p
      WHERE p.organization_id = target_org_id;
    END IF;
  END;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_signing ON public.shipment_doc_signatures;
CREATE TRIGGER trg_notify_signing
  AFTER INSERT ON public.shipment_doc_signatures
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_signing_request();
