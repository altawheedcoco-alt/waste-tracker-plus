
-- Partner Restrictions: comprehensive restriction system
CREATE TABLE public.partner_restrictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  restricted_org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  restriction_type TEXT NOT NULL, -- 'block_shipments', 'block_invoices', 'block_messaging', 'block_documents', 'block_visibility', 'suspend_partnership', 'blacklist', 'block_all'
  reason TEXT,
  notes TEXT,
  created_by UUID NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, restricted_org_id, restriction_type)
);

ALTER TABLE public.partner_restrictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can manage own restrictions"
ON public.partner_restrictions FOR ALL
USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- Allow restricted org to see they are restricted (read only)
CREATE POLICY "Restricted org can view restrictions against them"
ON public.partner_restrictions FOR SELECT
USING (restricted_org_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- Security definer function to check restrictions
CREATE OR REPLACE FUNCTION public.has_partner_restriction(
  _org_id UUID,
  _restricted_org_id UUID,
  _restriction_type TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.partner_restrictions
    WHERE organization_id = _org_id
      AND restricted_org_id = _restricted_org_id
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
      AND (
        _restriction_type IS NULL
        OR restriction_type = _restriction_type
        OR restriction_type = 'block_all'
      )
  )
$$;

-- Trigger for updated_at
CREATE TRIGGER update_partner_restrictions_updated_at
BEFORE UPDATE ON public.partner_restrictions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
