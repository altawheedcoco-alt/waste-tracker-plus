
-- Product carbon footprint for recycled products
CREATE TABLE public.recycler_product_carbon (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  shipment_id UUID REFERENCES public.shipments(id),
  product_name TEXT NOT NULL DEFAULT 'منتج مُدوَّر',
  waste_type TEXT NOT NULL DEFAULT 'other',
  input_weight_tons NUMERIC NOT NULL DEFAULT 0,
  output_weight_tons NUMERIC NOT NULL DEFAULT 0,
  transport_emissions NUMERIC NOT NULL DEFAULT 0,
  processing_emissions NUMERIC NOT NULL DEFAULT 0,
  recycling_savings NUMERIC NOT NULL DEFAULT 0,
  total_emissions NUMERIC NOT NULL DEFAULT 0,
  net_impact NUMERIC NOT NULL DEFAULT 0,
  distance_km NUMERIC NOT NULL DEFAULT 0,
  trees_equivalent INTEGER NOT NULL DEFAULT 0,
  cars_equivalent NUMERIC NOT NULL DEFAULT 0,
  recycling_rate NUMERIC NOT NULL DEFAULT 0,
  certificate_number TEXT,
  certificate_issued BOOLEAN DEFAULT false,
  certificate_issued_at TIMESTAMPTZ,
  calculation_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Facility carbon summary (periodic)
CREATE TABLE public.recycler_facility_carbon (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  period_type TEXT NOT NULL DEFAULT 'monthly',
  total_input_tons NUMERIC NOT NULL DEFAULT 0,
  total_output_tons NUMERIC NOT NULL DEFAULT 0,
  total_transport_emissions NUMERIC NOT NULL DEFAULT 0,
  total_processing_emissions NUMERIC NOT NULL DEFAULT 0,
  total_recycling_savings NUMERIC NOT NULL DEFAULT 0,
  total_emissions NUMERIC NOT NULL DEFAULT 0,
  total_net_impact NUMERIC NOT NULL DEFAULT 0,
  total_trees_equivalent INTEGER NOT NULL DEFAULT 0,
  total_cars_equivalent NUMERIC NOT NULL DEFAULT 0,
  recycling_rate NUMERIC NOT NULL DEFAULT 0,
  sustainability_score INTEGER NOT NULL DEFAULT 0,
  shipments_count INTEGER NOT NULL DEFAULT 0,
  certificate_number TEXT,
  certificate_issued BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.recycler_product_carbon ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recycler_facility_carbon ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Org members can view their product carbon" ON public.recycler_product_carbon
  FOR SELECT USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Org members can insert product carbon" ON public.recycler_product_carbon
  FOR INSERT WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Org members can update product carbon" ON public.recycler_product_carbon
  FOR UPDATE USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Org members can view facility carbon" ON public.recycler_facility_carbon
  FOR SELECT USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Org members can insert facility carbon" ON public.recycler_facility_carbon
  FOR INSERT WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Org members can update facility carbon" ON public.recycler_facility_carbon
  FOR UPDATE USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_recycler_product_carbon_updated_at
  BEFORE UPDATE ON public.recycler_product_carbon
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_recycler_facility_carbon_updated_at
  BEFORE UPDATE ON public.recycler_facility_carbon
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
