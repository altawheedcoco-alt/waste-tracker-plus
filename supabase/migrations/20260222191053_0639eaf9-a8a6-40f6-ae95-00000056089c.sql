
CREATE OR REPLACE FUNCTION public.auto_calculate_shipment_price()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR 
     (TG_OP = 'UPDATE' AND (
       OLD.waste_type IS DISTINCT FROM NEW.waste_type OR
       OLD.quantity IS DISTINCT FROM NEW.quantity OR
       OLD.pickup_latitude IS DISTINCT FROM NEW.pickup_latitude OR
       OLD.delivery_latitude IS DISTINCT FROM NEW.delivery_latitude OR
       OLD.award_letter_id IS DISTINCT FROM NEW.award_letter_id OR
       OLD.price_source IS DISTINCT FROM NEW.price_source
     )) THEN
    
    IF NEW.price_source IS NULL OR NEW.price_source != 'manual' THEN
      PERFORM net.http_post(
        url := 'https://jejwizkssmqzxwseqsre.supabase.co/functions/v1/auto-price-calculator',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Implandpemtzc21xenh3c2Vxc3JlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MDI2MTcsImV4cCI6MjA4NTM3ODYxN30.cuO0gX41P_QIdCrdj4-yw8q8otcr-hUPDySuoXNiUPY'
        ),
        body := jsonb_build_object('shipmentId', NEW.id)
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;
