
CREATE TABLE public.custom_waste_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'non-hazardous' CHECK (category IN ('hazardous', 'non-hazardous')),
  parent_category TEXT NOT NULL DEFAULT 'other',
  hazard_level TEXT CHECK (hazard_level IN ('low', 'medium', 'high', 'critical')),
  recyclable BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, code)
);

ALTER TABLE public.custom_waste_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org custom waste types"
ON public.custom_waste_types FOR SELECT
USING (
  organization_id IN (
    SELECT uo.organization_id FROM user_organizations uo
    JOIN profiles p ON p.id = uo.user_id
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can add org custom waste types"
ON public.custom_waste_types FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT uo.organization_id FROM user_organizations uo
    JOIN profiles p ON p.id = uo.user_id
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete org custom waste types"
ON public.custom_waste_types FOR DELETE
USING (
  organization_id IN (
    SELECT uo.organization_id FROM user_organizations uo
    JOIN profiles p ON p.id = uo.user_id
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Admin full access custom waste types"
ON public.custom_waste_types FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_organizations uo
    JOIN profiles p ON p.id = uo.user_id
    WHERE p.user_id = auth.uid() AND uo.role_in_organization = 'admin'
  )
);

CREATE INDEX idx_custom_waste_types_org ON public.custom_waste_types(organization_id);

CREATE TRIGGER update_custom_waste_types_updated_at
BEFORE UPDATE ON public.custom_waste_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
