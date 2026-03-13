
CREATE OR REPLACE FUNCTION public.auto_calculate_shipment_price()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Safely skip if transporter_id is null
  IF NEW.transporter_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') 
     AND COALESCE(NEW.total_value, 0) = 0 THEN
    NEW.total_value := COALESCE(NEW.quantity, 1) * COALESCE(NEW.price_per_unit, 50);
  END IF;

  RETURN NEW;
END;
$$;
