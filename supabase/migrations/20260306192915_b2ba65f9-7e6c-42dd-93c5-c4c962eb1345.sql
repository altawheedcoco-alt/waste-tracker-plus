
CREATE OR REPLACE FUNCTION public.generate_annual_plan_number()
RETURNS trigger LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.plan_number = '' OR NEW.plan_number IS NULL THEN
    NEW.plan_number := 'AP-' || NEW.plan_year || '-' || LPAD(
      (SELECT COALESCE(MAX(CAST(SUBSTRING(plan_number FROM '[0-9]+$') AS integer)), 0) + 1
       FROM public.transporter_annual_plans
       WHERE organization_id = NEW.organization_id AND plan_year = NEW.plan_year)::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;
