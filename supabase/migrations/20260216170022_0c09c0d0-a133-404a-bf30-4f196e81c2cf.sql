
-- Create a function to auto-trigger pricing on shipment insert/update
-- This calls the edge function via pg_net (http extension)
CREATE OR REPLACE FUNCTION public.auto_calculate_shipment_price()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only trigger when relevant pricing fields change or on insert
  IF TG_OP = 'INSERT' OR 
     (TG_OP = 'UPDATE' AND (
       OLD.waste_type IS DISTINCT FROM NEW.waste_type OR
       OLD.quantity IS DISTINCT FROM NEW.quantity OR
       OLD.pickup_latitude IS DISTINCT FROM NEW.pickup_latitude OR
       OLD.delivery_latitude IS DISTINCT FROM NEW.delivery_latitude OR
       OLD.award_letter_id IS DISTINCT FROM NEW.award_letter_id OR
       OLD.price_source IS DISTINCT FROM NEW.price_source
     )) THEN
    
    -- Only auto-price if price_source is not 'manual' (respect manual overrides)
    IF NEW.price_source IS NULL OR NEW.price_source != 'manual' THEN
      -- Use pg_net to call edge function asynchronously
      PERFORM net.http_post(
        url := current_setting('app.settings.supabase_url', true) || '/functions/v1/auto-price-calculator',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := jsonb_build_object('shipmentId', NEW.id)
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS trg_auto_price_shipment ON public.shipments;
CREATE TRIGGER trg_auto_price_shipment
  AFTER INSERT OR UPDATE ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_calculate_shipment_price();

-- Add default pricing rules for common waste types (template for new orgs)
-- These serve as a baseline; organizations customize their own rules
CREATE TABLE IF NOT EXISTS public.pricing_rule_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  waste_type TEXT NOT NULL,
  base_price NUMERIC NOT NULL DEFAULT 100,
  distance_multiplier NUMERIC DEFAULT 1.5,
  weight_multiplier NUMERIC DEFAULT 1.2,
  peak_hour_surcharge NUMERIC DEFAULT 20,
  weekend_surcharge NUMERIC DEFAULT 15,
  urgent_surcharge NUMERIC DEFAULT 50,
  min_price NUMERIC DEFAULT 50,
  max_price NUMERIC DEFAULT 2000,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pricing_rule_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read pricing templates" ON public.pricing_rule_templates FOR SELECT USING (true);

-- Insert default templates
INSERT INTO public.pricing_rule_templates (waste_type, base_price, distance_multiplier, weight_multiplier, peak_hour_surcharge, weekend_surcharge, urgent_surcharge, min_price, max_price, description) VALUES
  ('نفايات عامة', 80, 1.3, 1.1, 15, 10, 40, 50, 1000, 'تسعير افتراضي للنفايات العامة'),
  ('نفايات خطرة', 200, 1.8, 1.5, 30, 25, 100, 150, 5000, 'تسعير مرتفع للنفايات الخطرة - يتطلب معدات خاصة'),
  ('نفايات طبية', 250, 1.6, 1.4, 25, 20, 80, 180, 4000, 'تسعير للنفايات الطبية - معايير صحية صارمة'),
  ('نفايات إلكترونية', 150, 1.4, 1.3, 20, 15, 60, 100, 3000, 'نفايات إلكترونية - تتطلب معالجة متخصصة'),
  ('نفايات بناء', 60, 1.5, 1.2, 10, 10, 30, 40, 800, 'أنقاض ومخلفات بناء'),
  ('خردة معدنية', 50, 1.3, 1.1, 10, 5, 25, 30, 600, 'خردة ومعادن قابلة لإعادة التدوير'),
  ('ورق وكرتون', 40, 1.2, 1.0, 5, 5, 20, 25, 400, 'ورق وكرتون - كثافة منخفضة'),
  ('بلاستيك', 45, 1.2, 1.1, 5, 5, 20, 25, 500, 'بلاستيك بأنواعه');
