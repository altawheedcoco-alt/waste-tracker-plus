-- Function to auto-generate certificates and declarations on shipment status change
CREATE OR REPLACE FUNCTION public.auto_generate_shipment_documents()
RETURNS TRIGGER AS $$
DECLARE
  v_generator_name TEXT;
  v_transporter_name TEXT;
  v_recycler_name TEXT;
  v_receipt_number TEXT;
  v_report_number TEXT;
  v_declaration_text TEXT;
BEGIN
  -- Only proceed if status actually changed
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Fetch organization names
  SELECT name INTO v_generator_name FROM public.organizations WHERE id = NEW.generator_id;
  SELECT name INTO v_transporter_name FROM public.organizations WHERE id = NEW.transporter_id;
  SELECT name INTO v_recycler_name FROM public.organizations WHERE id = NEW.recycler_id;

  -- ============================================================
  -- 1) Shipment APPROVED/CREATED → Generator delivery declaration + delivery receipt
  -- ============================================================
  IF NEW.status IN ('approved', 'pending') AND OLD.status NOT IN ('approved', 'pending') THEN
    
    -- Generator delivery declaration (إقرار تسليم المولد)
    IF NEW.generator_id IS NOT NULL THEN
      v_declaration_text := 'أقر أنا الموقع أدناه بتسليم المخلفات الموصوفة أعلاه إلى الجهة الناقلة المعتمدة، وأتحمل كامل المسؤولية عن صحة البيانات المدونة.';
      
      INSERT INTO public.delivery_declarations (
        shipment_id, declared_by_user_id, declared_by_organization_id,
        declaration_text, declaration_type, status, auto_generated,
        shipment_number, waste_type, quantity, unit,
        generator_name, transporter_name, recycler_name
      ) VALUES (
        NEW.id, COALESCE(auth.uid(), NEW.generator_id), NEW.generator_id,
        v_declaration_text, 'generator_delivery', 'active', true,
        NEW.shipment_number, NEW.waste_type, NEW.quantity, COALESCE(NEW.unit, 'كجم'),
        v_generator_name, v_transporter_name, v_recycler_name
      ) ON CONFLICT DO NOTHING;

      -- Delivery certificate (شهادة التسليم)
      v_receipt_number := 'DLV-' || TO_CHAR(NOW(), 'YYMM') || '-' || SUBSTR(gen_random_uuid()::text, 1, 6);
      
      INSERT INTO public.shipment_receipts (
        shipment_id, receipt_number, generator_id, transporter_id, driver_id,
        pickup_date, pickup_location, waste_type, declared_weight, unit,
        status, notes
      ) VALUES (
        NEW.id, v_receipt_number, NEW.generator_id, NEW.transporter_id, NEW.driver_id,
        NOW(), NEW.pickup_address, NEW.waste_type, NEW.quantity, COALESCE(NEW.unit, 'كجم'),
        'confirmed', 'شهادة تسليم صادرة تلقائياً'
      ) ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- ============================================================
  -- 2) Shipment IN_TRANSIT/COLLECTING → Transporter receipt + declaration
  -- ============================================================
  IF NEW.status IN ('in_transit', 'collecting', 'collected') AND OLD.status NOT IN ('in_transit', 'collecting', 'collected') THEN
    
    IF NEW.transporter_id IS NOT NULL THEN
      -- Transporter declaration (إقرار الناقل)
      v_declaration_text := 'أقر أنا الموقع أدناه باستلام المخلفات الموصوفة أعلاه من الجهة المولدة والتعهد بنقلها وفقاً للمعايير البيئية المعتمدة.';
      
      INSERT INTO public.delivery_declarations (
        shipment_id, declared_by_user_id, declared_by_organization_id,
        declaration_text, declaration_type, status, auto_generated,
        shipment_number, waste_type, quantity, unit,
        generator_name, transporter_name, recycler_name
      ) VALUES (
        NEW.id, COALESCE(auth.uid(), NEW.transporter_id), NEW.transporter_id,
        v_declaration_text, 'transporter_delivery', 'active', true,
        NEW.shipment_number, NEW.waste_type, NEW.quantity, COALESCE(NEW.unit, 'كجم'),
        v_generator_name, v_transporter_name, v_recycler_name
      ) ON CONFLICT DO NOTHING;

      -- Transporter receipt certificate (شهادة استلام الناقل)
      v_receipt_number := 'RCV-' || TO_CHAR(NOW(), 'YYMM') || '-' || SUBSTR(gen_random_uuid()::text, 1, 6);
      
      INSERT INTO public.shipment_receipts (
        shipment_id, receipt_number, generator_id, transporter_id, driver_id,
        pickup_date, pickup_location, waste_type, declared_weight, unit,
        status, notes
      ) VALUES (
        NEW.id, v_receipt_number, NEW.generator_id, NEW.transporter_id, NEW.driver_id,
        NOW(), NEW.pickup_address, NEW.waste_type, NEW.quantity, COALESCE(NEW.unit, 'كجم'),
        'confirmed', 'شهادة استلام ناقل صادرة تلقائياً'
      ) ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- ============================================================
  -- 3) Shipment DELIVERED/CONFIRMED → Recycler declaration + receipt + recycling report
  -- ============================================================
  IF NEW.status IN ('delivered', 'confirmed', 'completed') AND OLD.status NOT IN ('delivered', 'confirmed', 'completed') THEN
    
    IF NEW.recycler_id IS NOT NULL THEN
      -- Recycler declaration (إقرار المدور)
      v_declaration_text := 'أقر أنا الموقع أدناه باستلام المخلفات الموصوفة أعلاه من الجهة الناقلة والتعهد بمعالجتها وفقاً للمعايير البيئية والقانونية المعمول بها.';
      
      INSERT INTO public.delivery_declarations (
        shipment_id, declared_by_user_id, declared_by_organization_id,
        declaration_text, declaration_type, status, auto_generated,
        shipment_number, waste_type, quantity, unit,
        generator_name, transporter_name, recycler_name
      ) VALUES (
        NEW.id, COALESCE(auth.uid(), NEW.recycler_id), NEW.recycler_id,
        v_declaration_text, 'recycler_receipt', 'active', true,
        NEW.shipment_number, NEW.waste_type, NEW.quantity, COALESCE(NEW.unit, 'كجم'),
        v_generator_name, v_transporter_name, v_recycler_name
      ) ON CONFLICT DO NOTHING;

      -- Recycler receipt (شهادة استلام المدور)
      v_receipt_number := 'RCY-' || TO_CHAR(NOW(), 'YYMM') || '-' || SUBSTR(gen_random_uuid()::text, 1, 6);
      
      INSERT INTO public.shipment_receipts (
        shipment_id, receipt_number, generator_id, transporter_id, driver_id,
        pickup_date, pickup_location, waste_type, declared_weight, actual_weight, unit,
        status, notes
      ) VALUES (
        NEW.id, v_receipt_number, NEW.generator_id, NEW.transporter_id, NEW.driver_id,
        NOW(), NEW.delivery_address, NEW.waste_type, NEW.quantity, NEW.quantity, COALESCE(NEW.unit, 'كجم'),
        'confirmed', 'شهادة استلام مدور/معالج صادرة تلقائياً'
      ) ON CONFLICT DO NOTHING;

      -- Auto-generate recycling report/certificate (شهادة التدوير)
      v_report_number := 'RC-' || TO_CHAR(NOW(), 'YYMM') || '-' || SUBSTR(gen_random_uuid()::text, 1, 6);
      
      INSERT INTO public.recycling_reports (
        shipment_id, recycler_organization_id, report_number,
        opening_declaration, processing_details, closing_declaration,
        waste_category, report_data
      ) VALUES (
        NEW.id, NEW.recycler_id, v_report_number,
        'تم استلام المخلفات ومعالجتها وفقاً للمعايير البيئية المعتمدة.',
        'تمت معالجة المخلفات بالطرق المعتمدة بيئياً.',
        'نشهد بأن المخلفات المذكورة أعلاه قد تمت معالجتها بالكامل وفقاً للوائح والقوانين البيئية المعمول بها.',
        COALESCE(NEW.waste_type, 'all'),
        jsonb_build_object(
          'auto_generated', true,
          'shipment_number', NEW.shipment_number,
          'waste_type', NEW.waste_type,
          'quantity', NEW.quantity,
          'unit', COALESCE(NEW.unit, 'كجم'),
          'generator_name', v_generator_name,
          'transporter_name', v_transporter_name,
          'recycler_name', v_recycler_name,
          'generated_at', NOW()
        )
      ) ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS trg_auto_generate_shipment_documents ON public.shipments;

-- Create the trigger
CREATE TRIGGER trg_auto_generate_shipment_documents
  AFTER UPDATE OF status ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_shipment_documents();