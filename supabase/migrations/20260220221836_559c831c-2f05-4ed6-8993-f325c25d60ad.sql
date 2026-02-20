
-- Enable trigram extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Table to store all user inputs for universal autocomplete
CREATE TABLE IF NOT EXISTS public.smart_inputs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  field_context TEXT NOT NULL,
  input_value TEXT NOT NULL,
  usage_count INTEGER NOT NULL DEFAULT 1,
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, field_context, input_value)
);

-- Enable RLS
ALTER TABLE public.smart_inputs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can read org smart inputs"
ON public.smart_inputs FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can insert smart inputs"
ON public.smart_inputs FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update org smart inputs"
ON public.smart_inputs FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_smart_inputs_org_context ON public.smart_inputs(organization_id, field_context);
CREATE INDEX idx_smart_inputs_trgm ON public.smart_inputs USING gin(input_value gin_trgm_ops);

-- Upsert function
CREATE OR REPLACE FUNCTION public.upsert_smart_input(
  p_organization_id UUID,
  p_created_by UUID,
  p_field_context TEXT,
  p_input_value TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.smart_inputs (organization_id, created_by, field_context, input_value)
  VALUES (p_organization_id, p_created_by, p_field_context, p_input_value)
  ON CONFLICT (organization_id, field_context, input_value)
  DO UPDATE SET
    usage_count = smart_inputs.usage_count + 1,
    last_used_at = now();
END;
$$;
