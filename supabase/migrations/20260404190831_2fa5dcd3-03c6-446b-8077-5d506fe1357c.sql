
-- Add new columns to fuel_records for fraud detection and analytics
ALTER TABLE public.fuel_records
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS vehicle_plate text,
  ADD COLUMN IF NOT EXISTS km_since_last_fill numeric,
  ADD COLUMN IF NOT EXISTS l_per_100km numeric,
  ADD COLUMN IF NOT EXISTS fraud_flags jsonb DEFAULT '[]'::jsonb;

-- Internal fuel tanks table
CREATE TABLE IF NOT EXISTS public.fuel_tanks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  tank_name text NOT NULL,
  fuel_type text NOT NULL DEFAULT 'diesel',
  capacity_liters numeric NOT NULL DEFAULT 0,
  current_level numeric NOT NULL DEFAULT 0,
  location text,
  low_level_threshold numeric NOT NULL DEFAULT 20,
  is_active boolean NOT NULL DEFAULT true,
  last_refill_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fuel_tanks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org fuel tanks"
  ON public.fuel_tanks FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage own org fuel tanks"
  ON public.fuel_tanks FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- Internal tank transactions
CREATE TABLE IF NOT EXISTS public.fuel_tank_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tank_id uuid REFERENCES public.fuel_tanks(id) ON DELETE CASCADE NOT NULL,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('fill', 'withdraw')),
  liters numeric NOT NULL,
  driver_id uuid,
  vehicle_plate text,
  recorded_by uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fuel_tank_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org tank transactions"
  ON public.fuel_tank_transactions FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage own org tank transactions"
  ON public.fuel_tank_transactions FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- Auto-update tank level on transaction
CREATE OR REPLACE FUNCTION public.update_tank_level()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.transaction_type = 'fill' THEN
    UPDATE public.fuel_tanks SET current_level = current_level + NEW.liters, last_refill_date = now(), updated_at = now() WHERE id = NEW.tank_id;
  ELSIF NEW.transaction_type = 'withdraw' THEN
    UPDATE public.fuel_tanks SET current_level = GREATEST(0, current_level - NEW.liters), updated_at = now() WHERE id = NEW.tank_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_tank_level
  AFTER INSERT ON public.fuel_tank_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_tank_level();
