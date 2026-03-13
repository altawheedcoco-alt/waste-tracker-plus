
-- =====================================================
-- مزامنة تلقائية: شحنات → أرشيف المستندات
-- Auto-sync: shipments file URLs → entity_documents
-- =====================================================
CREATE OR REPLACE FUNCTION sync_shipment_docs_to_archive()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _org_ids uuid[];
  _org_id uuid;
  _url_col text;
  _url_val text;
  _doc_type text;
  _doc_category text;
  _title text;
  _file_name text;
BEGIN
  -- Collect all org IDs related to this shipment
  _org_ids := ARRAY[]::uuid[];
  IF NEW.generator_id IS NOT NULL THEN _org_ids := _org_ids || NEW.generator_id; END IF;
  IF NEW.transporter_id IS NOT NULL THEN _org_ids := _org_ids || NEW.transporter_id; END IF;
  IF NEW.recycler_id IS NOT NULL THEN _org_ids := _org_ids || NEW.recycler_id; END IF;

  -- Check each file URL column
  -- 1) weighbridge_photo_url
  IF NEW.weighbridge_photo_url IS NOT NULL 
     AND (OLD IS NULL OR OLD.weighbridge_photo_url IS DISTINCT FROM NEW.weighbridge_photo_url) THEN
    FOREACH _org_id IN ARRAY _org_ids LOOP
      INSERT INTO entity_documents (organization_id, document_type, document_category, title, description, file_url, file_name, file_type, shipment_id, tags, reference_number, document_date)
      VALUES (_org_id, 'weight_slip', 'operations',
              'تذكرة ميزان - ' || NEW.shipment_number,
              'تذكرة ميزان مرتبطة بالشحنة ' || NEW.shipment_number,
              NEW.weighbridge_photo_url,
              'weighbridge-' || NEW.shipment_number || '.jpg',
              'image/jpeg',
              NEW.id,
              ARRAY['ميزان','مزامنة تلقائية'],
              NEW.weighbridge_ticket_number,
              COALESCE(NEW.weighbridge_date, CURRENT_DATE))
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  -- 2) manifest_pdf_url
  IF NEW.manifest_pdf_url IS NOT NULL 
     AND (OLD IS NULL OR OLD.manifest_pdf_url IS DISTINCT FROM NEW.manifest_pdf_url) THEN
    FOREACH _org_id IN ARRAY _org_ids LOOP
      INSERT INTO entity_documents (organization_id, document_type, document_category, title, description, file_url, file_name, file_type, shipment_id, tags, reference_number, document_date)
      VALUES (_org_id, 'correspondence', 'documents',
              'بوليصة شحن - ' || NEW.shipment_number,
              'بوليصة الشحن الرسمية',
              NEW.manifest_pdf_url,
              'manifest-' || NEW.shipment_number || '.pdf',
              'application/pdf',
              NEW.id,
              ARRAY['بوليصة','مزامنة تلقائية'],
              'MNF-' || NEW.shipment_number,
              COALESCE(NEW.manifest_generated_at::date, CURRENT_DATE))
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  -- 3) payment_proof_url
  IF NEW.payment_proof_url IS NOT NULL 
     AND (OLD IS NULL OR OLD.payment_proof_url IS DISTINCT FROM NEW.payment_proof_url) THEN
    FOREACH _org_id IN ARRAY _org_ids LOOP
      INSERT INTO entity_documents (organization_id, document_type, document_category, title, description, file_url, file_name, file_type, shipment_id, tags, document_date)
      VALUES (_org_id, 'deposit_proof', 'financials',
              'إثبات دفع - ' || NEW.shipment_number,
              'إثبات الدفع للشحنة',
              NEW.payment_proof_url,
              'payment-' || NEW.shipment_number || '.pdf',
              COALESCE(NEW.payment_proof_type, 'application/pdf'),
              NEW.id,
              ARRAY['إثبات دفع','مزامنة تلقائية'],
              CURRENT_DATE)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  -- 4) disposal_certificate_url
  IF NEW.disposal_certificate_url IS NOT NULL 
     AND (OLD IS NULL OR OLD.disposal_certificate_url IS DISTINCT FROM NEW.disposal_certificate_url) THEN
    FOREACH _org_id IN ARRAY _org_ids LOOP
      INSERT INTO entity_documents (organization_id, document_type, document_category, title, description, file_url, file_name, file_type, shipment_id, tags, document_date)
      VALUES (_org_id, 'certificate', 'legal',
              'شهادة تخلص - ' || NEW.shipment_number,
              'شهادة التخلص الآمن',
              NEW.disposal_certificate_url,
              'disposal-cert-' || NEW.shipment_number || '.pdf',
              'application/pdf',
              NEW.id,
              ARRAY['شهادة تخلص','مزامنة تلقائية'],
              COALESCE(NEW.disposed_at::date, CURRENT_DATE))
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger on shipments
DROP TRIGGER IF EXISTS trg_sync_shipment_docs ON shipments;
CREATE TRIGGER trg_sync_shipment_docs
  AFTER INSERT OR UPDATE OF weighbridge_photo_url, manifest_pdf_url, payment_proof_url, disposal_certificate_url
  ON shipments
  FOR EACH ROW
  EXECUTE FUNCTION sync_shipment_docs_to_archive();

-- =====================================================
-- مزامنة تلقائية: عقود → أرشيف المستندات
-- Auto-sync: contracts attachment_url → entity_documents
-- =====================================================
CREATE OR REPLACE FUNCTION sync_contract_docs_to_archive()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.attachment_url IS NOT NULL 
     AND (OLD IS NULL OR OLD.attachment_url IS DISTINCT FROM NEW.attachment_url) THEN
    INSERT INTO entity_documents (organization_id, document_type, document_category, title, description, file_url, file_name, file_type, contract_id, tags, reference_number, document_date)
    VALUES (NEW.organization_id, 'contract', 'legal',
            COALESCE(NEW.title, 'عقد - ' || NEW.contract_number),
            NEW.description,
            NEW.attachment_url,
            'contract-' || NEW.contract_number || '.pdf',
            'application/pdf',
            NEW.id,
            ARRAY['عقد','مزامنة تلقائية'],
            NEW.contract_number,
            COALESCE(NEW.start_date::date, CURRENT_DATE))
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_contract_docs ON contracts;
CREATE TRIGGER trg_sync_contract_docs
  AFTER INSERT OR UPDATE OF attachment_url
  ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION sync_contract_docs_to_archive();

-- =====================================================
-- مزامنة تلقائية: signing_requests → أرشيف المستندات  
-- Auto-sync: signed documents → entity_documents
-- =====================================================
CREATE OR REPLACE FUNCTION sync_signed_docs_to_archive()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'signed' 
     AND (OLD IS NULL OR OLD.status IS DISTINCT FROM NEW.status)
     AND NEW.signed_document_url IS NOT NULL 
     AND NEW.sender_organization_id IS NOT NULL THEN
    
    -- For sender org
    INSERT INTO entity_documents (organization_id, document_type, document_category, title, description, file_url, file_name, file_type, tags, document_date)
    VALUES (NEW.sender_organization_id, 'correspondence', 'documents',
            COALESCE(NEW.document_title, 'مستند موقّع'),
            'مستند تم توقيعه إلكترونياً',
            NEW.signed_document_url,
            COALESCE(NEW.document_title, 'signed-doc') || '.pdf',
            'application/pdf',
            ARRAY['موقّع','مزامنة تلقائية'],
            CURRENT_DATE)
    ON CONFLICT DO NOTHING;

    -- For recipient org
    IF NEW.recipient_organization_id IS NOT NULL AND NEW.recipient_organization_id != NEW.sender_organization_id THEN
      INSERT INTO entity_documents (organization_id, document_type, document_category, title, description, file_url, file_name, file_type, tags, document_date)
      VALUES (NEW.recipient_organization_id, 'correspondence', 'documents',
              COALESCE(NEW.document_title, 'مستند موقّع وارد'),
              'مستند تم استلامه بتوقيع إلكتروني',
              NEW.signed_document_url,
              COALESCE(NEW.document_title, 'signed-doc') || '.pdf',
              'application/pdf',
              ARRAY['موقّع','وارد','مزامنة تلقائية'],
              CURRENT_DATE)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_signed_docs ON signing_requests;
CREATE TRIGGER trg_sync_signed_docs
  AFTER UPDATE OF status
  ON signing_requests
  FOR EACH ROW
  EXECUTE FUNCTION sync_signed_docs_to_archive();

-- =====================================================
-- مزامنة تلقائية: document_registry → entity_documents
-- Auto-sync: central registry → archive
-- =====================================================
CREATE OR REPLACE FUNCTION sync_registry_to_archive()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _doc_type text;
  _doc_category text;
BEGIN
  IF NEW.file_url IS NOT NULL THEN
    -- Map registry document_type to entity_documents types
    _doc_type := CASE 
      WHEN NEW.document_type IN ('contract','عقد') THEN 'contract'
      WHEN NEW.document_type IN ('invoice','فاتورة') THEN 'invoice'
      WHEN NEW.document_type IN ('certificate','شهادة') THEN 'certificate'
      WHEN NEW.document_type IN ('receipt','إيصال') THEN 'receipt'
      WHEN NEW.document_type IN ('license','رخصة') THEN 'license'
      ELSE 'other'
    END;
    _doc_category := CASE 
      WHEN _doc_type IN ('contract','certificate','license') THEN 'legal'
      WHEN _doc_type IN ('invoice','receipt') THEN 'financials'
      ELSE 'documents'
    END;

    INSERT INTO entity_documents (organization_id, document_type, document_category, title, description, file_url, file_name, file_type, tags, reference_number, document_date)
    VALUES (NEW.issuer_organization_id, _doc_type, _doc_category,
            COALESCE(NEW.title, 'مستند من السجل المركزي'),
            NEW.description,
            NEW.file_url,
            COALESCE(NEW.title, 'registry-doc') || '.pdf',
            'application/pdf',
            ARRAY['سجل مركزي','مزامنة تلقائية'],
            NEW.registry_number,
            COALESCE(NEW.issue_date, CURRENT_DATE))
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_registry_docs ON document_registry;
CREATE TRIGGER trg_sync_registry_docs
  AFTER INSERT
  ON document_registry
  FOR EACH ROW
  EXECUTE FUNCTION sync_registry_to_archive();
