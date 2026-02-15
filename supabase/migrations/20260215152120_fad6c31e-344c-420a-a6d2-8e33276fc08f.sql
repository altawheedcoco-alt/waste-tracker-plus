
-- Add 'auto_created' to supported action types
-- Create a reusable function to auto-archive documents
CREATE OR REPLACE FUNCTION public.auto_archive_document()
RETURNS TRIGGER AS $$
DECLARE
  v_doc_type TEXT;
  v_doc_number TEXT;
  v_org_id UUID;
  v_description TEXT;
  v_category TEXT;
  v_tracking_code TEXT;
  v_creator_name TEXT;
  v_creator_id UUID;
BEGIN
  -- Generate tracking code: PRN-YYMM-XXXXXX
  v_tracking_code := 'PRN-' || to_char(now(), 'YYMM') || '-' || upper(substr(md5(random()::text), 1, 6));

  -- Determine document type and extract fields based on table
  CASE TG_TABLE_NAME
    WHEN 'shipments' THEN
      v_doc_type := 'shipment';
      v_doc_number := NEW.shipment_number;
      v_org_id := COALESCE(NEW.generator_id, NEW.transporter_id, NEW.recycler_id);
      v_description := 'بوليصة شحن — توثق تفاصيل نقل المخلفات من المولد إلى المدوّر عبر الناقل المعتمد';
      v_category := 'operations';
      v_creator_id := NEW.created_by;

    WHEN 'invoices' THEN
      v_doc_type := 'invoice';
      v_doc_number := NEW.invoice_number;
      v_org_id := NEW.organization_id;
      v_description := 'فاتورة — مستند مالي يوثق قيمة الخدمات أو المواد المتبادلة بين الأطراف';
      v_category := 'financial';
      v_creator_id := NEW.created_by;

    WHEN 'contracts' THEN
      v_doc_type := 'contract';
      v_doc_number := NEW.contract_number;
      v_org_id := NEW.organization_id;
      v_description := 'عقد أو اتفاقية رسمية — ينظم العلاقة التعاقدية بين الأطراف ويحدد الالتزامات والحقوق';
      v_category := 'legal';
      v_creator_id := NEW.created_by;

    WHEN 'award_letters' THEN
      v_doc_type := 'award_letter';
      v_doc_number := NEW.letter_number;
      v_org_id := NEW.organization_id;
      v_description := 'خطاب ترسية — قرار رسمي بإسناد مناقصة أو عملية لجهة محددة';
      v_category := 'legal';
      v_creator_id := NEW.created_by;

    WHEN 'deposits' THEN
      v_doc_type := 'deposit';
      v_doc_number := NEW.reference_number;
      v_org_id := NEW.organization_id;
      v_description := 'إيداع مالي — يوثق عملية إيداع أو تحويل مبلغ مالي بين الأطراف';
      v_category := 'financial';
      v_creator_id := NULL;

    WHEN 'recycling_reports' THEN
      v_doc_type := 'certificate';
      v_doc_number := NEW.report_number;
      v_org_id := NEW.organization_id;
      v_description := 'شهادة تدوير رسمية — تثبت إعادة تدوير المخلفات وفق المعايير البيئية المعتمدة';
      v_category := 'compliance';
      v_creator_id := NEW.created_by;

    WHEN 'entity_documents' THEN
      v_doc_type := COALESCE(NEW.document_type, 'entity_document');
      v_doc_number := NEW.title;
      v_org_id := NEW.organization_id;
      v_description := 'مستند مرفق — وثيقة تم رفعها وأرشفتها ضمن ملف الجهة';
      v_category := 'operations';
      v_creator_id := NULL;

    ELSE
      v_doc_type := TG_TABLE_NAME;
      v_doc_number := NEW.id::text;
      v_org_id := NULL;
      v_description := 'مستند تم إنشاؤه تلقائياً';
      v_category := 'operations';
      v_creator_id := NULL;
  END CASE;

  -- Skip if no org_id
  IF v_org_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get creator name
  IF v_creator_id IS NOT NULL THEN
    SELECT full_name INTO v_creator_name FROM public.profiles WHERE id = v_creator_id;
  END IF;

  -- Insert archive record
  INSERT INTO public.document_print_log (
    organization_id, user_id, document_type, document_id, document_number,
    print_tracking_code, template_id, theme_id, action_type,
    printed_by_name, printed_by_employee_code, description, document_category, metadata
  ) VALUES (
    v_org_id, v_creator_id, v_doc_type, NEW.id::text, v_doc_number,
    v_tracking_code, 'auto', 'system', 'auto_created',
    COALESCE(v_creator_name, 'النظام'), COALESCE(upper(substr(COALESCE(v_creator_id::text, ''), 1, 8)), 'SYSTEM'),
    v_description, v_category, jsonb_build_object('source_table', TG_TABLE_NAME, 'auto_archived', true)
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Don't block the original insert if archiving fails
  RAISE WARNING 'Auto-archive failed for %: %', TG_TABLE_NAME, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers on all key document tables
CREATE TRIGGER auto_archive_shipment
  AFTER INSERT ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION public.auto_archive_document();

CREATE TRIGGER auto_archive_invoice
  AFTER INSERT ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.auto_archive_document();

CREATE TRIGGER auto_archive_contract
  AFTER INSERT ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.auto_archive_document();

CREATE TRIGGER auto_archive_award_letter
  AFTER INSERT ON public.award_letters
  FOR EACH ROW EXECUTE FUNCTION public.auto_archive_document();

CREATE TRIGGER auto_archive_deposit
  AFTER INSERT ON public.deposits
  FOR EACH ROW EXECUTE FUNCTION public.auto_archive_document();

CREATE TRIGGER auto_archive_recycling_report
  AFTER INSERT ON public.recycling_reports
  FOR EACH ROW EXECUTE FUNCTION public.auto_archive_document();

CREATE TRIGGER auto_archive_entity_document
  AFTER INSERT ON public.entity_documents
  FOR EACH ROW EXECUTE FUNCTION public.auto_archive_document();
