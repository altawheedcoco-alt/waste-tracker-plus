
-- Scoped Access Links: allows any org to create external/internal links with precise access scope
CREATE TABLE public.scoped_access_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  
  -- Link identity
  link_code TEXT NOT NULL UNIQUE DEFAULT substr(replace(gen_random_uuid()::text, '-', ''), 1, 10),
  link_name TEXT NOT NULL,
  description TEXT,
  
  -- Who is this link for
  assigned_to_name TEXT NOT NULL,
  assigned_to_phone TEXT,
  assigned_to_email TEXT,
  
  -- Access PIN (optional extra security)
  access_pin TEXT,
  
  -- Scope: which organizations are visible
  scoped_organization_ids UUID[] NOT NULL DEFAULT '{}',
  
  -- Permissions flags
  can_view_shipments BOOLEAN NOT NULL DEFAULT false,
  can_create_shipments BOOLEAN NOT NULL DEFAULT false,
  can_view_deposits BOOLEAN NOT NULL DEFAULT false,
  can_create_deposits BOOLEAN NOT NULL DEFAULT false,
  can_view_ledger BOOLEAN NOT NULL DEFAULT false,
  can_view_invoices BOOLEAN NOT NULL DEFAULT false,
  
  -- Data filters
  waste_types_filter TEXT[] DEFAULT NULL, -- null = all types
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  max_uses INTEGER,
  current_uses INTEGER NOT NULL DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for quick lookups
CREATE INDEX idx_scoped_links_code ON public.scoped_access_links(link_code);
CREATE INDEX idx_scoped_links_org ON public.scoped_access_links(organization_id);

-- Enable RLS
ALTER TABLE public.scoped_access_links ENABLE ROW LEVEL SECURITY;

-- Org members can manage their links
CREATE POLICY "Org members can manage scoped links"
  ON public.scoped_access_links
  FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid()
    )
  );

-- Service role needs access for edge functions
CREATE POLICY "Service role full access to scoped links"
  ON public.scoped_access_links
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Session table for scoped links
CREATE TABLE public.scoped_link_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES public.scoped_access_links(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  ip_address TEXT,
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.scoped_link_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role access scoped sessions"
  ON public.scoped_link_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_scoped_links_updated_at
  BEFORE UPDATE ON public.scoped_access_links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
