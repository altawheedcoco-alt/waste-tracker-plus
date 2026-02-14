
CREATE OR REPLACE FUNCTION public.auto_generate_shipment_documents()
RETURNS TRIGGER AS $$
DECLARE
  v_generator_name TEXT;
  v_transporter_name TEXT;
  v_recycler_name TEXT;
  v_shipment_number TEXT;
  v_waste_type TEXT;
  v_quantity NUMERIC;
  v_unit TEXT;
  v_pickup_address TEXT;
  v_delivery_address TEXT;
  v_decl_text TEXT;
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  v_shipment_number := NEW.shipment_number;
  v_waste_type := NEW.waste_type::text;
  v_quantity := COALESCE(NEW.quantity, 0);
  v_unit := COALESCE(NEW.unit, 'طن');
  v_pickup_address := COALESCE(NEW.pickup_address, '');
  v_delivery_address := COALESCE(NEW.delivery_address, '');

  SELECT name INTO v_generator_name FROM public.organizations WHERE id = NEW.generator_id;
  SELECT name INTO v_transporter_name FROM public.organizations WHERE id = NEW.transporter_id;
  SELECT name INTO v_recycler_name FROM public.organizations WHERE id = NEW.recycler_id;

  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    v_decl_text := 'أقر بتسليم شحنة النفايات رقم ' || v_shipment_number || ' بكمية ' || v_quantity || ' ' || v_unit;
    INSERT INTO public.delivery_declarations (
      shipment_id, shipment_number, declaration_type, declared_by_organization_id,
      generator_name, transporter_name, waste_type, quantity, unit, status, auto_generated, declared_at, declaration_text
    ) VALUES (
      NEW.id, v_shipment_number, 'generator_delivery', NEW.generator_id,
      v_generator_name, v_transporter_name, v_waste_type, v_quantity, v_unit, 'confirmed', true, now(), v_decl_text
    ) ON CONFLICT DO NOTHING;

    INSERT INTO public.shipment_receipts (
      receipt_number, shipment_id, generator_id, transporter_id, pickup_date,
      waste_type, declared_weight, unit, status, pickup_location
    ) VALUES (
      'REC-GEN-' || substr(NEW.id::text, 1, 8), NEW.id, NEW.generator_id, NEW.transporter_id,
      COALESCE(NEW.pickup_date, CURRENT_DATE), NEW.waste_type, v_quantity, v_unit, 'confirmed', v_pickup_address
    ) ON CONFLICT DO NOTHING;
  END IF;

  IF NEW.status IN ('in_transit', 'collecting') AND OLD.status NOT IN ('in_transit', 'collecting') THEN
    v_decl_text := 'أقر باستلام ونقل شحنة النفايات رقم ' || v_shipment_number || ' بكمية ' || v_quantity || ' ' || v_unit;
    INSERT INTO public.delivery_declarations (
      shipment_id, shipment_number, declaration_type, declared_by_organization_id,
      generator_name, transporter_name, waste_type, quantity, unit, status, auto_generated, declared_at, declaration_text
    ) VALUES (
      NEW.id, v_shipment_number, 'transporter_delivery', NEW.transporter_id,
      v_generator_name, v_transporter_name, v_waste_type, v_quantity, v_unit, 'confirmed', true, now(), v_decl_text
    ) ON CONFLICT DO NOTHING;

    INSERT INTO public.shipment_receipts (
      receipt_number, shipment_id, generator_id, transporter_id, pickup_date,
      waste_type, declared_weight, unit, status, pickup_location
    ) VALUES (
      'REC-TRN-' || substr(NEW.id::text, 1, 8), NEW.id, NEW.generator_id, NEW.transporter_id,
      COALESCE(NEW.pickup_date, CURRENT_DATE), NEW.waste_type, v_quantity, v_unit, 'confirmed', v_pickup_address
    ) ON CONFLICT DO NOTHING;
  END IF;

  IF NEW.status IN ('delivered', 'confirmed') AND OLD.status NOT IN ('delivered', 'confirmed') THEN
    v_decl_text := 'أقر باستلام شحنة النفايات رقم ' || v_shipment_number || ' بكمية ' || v_quantity || ' ' || v_unit;
    INSERT INTO public.delivery_declarations (
      shipment_id, shipment_number, declaration_type, declared_by_organization_id,
      generator_name, transporter_name, waste_type, quantity, unit, status, auto_generated, declared_at, declaration_text
    ) VALUES (
      NEW.id, v_shipment_number, 'recycler_receipt', NEW.recycler_id,
      v_generator_name, v_transporter_name, v_waste_type, v_quantity, v_unit, 'confirmed', true, now(), v_decl_text
    ) ON CONFLICT DO NOTHING;

    INSERT INTO public.shipment_receipts (
      receipt_number, shipment_id, generator_id, transporter_id, pickup_date,
      waste_type, declared_weight, unit, status, pickup_location
    ) VALUES (
      'REC-RCY-' || substr(NEW.id::text, 1, 8), NEW.id, NEW.generator_id, NEW.transporter_id,
      COALESCE(NEW.pickup_date, CURRENT_DATE), NEW.waste_type, v_quantity, v_unit, 'confirmed', v_delivery_address
    ) ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
