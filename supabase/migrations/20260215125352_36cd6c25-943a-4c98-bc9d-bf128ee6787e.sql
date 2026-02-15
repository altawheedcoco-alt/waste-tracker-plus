
-- Function to auto-generate permits for existing shipments
CREATE OR REPLACE FUNCTION public.auto_generate_permits_for_shipments()
RETURNS TABLE(permits_created integer, shipments_processed integer) AS $$
DECLARE
  v_permits_created integer := 0;
  v_shipments_processed integer := 0;
  v_shipment record;
  v_permit_number text;
  v_org_id uuid;
  v_existing_count integer;
BEGIN
  FOR v_shipment IN
    SELECT s.id, s.shipment_number, s.waste_type, s.waste_description,
           s.quantity, s.unit, s.manual_vehicle_plate, s.manual_driver_name,
           s.pickup_date, s.generator_id, s.transporter_id, s.recycler_id,
           s.status
    FROM shipments s
    ORDER BY s.created_at DESC
  LOOP
    v_shipments_processed := v_shipments_processed + 1;

    -- Create waste_exit permit for generator org
    IF v_shipment.generator_id IS NOT NULL THEN
      SELECT COUNT(*) INTO v_existing_count
      FROM permits
      WHERE shipment_id = v_shipment.id
        AND organization_id = v_shipment.generator_id
        AND permit_type = 'waste_exit';

      IF v_existing_count = 0 THEN
        v_permit_number := 'PRM-' || to_char(now(), 'YYMM') || '-' || upper(substr(md5(random()::text), 1, 6));
        INSERT INTO permits (
          permit_number, permit_type, status, organization_id, issuer_organization_id,
          shipment_id, waste_type, waste_description, estimated_quantity, quantity_unit,
          vehicle_plate, person_name, valid_from, purpose, verification_code
        ) VALUES (
          v_permit_number, 'waste_exit', 'active', v_shipment.generator_id, v_shipment.generator_id,
          v_shipment.id, v_shipment.waste_type::text, v_shipment.waste_description, v_shipment.quantity, COALESCE(v_shipment.unit, 'ton'),
          v_shipment.manual_vehicle_plate, v_shipment.manual_driver_name,
          COALESCE(v_shipment.pickup_date::timestamptz, now()),
          'تصريح خروج مخلفات - شحنة ' || v_shipment.shipment_number,
          upper(substr(md5(random()::text), 1, 8))
        );
        v_permits_created := v_permits_created + 1;
      END IF;
    END IF;

    -- Create transport permit for transporter org
    IF v_shipment.transporter_id IS NOT NULL THEN
      SELECT COUNT(*) INTO v_existing_count
      FROM permits
      WHERE shipment_id = v_shipment.id
        AND organization_id = v_shipment.transporter_id
        AND permit_type = 'transport';

      IF v_existing_count = 0 THEN
        v_permit_number := 'PRM-' || to_char(now(), 'YYMM') || '-' || upper(substr(md5(random()::text), 1, 6));
        INSERT INTO permits (
          permit_number, permit_type, status, organization_id, issuer_organization_id,
          shipment_id, waste_type, waste_description, estimated_quantity, quantity_unit,
          vehicle_plate, person_name, valid_from, purpose, verification_code
        ) VALUES (
          v_permit_number, 'transport', 'active', v_shipment.transporter_id, v_shipment.transporter_id,
          v_shipment.id, v_shipment.waste_type::text, v_shipment.waste_description, v_shipment.quantity, COALESCE(v_shipment.unit, 'ton'),
          v_shipment.manual_vehicle_plate, v_shipment.manual_driver_name,
          COALESCE(v_shipment.pickup_date::timestamptz, now()),
          'تصريح نقل - شحنة ' || v_shipment.shipment_number,
          upper(substr(md5(random()::text), 1, 8))
        );
        v_permits_created := v_permits_created + 1;
      END IF;
    END IF;

    -- Create person_access permit for transporter (driver access)
    IF v_shipment.transporter_id IS NOT NULL THEN
      SELECT COUNT(*) INTO v_existing_count
      FROM permits
      WHERE shipment_id = v_shipment.id
        AND organization_id = v_shipment.transporter_id
        AND permit_type = 'person_access';

      IF v_existing_count = 0 THEN
        v_permit_number := 'PRM-' || to_char(now(), 'YYMM') || '-' || upper(substr(md5(random()::text), 1, 6));
        INSERT INTO permits (
          permit_number, permit_type, status, organization_id, issuer_organization_id,
          shipment_id, person_name, person_role, vehicle_plate,
          valid_from, purpose, verification_code
        ) VALUES (
          v_permit_number, 'person_access', 'active', v_shipment.transporter_id, v_shipment.transporter_id,
          v_shipment.id, COALESCE(v_shipment.manual_driver_name, 'سائق الشحنة ' || v_shipment.shipment_number), 'سائق',
          v_shipment.manual_vehicle_plate,
          COALESCE(v_shipment.pickup_date::timestamptz, now()),
          'تصريح دخول سائق - شحنة ' || v_shipment.shipment_number,
          upper(substr(md5(random()::text), 1, 8))
        );
        v_permits_created := v_permits_created + 1;
      END IF;
    END IF;
  END LOOP;

  RETURN QUERY SELECT v_permits_created, v_shipments_processed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger function for auto-creating permits when a new shipment is created
CREATE OR REPLACE FUNCTION public.trigger_auto_create_permits()
RETURNS trigger AS $$
DECLARE
  v_permit_number text;
BEGIN
  -- Waste exit permit for generator
  IF NEW.generator_id IS NOT NULL THEN
    v_permit_number := 'PRM-' || to_char(now(), 'YYMM') || '-' || upper(substr(md5(random()::text), 1, 6));
    INSERT INTO permits (
      permit_number, permit_type, status, organization_id, issuer_organization_id,
      shipment_id, waste_type, waste_description, estimated_quantity, quantity_unit,
      vehicle_plate, person_name, valid_from, purpose, verification_code
    ) VALUES (
      v_permit_number, 'waste_exit', 'draft', NEW.generator_id, NEW.generator_id,
      NEW.id, NEW.waste_type::text, NEW.waste_description, NEW.quantity, COALESCE(NEW.unit, 'ton'),
      NEW.manual_vehicle_plate, NEW.manual_driver_name,
      COALESCE(NEW.pickup_date::timestamptz, now()),
      'تصريح خروج مخلفات - شحنة ' || NEW.shipment_number,
      upper(substr(md5(random()::text), 1, 8))
    );
  END IF;

  -- Transport permit for transporter
  IF NEW.transporter_id IS NOT NULL THEN
    v_permit_number := 'PRM-' || to_char(now(), 'YYMM') || '-' || upper(substr(md5(random()::text), 1, 6));
    INSERT INTO permits (
      permit_number, permit_type, status, organization_id, issuer_organization_id,
      shipment_id, waste_type, waste_description, estimated_quantity, quantity_unit,
      vehicle_plate, person_name, valid_from, purpose, verification_code
    ) VALUES (
      v_permit_number, 'transport', 'draft', NEW.transporter_id, NEW.transporter_id,
      NEW.id, NEW.waste_type::text, NEW.waste_description, NEW.quantity, COALESCE(NEW.unit, 'ton'),
      NEW.manual_vehicle_plate, NEW.manual_driver_name,
      COALESCE(NEW.pickup_date::timestamptz, now()),
      'تصريح نقل - شحنة ' || NEW.shipment_number,
      upper(substr(md5(random()::text), 1, 8))
    );
  END IF;

  -- Person access permit for driver
  IF NEW.transporter_id IS NOT NULL THEN
    v_permit_number := 'PRM-' || to_char(now(), 'YYMM') || '-' || upper(substr(md5(random()::text), 1, 6));
    INSERT INTO permits (
      permit_number, permit_type, status, organization_id, issuer_organization_id,
      shipment_id, person_name, person_role, vehicle_plate,
      valid_from, purpose, verification_code
    ) VALUES (
      v_permit_number, 'person_access', 'draft', NEW.transporter_id, NEW.transporter_id,
      NEW.id, COALESCE(NEW.manual_driver_name, 'سائق الشحنة ' || NEW.shipment_number), 'سائق',
      NEW.manual_vehicle_plate,
      COALESCE(NEW.pickup_date::timestamptz, now()),
      'تصريح دخول سائق - شحنة ' || NEW.shipment_number,
      upper(substr(md5(random()::text), 1, 8))
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on shipments table
DROP TRIGGER IF EXISTS auto_create_permits_on_shipment ON public.shipments;
CREATE TRIGGER auto_create_permits_on_shipment
  AFTER INSERT ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_auto_create_permits();
