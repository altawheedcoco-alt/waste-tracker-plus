
CREATE TABLE public.waste_inventory_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  waste_type TEXT NOT NULL,
  capacity_tons NUMERIC NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'ton',
  alert_threshold_percent NUMERIC DEFAULT 20,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, waste_type)
);

ALTER TABLE public.waste_inventory_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own org inventory"
  ON public.waste_inventory_settings FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
