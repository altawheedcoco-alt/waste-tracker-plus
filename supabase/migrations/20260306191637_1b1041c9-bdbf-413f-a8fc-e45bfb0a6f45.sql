
-- Transporter declarations table for WMRA periodic waste declarations
CREATE TABLE public.transporter_declarations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  declaration_number TEXT NOT NULL,
  declaration_type TEXT NOT NULL DEFAULT 'auto' CHECK (declaration_type IN ('manual', 'auto')),
  waste_category TEXT NOT NULL CHECK (waste_category IN ('hazardous', 'non_hazardous', 'medical')),
  period_from DATE NOT NULL,
  period_to DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'accepted', 'rejected')),
  submitted_to TEXT DEFAULT 'wmra',
  total_shipments INTEGER DEFAULT 0,
  total_quantity NUMERIC DEFAULT 0,
  declaration_data JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  submitted_at TIMESTAMPTZ,
  submitted_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

-- Enable RLS
ALTER TABLE public.transporter_declarations ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own org declarations"
  ON public.transporter_declarations FOR SELECT TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own org declarations"
  ON public.transporter_declarations FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update own org declarations"
  ON public.transporter_declarations FOR UPDATE TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  ));

-- Generate declaration number function
CREATE OR REPLACE FUNCTION public.generate_declaration_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.declaration_number := 'DEC-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || SUBSTRING(NEW.id::text, 1, 6);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_generate_declaration_number
  BEFORE INSERT ON public.transporter_declarations
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_declaration_number();

-- Index for fast lookups
CREATE INDEX idx_transporter_declarations_org ON public.transporter_declarations(organization_id);
CREATE INDEX idx_transporter_declarations_category ON public.transporter_declarations(waste_category);
