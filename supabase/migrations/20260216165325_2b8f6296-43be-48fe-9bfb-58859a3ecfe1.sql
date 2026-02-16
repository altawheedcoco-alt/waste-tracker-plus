
-- Dynamic Pricing Rules table
CREATE TABLE public.dynamic_pricing_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  waste_type TEXT NOT NULL,
  base_price NUMERIC NOT NULL DEFAULT 0,
  distance_multiplier NUMERIC DEFAULT 1.0,
  weight_multiplier NUMERIC DEFAULT 1.0,
  peak_hour_surcharge NUMERIC DEFAULT 0,
  weekend_surcharge NUMERIC DEFAULT 0,
  urgent_surcharge NUMERIC DEFAULT 0,
  low_demand_discount NUMERIC DEFAULT 0,
  min_price NUMERIC DEFAULT 0,
  max_price NUMERIC,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pricing calculation logs
CREATE TABLE public.pricing_calculations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  shipment_id UUID REFERENCES public.shipments(id),
  waste_type TEXT,
  base_price NUMERIC NOT NULL,
  final_price NUMERIC NOT NULL,
  factors JSONB DEFAULT '{}',
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Public tracking tokens for client portal
CREATE TABLE public.tracking_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  views_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Driver copilot tasks
CREATE TABLE public.driver_copilot_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  shipment_id UUID REFERENCES public.shipments(id),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL DEFAULT 'pickup',
  task_order INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  title TEXT NOT NULL,
  description TEXT,
  location_name TEXT,
  location_lat NUMERIC,
  location_lng NUMERIC,
  estimated_arrival TIMESTAMPTZ,
  actual_arrival TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  voice_note_url TEXT,
  photo_proof_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dynamic_pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_copilot_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dynamic_pricing_rules
CREATE POLICY "Org members can view pricing rules" ON public.dynamic_pricing_rules FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid()));
CREATE POLICY "Org members can manage pricing rules" ON public.dynamic_pricing_rules FOR ALL
  USING (organization_id IN (SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid()));

-- RLS Policies for pricing_calculations
CREATE POLICY "Org members can view pricing calculations" ON public.pricing_calculations FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid()));
CREATE POLICY "Org members can insert pricing calculations" ON public.pricing_calculations FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid()));

-- RLS Policies for tracking_tokens (public read by token, org members manage)
CREATE POLICY "Anyone can view active tracking tokens" ON public.tracking_tokens FOR SELECT USING (true);
CREATE POLICY "Org members can manage tracking tokens" ON public.tracking_tokens FOR ALL
  USING (organization_id IN (SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid()));

-- RLS Policies for driver_copilot_tasks
CREATE POLICY "Org members can view copilot tasks" ON public.driver_copilot_tasks FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid()));
CREATE POLICY "Org members can manage copilot tasks" ON public.driver_copilot_tasks FOR ALL
  USING (organization_id IN (SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid()));

-- Indexes
CREATE INDEX idx_pricing_rules_org ON public.dynamic_pricing_rules(organization_id);
CREATE INDEX idx_tracking_tokens_token ON public.tracking_tokens(token);
CREATE INDEX idx_tracking_tokens_shipment ON public.tracking_tokens(shipment_id);
CREATE INDEX idx_copilot_tasks_driver ON public.driver_copilot_tasks(driver_id);
CREATE INDEX idx_copilot_tasks_status ON public.driver_copilot_tasks(status);

-- Update timestamp trigger
CREATE TRIGGER update_dynamic_pricing_rules_updated_at BEFORE UPDATE ON public.dynamic_pricing_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_driver_copilot_tasks_updated_at BEFORE UPDATE ON public.driver_copilot_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
