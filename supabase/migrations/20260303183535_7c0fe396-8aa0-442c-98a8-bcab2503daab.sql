
-- 1. Scheduled Collections for Generators
CREATE TABLE public.scheduled_collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  transporter_id UUID REFERENCES public.organizations(id),
  title TEXT NOT NULL,
  waste_type TEXT NOT NULL,
  estimated_quantity NUMERIC DEFAULT 0,
  unit TEXT DEFAULT 'طن',
  pickup_address TEXT,
  pickup_latitude NUMERIC,
  pickup_longitude NUMERIC,
  frequency TEXT NOT NULL DEFAULT 'weekly', -- daily, weekly, biweekly, monthly
  preferred_day TEXT, -- saturday, sunday, etc
  preferred_time_from TIME,
  preferred_time_to TIME,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  next_collection_date DATE,
  is_active BOOLEAN DEFAULT true,
  auto_create_shipment BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.scheduled_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can manage their schedules"
  ON public.scheduled_collections FOR ALL
  USING (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    OR transporter_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

-- 2. Production Batches for Recyclers (Input → Output tracking)
CREATE TABLE public.production_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  batch_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress', -- in_progress, completed, cancelled
  input_waste_type TEXT NOT NULL,
  input_quantity NUMERIC NOT NULL DEFAULT 0,
  input_unit TEXT DEFAULT 'طن',
  output_product_type TEXT,
  output_quantity NUMERIC DEFAULT 0,
  output_unit TEXT DEFAULT 'طن',
  waste_residue_quantity NUMERIC DEFAULT 0,
  extraction_rate NUMERIC GENERATED ALWAYS AS (
    CASE WHEN input_quantity > 0 THEN ROUND((output_quantity / input_quantity) * 100, 2) ELSE 0 END
  ) STORED,
  production_line TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  labor_cost NUMERIC DEFAULT 0,
  energy_cost NUMERIC DEFAULT 0,
  materials_cost NUMERIC DEFAULT 0,
  total_cost NUMERIC GENERATED ALWAYS AS (labor_cost + energy_cost + materials_cost) STORED,
  cost_per_ton NUMERIC GENERATED ALWAYS AS (
    CASE WHEN output_quantity > 0 THEN ROUND((labor_cost + energy_cost + materials_cost) / output_quantity, 2) ELSE 0 END
  ) STORED,
  quality_grade TEXT, -- A, B, C
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.production_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can manage production batches"
  ON public.production_batches FOR ALL
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 3. Production batch source shipments (linking input shipments to batches)
CREATE TABLE public.production_batch_inputs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES public.production_batches(id) ON DELETE CASCADE,
  shipment_id UUID REFERENCES public.shipments(id),
  waste_type TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'طن',
  supplier_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.production_batch_inputs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Batch inputs follow batch access"
  ON public.production_batch_inputs FOR ALL
  USING (batch_id IN (SELECT id FROM public.production_batches WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())));

-- Indexes
CREATE INDEX idx_scheduled_collections_org ON public.scheduled_collections(organization_id);
CREATE INDEX idx_scheduled_collections_next ON public.scheduled_collections(next_collection_date) WHERE is_active = true;
CREATE INDEX idx_production_batches_org ON public.production_batches(organization_id);
CREATE INDEX idx_production_batch_inputs_batch ON public.production_batch_inputs(batch_id);

-- Batch number sequence trigger
CREATE OR REPLACE FUNCTION public.generate_batch_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.batch_number := 'BATCH-' || TO_CHAR(now(), 'YYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 9999)::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_batch_number
  BEFORE INSERT ON public.production_batches
  FOR EACH ROW
  WHEN (NEW.batch_number IS NULL OR NEW.batch_number = '')
  EXECUTE FUNCTION public.generate_batch_number();
