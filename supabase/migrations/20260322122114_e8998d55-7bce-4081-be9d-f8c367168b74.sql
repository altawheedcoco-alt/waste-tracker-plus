-- 1. Create driver_type enum
DO $$ BEGIN
  CREATE TYPE public.driver_type AS ENUM ('company', 'hired', 'independent');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Add new columns to drivers table
ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS driver_type public.driver_type NOT NULL DEFAULT 'company',
  ADD COLUMN IF NOT EXISTS service_area_km numeric DEFAULT 10,
  ADD COLUMN IF NOT EXISTS rating numeric DEFAULT 5.0,
  ADD COLUMN IF NOT EXISTS total_trips integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS acceptance_rate numeric DEFAULT 100,
  ADD COLUMN IF NOT EXISTS rejection_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS preferred_waste_types text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS hourly_rate numeric,
  ADD COLUMN IF NOT EXISTS per_trip_rate numeric;

-- 3. Set existing drivers with organization_id as 'company'
UPDATE public.drivers SET driver_type = 'company' WHERE organization_id IS NOT NULL AND driver_type IS NULL;

-- 4. Set existing drivers without organization_id as 'independent'
UPDATE public.drivers SET driver_type = 'independent' WHERE organization_id IS NULL AND driver_type IS NULL;

-- 5. Create driver_mission_offers table
CREATE TABLE IF NOT EXISTS public.driver_mission_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid REFERENCES public.shipments(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES public.drivers(id) ON DELETE CASCADE NOT NULL,
  offered_by_org_id uuid REFERENCES public.organizations(id),
  offer_type text NOT NULL DEFAULT 'smart_dispatch' CHECK (offer_type IN ('smart_dispatch', 'direct_hire', 'marketplace')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired', 'cancelled')),
  offered_price numeric,
  final_price numeric,
  distance_km numeric,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '15 minutes'),
  response_at timestamptz,
  rejection_reason text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.driver_mission_offers ENABLE ROW LEVEL SECURITY;

-- RLS: Drivers see their own offers
CREATE POLICY "drivers_see_own_offers" ON public.driver_mission_offers
  FOR SELECT TO authenticated
  USING (
    driver_id IN (SELECT id FROM public.drivers WHERE profile_id = auth.uid())
  );

-- RLS: Organizations see offers they created
CREATE POLICY "orgs_see_own_offers" ON public.driver_mission_offers
  FOR SELECT TO authenticated
  USING (
    offered_by_org_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
  );

-- RLS: Organizations can create offers
CREATE POLICY "orgs_create_offers" ON public.driver_mission_offers
  FOR INSERT TO authenticated
  WITH CHECK (
    offered_by_org_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
  );

-- RLS: Drivers can update their own offers (accept/reject)
CREATE POLICY "drivers_update_own_offers" ON public.driver_mission_offers
  FOR UPDATE TO authenticated
  USING (
    driver_id IN (SELECT id FROM public.drivers WHERE profile_id = auth.uid())
  );

-- 6. Create driver_hire_contracts table
CREATE TABLE IF NOT EXISTS public.driver_hire_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid REFERENCES public.drivers(id) ON DELETE CASCADE NOT NULL,
  hiring_org_id uuid REFERENCES public.organizations(id) NOT NULL,
  contract_type text NOT NULL DEFAULT 'per_trip' CHECK (contract_type IN ('per_trip', 'hourly', 'daily', 'weekly', 'monthly')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'cancelled', 'expired')),
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz,
  agreed_rate numeric NOT NULL,
  total_trips_completed integer DEFAULT 0,
  total_earnings numeric DEFAULT 0,
  terms text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.driver_hire_contracts ENABLE ROW LEVEL SECURITY;

-- RLS for hire contracts
CREATE POLICY "drivers_see_own_contracts" ON public.driver_hire_contracts
  FOR SELECT TO authenticated
  USING (driver_id IN (SELECT id FROM public.drivers WHERE profile_id = auth.uid()));

CREATE POLICY "orgs_see_own_contracts" ON public.driver_hire_contracts
  FOR SELECT TO authenticated
  USING (hiring_org_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()));

CREATE POLICY "orgs_create_contracts" ON public.driver_hire_contracts
  FOR INSERT TO authenticated
  WITH CHECK (hiring_org_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()));

CREATE POLICY "orgs_update_contracts" ON public.driver_hire_contracts
  FOR UPDATE TO authenticated
  USING (hiring_org_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()));

-- Enable realtime for offers
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_mission_offers;