
-- 1. Landfill Cells Management
CREATE TABLE IF NOT EXISTS public.landfill_cells (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  disposal_facility_id UUID REFERENCES public.disposal_facilities(id),
  cell_code TEXT NOT NULL,
  sector TEXT,
  total_capacity_tons NUMERIC NOT NULL DEFAULT 0,
  used_capacity_tons NUMERIC NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'empty',
  waste_types_allowed TEXT[],
  opened_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.landfill_cells ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org landfill cells"
  ON public.landfill_cells FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own org landfill cells"
  ON public.landfill_cells FOR ALL
  USING (organization_id IN (SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid()));

-- 2. Disposal By-products (ash, leachate, etc.)
CREATE TABLE IF NOT EXISTS public.disposal_byproducts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  disposal_facility_id UUID REFERENCES public.disposal_facilities(id),
  operation_id UUID REFERENCES public.disposal_operations(id),
  byproduct_type TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'ton',
  hazard_level TEXT DEFAULT 'low',
  storage_location TEXT,
  disposal_method TEXT,
  disposed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'stored',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.disposal_byproducts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org byproducts"
  ON public.disposal_byproducts FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own org byproducts"
  ON public.disposal_byproducts FOR ALL
  USING (organization_id IN (SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid()));

-- 3. MRO Inventory (Maintenance, Repair, Operations supplies)
CREATE TABLE IF NOT EXISTS public.mro_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  disposal_facility_id UUID REFERENCES public.disposal_facilities(id),
  item_name TEXT NOT NULL,
  category TEXT DEFAULT 'chemical',
  sku TEXT,
  current_stock NUMERIC NOT NULL DEFAULT 0,
  minimum_stock NUMERIC DEFAULT 0,
  unit TEXT DEFAULT 'unit',
  unit_cost NUMERIC DEFAULT 0,
  supplier TEXT,
  last_restocked_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mro_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org MRO inventory"
  ON public.mro_inventory FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own org MRO inventory"
  ON public.mro_inventory FOR ALL
  USING (organization_id IN (SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid()));

-- 4. MRO Usage Log (consumption tracking per operation)
CREATE TABLE IF NOT EXISTS public.mro_usage_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  mro_item_id UUID NOT NULL REFERENCES public.mro_inventory(id),
  operation_id UUID REFERENCES public.disposal_operations(id),
  quantity_used NUMERIC NOT NULL DEFAULT 0,
  used_by TEXT,
  used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mro_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org MRO usage"
  ON public.mro_usage_log FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own org MRO usage"
  ON public.mro_usage_log FOR ALL
  USING (organization_id IN (SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid()));

-- 5. Chain of Custody signatures for disposal operations
CREATE TABLE IF NOT EXISTS public.disposal_custody_signatures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  operation_id UUID REFERENCES public.disposal_operations(id),
  step TEXT NOT NULL,
  signer_name TEXT NOT NULL,
  signer_role TEXT,
  signer_user_id UUID,
  signature_method TEXT DEFAULT 'password',
  signature_image_url TEXT,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  device_info TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.disposal_custody_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org custody signatures"
  ON public.disposal_custody_signatures FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own org custody signatures"
  ON public.disposal_custody_signatures FOR ALL
  USING (organization_id IN (SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid()));
