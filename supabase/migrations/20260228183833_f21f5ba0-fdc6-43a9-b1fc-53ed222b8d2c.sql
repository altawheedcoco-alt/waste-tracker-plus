
-- ═══ Green Points Configuration (consultant sets factors per waste type) ═══
CREATE TABLE public.green_points_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  consultant_id UUID REFERENCES public.environmental_consultants(id) ON DELETE SET NULL,
  waste_type TEXT NOT NULL,
  points_per_ton NUMERIC NOT NULL DEFAULT 100,
  trees_per_ton NUMERIC NOT NULL DEFAULT 0,
  energy_saved_kwh_per_ton NUMERIC NOT NULL DEFAULT 0,
  water_saved_liters_per_ton NUMERIC NOT NULL DEFAULT 0,
  quality_multiplier NUMERIC NOT NULL DEFAULT 1.0,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, waste_type)
);

-- ═══ Green Points Transactions (per-shipment verified points) ═══
CREATE TABLE public.green_points_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  shipment_id UUID REFERENCES public.shipments(id) ON DELETE SET NULL,
  consultant_id UUID REFERENCES public.environmental_consultants(id) ON DELETE SET NULL,
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  waste_type TEXT NOT NULL,
  weight_tons NUMERIC NOT NULL DEFAULT 0,
  base_points NUMERIC NOT NULL DEFAULT 0,
  quality_multiplier NUMERIC NOT NULL DEFAULT 1.0,
  final_points NUMERIC NOT NULL DEFAULT 0,
  trees_saved NUMERIC NOT NULL DEFAULT 0,
  co2_saved_tons NUMERIC NOT NULL DEFAULT 0,
  energy_saved_kwh NUMERIC NOT NULL DEFAULT 0,
  water_saved_liters NUMERIC NOT NULL DEFAULT 0,
  verification_status TEXT NOT NULL DEFAULT 'pending',
  verification_notes TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══ Green Points Balance (org-level running total) ═══
CREATE TABLE public.green_points_balance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL UNIQUE,
  total_points NUMERIC NOT NULL DEFAULT 0,
  total_trees_saved NUMERIC NOT NULL DEFAULT 0,
  total_co2_saved_tons NUMERIC NOT NULL DEFAULT 0,
  total_energy_saved_kwh NUMERIC NOT NULL DEFAULT 0,
  total_water_saved_liters NUMERIC NOT NULL DEFAULT 0,
  total_shipments_verified INTEGER NOT NULL DEFAULT 0,
  green_level TEXT NOT NULL DEFAULT 'bronze',
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══ Transporter Green Rating (consultant rates transport offices) ═══
CREATE TABLE public.transporter_green_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transporter_org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  consultant_id UUID REFERENCES public.environmental_consultants(id) ON DELETE SET NULL,
  rating_period TEXT NOT NULL,
  punctuality_score NUMERIC NOT NULL DEFAULT 0,
  waste_handling_score NUMERIC NOT NULL DEFAULT 0,
  compliance_score NUMERIC NOT NULL DEFAULT 0,
  overall_score NUMERIC NOT NULL DEFAULT 0,
  green_badge TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(transporter_org_id, rating_period)
);

-- ═══ RLS ═══
ALTER TABLE public.green_points_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.green_points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.green_points_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transporter_green_ratings ENABLE ROW LEVEL SECURITY;

-- Config: org members + assigned consultants
CREATE POLICY "Org members can view green points config"
ON public.green_points_config FOR SELECT TO authenticated
USING (
  organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.consultant_organization_assignments coa
    JOIN public.environmental_consultants ec ON ec.id = coa.consultant_id
    WHERE coa.organization_id = green_points_config.organization_id
    AND ec.user_id = auth.uid() AND coa.is_active = true
  )
);

CREATE POLICY "Consultants can manage green points config"
ON public.green_points_config FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.consultant_organization_assignments coa
    JOIN public.environmental_consultants ec ON ec.id = coa.consultant_id
    WHERE coa.organization_id = green_points_config.organization_id
    AND ec.user_id = auth.uid() AND coa.is_active = true
  )
);

-- Transactions: org members + consultants
CREATE POLICY "View green points transactions"
ON public.green_points_transactions FOR SELECT TO authenticated
USING (
  organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.consultant_organization_assignments coa
    JOIN public.environmental_consultants ec ON ec.id = coa.consultant_id
    WHERE coa.organization_id = green_points_transactions.organization_id
    AND ec.user_id = auth.uid() AND coa.is_active = true
  )
);

CREATE POLICY "Consultants can manage green points transactions"
ON public.green_points_transactions FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.consultant_organization_assignments coa
    JOIN public.environmental_consultants ec ON ec.id = coa.consultant_id
    WHERE coa.organization_id = green_points_transactions.organization_id
    AND ec.user_id = auth.uid() AND coa.is_active = true
  )
);

-- Balance: org members + consultants
CREATE POLICY "View green points balance"
ON public.green_points_balance FOR SELECT TO authenticated
USING (
  organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.consultant_organization_assignments coa
    JOIN public.environmental_consultants ec ON ec.id = coa.consultant_id
    WHERE coa.organization_id = green_points_balance.organization_id
    AND ec.user_id = auth.uid() AND coa.is_active = true
  )
);

CREATE POLICY "Consultants can manage green points balance"
ON public.green_points_balance FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.consultant_organization_assignments coa
    JOIN public.environmental_consultants ec ON ec.id = coa.consultant_id
    WHERE coa.organization_id = green_points_balance.organization_id
    AND ec.user_id = auth.uid() AND coa.is_active = true
  )
);

-- Transporter ratings: transporter org + consultants
CREATE POLICY "View transporter green ratings"
ON public.transporter_green_ratings FOR SELECT TO authenticated
USING (
  transporter_org_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.consultant_organization_assignments coa
    JOIN public.environmental_consultants ec ON ec.id = coa.consultant_id
    WHERE coa.organization_id = transporter_green_ratings.transporter_org_id
    AND ec.user_id = auth.uid() AND coa.is_active = true
  )
);

CREATE POLICY "Consultants can manage transporter ratings"
ON public.transporter_green_ratings FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.consultant_organization_assignments coa
    JOIN public.environmental_consultants ec ON ec.id = coa.consultant_id
    WHERE ec.user_id = auth.uid() AND coa.is_active = true
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_green_points_config_updated_at
BEFORE UPDATE ON public.green_points_config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
