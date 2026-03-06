
CREATE TABLE public.transporter_annual_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan_number text NOT NULL DEFAULT '',
  plan_year integer NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
  status text NOT NULL DEFAULT 'draft',
  plan_type text NOT NULL DEFAULT 'auto',
  
  -- Company info
  company_data jsonb DEFAULT '{}',
  
  -- Waste types covered
  waste_categories text[] DEFAULT '{}',
  
  -- Equipment & vehicles
  vehicles_data jsonb DEFAULT '[]',
  
  -- Operations & routes
  operations_data jsonb DEFAULT '{}',
  
  -- Disposal plan
  disposal_plan jsonb DEFAULT '{}',
  
  -- Safety procedures
  safety_procedures jsonb DEFAULT '{}',
  
  -- Workforce & training
  workforce_data jsonb DEFAULT '{}',
  
  -- Subcontractors
  subcontractors jsonb DEFAULT '[]',
  
  notes text,
  submitted_at timestamptz,
  submitted_by uuid,
  approved_at timestamptz,
  approved_by text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.transporter_annual_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their org annual plans"
  ON public.transporter_annual_plans
  FOR ALL
  TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- Auto-generate plan number
CREATE OR REPLACE FUNCTION public.generate_annual_plan_number()
RETURNS trigger LANGUAGE plpgsql AS $$
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

CREATE TRIGGER trg_generate_annual_plan_number
  BEFORE INSERT ON public.transporter_annual_plans
  FOR EACH ROW EXECUTE FUNCTION public.generate_annual_plan_number();
