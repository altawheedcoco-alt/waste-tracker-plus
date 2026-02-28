
-- ═══════════════════════════════════════════════════════
-- صلاحيات السيفتي بين الجهات المرتبطة
-- ═══════════════════════════════════════════════════════

-- 1. جدول صلاحيات السيفتي بين الجهات (Safety Partner Permissions)
CREATE TABLE public.safety_partner_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  partner_organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Permissions: what can the partner see/do in our safety data
  can_view_hazards BOOLEAN DEFAULT false,
  can_report_hazards BOOLEAN DEFAULT false,
  can_view_inspections BOOLEAN DEFAULT false,
  can_request_inspection BOOLEAN DEFAULT false,
  can_view_ppe BOOLEAN DEFAULT false,
  can_view_jsa BOOLEAN DEFAULT false,
  can_view_toolbox_talks BOOLEAN DEFAULT false,
  can_attend_toolbox_talks BOOLEAN DEFAULT false,
  can_view_certificates BOOLEAN DEFAULT false,
  can_receive_certificates BOOLEAN DEFAULT false,
  can_view_incidents BOOLEAN DEFAULT false,
  can_report_incidents BOOLEAN DEFAULT false,
  can_view_emergency_plans BOOLEAN DEFAULT false,
  can_view_safety_team BOOLEAN DEFAULT false,
  
  -- For specific user-level override within partner org
  restricted_to_user_ids UUID[] DEFAULT NULL,
  
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(organization_id, partner_organization_id)
);

ALTER TABLE public.safety_partner_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members manage safety permissions" ON public.safety_partner_permissions FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    OR partner_organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 2. جدول روابط السيفتي الخارجية (Safety External Links)
CREATE TABLE public.safety_external_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  link_code TEXT NOT NULL UNIQUE DEFAULT substr(md5(random()::text), 1, 10),
  link_name TEXT NOT NULL,
  pin_code TEXT,
  
  -- What the link gives access to
  allowed_modules TEXT[] NOT NULL DEFAULT '{}',
  -- Possible: hazards, inspections, ppe, jsa, toolbox_talks, certificates, incidents, emergency_plans, safety_team
  
  -- Optional: restrict to specific partners
  partner_org_ids UUID[] DEFAULT NULL,
  
  -- Optional: restrict to specific users
  allowed_user_names JSONB DEFAULT '[]'::jsonb,
  -- Each: { name, phone, role }
  
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.safety_external_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members manage safety links" ON public.safety_external_links FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
-- Public read for link access
CREATE POLICY "Public can read active safety links" ON public.safety_external_links FOR SELECT TO anon
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- 3. سجل وصول روابط السيفتي (Safety Link Access Log)
CREATE TABLE public.safety_link_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES public.safety_external_links(id) ON DELETE CASCADE,
  accessed_by_name TEXT,
  accessed_by_phone TEXT,
  accessed_by_user_id UUID,
  ip_address TEXT,
  user_agent TEXT,
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.safety_link_access_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members view access logs" ON public.safety_link_access_log FOR SELECT TO authenticated
  USING (link_id IN (SELECT id FROM public.safety_external_links WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())));
CREATE POLICY "Anyone can log access" ON public.safety_link_access_log FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Indexes
CREATE INDEX idx_safety_partner_perms_org ON public.safety_partner_permissions(organization_id);
CREATE INDEX idx_safety_partner_perms_partner ON public.safety_partner_permissions(partner_organization_id);
CREATE INDEX idx_safety_ext_links_org ON public.safety_external_links(organization_id);
CREATE INDEX idx_safety_ext_links_code ON public.safety_external_links(link_code);

-- Update existing safety tables RLS to allow partner access
-- Hazards: partners with permission can view
CREATE POLICY "Partners can view hazards" ON public.hazard_registers FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT spp.organization_id FROM public.safety_partner_permissions spp
      WHERE spp.partner_organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
      AND spp.can_view_hazards = true AND spp.is_active = true
    )
  );

-- Partners can INSERT hazards if allowed
CREATE POLICY "Partners can report hazards" ON public.hazard_registers FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    OR organization_id IN (
      SELECT spp.organization_id FROM public.safety_partner_permissions spp
      WHERE spp.partner_organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
      AND spp.can_report_hazards = true AND spp.is_active = true
    )
  );

-- Inspections: partners with permission can view
CREATE POLICY "Partners can view inspections" ON public.safety_inspections FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT spp.organization_id FROM public.safety_partner_permissions spp
      WHERE spp.partner_organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
      AND spp.can_view_inspections = true AND spp.is_active = true
    )
  );

-- Certificates: partners who receive them can view
CREATE POLICY "Partners can view shared certificates" ON public.safety_certificates FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT spp.organization_id FROM public.safety_partner_permissions spp
      WHERE spp.partner_organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
      AND spp.can_view_certificates = true AND spp.is_active = true
    )
  );

-- Toolbox talks: partners can view if allowed
CREATE POLICY "Partners can view toolbox talks" ON public.toolbox_talks FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT spp.organization_id FROM public.safety_partner_permissions spp
      WHERE spp.partner_organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
      AND spp.can_view_toolbox_talks = true AND spp.is_active = true
    )
  );

-- JSA: partners can view if allowed
CREATE POLICY "Partners can view JSA" ON public.jsa_analyses FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT spp.organization_id FROM public.safety_partner_permissions spp
      WHERE spp.partner_organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
      AND spp.can_view_jsa = true AND spp.is_active = true
    )
  );

-- PPE: partners can view if allowed
CREATE POLICY "Partners can view PPE" ON public.ppe_assignments FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT spp.organization_id FROM public.safety_partner_permissions spp
      WHERE spp.partner_organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
      AND spp.can_view_ppe = true AND spp.is_active = true
    )
  );

-- Safety team: partners can view if allowed
CREATE POLICY "Partners can view safety team" ON public.safety_team_members FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT spp.organization_id FROM public.safety_partner_permissions spp
      WHERE spp.partner_organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
      AND spp.can_view_safety_team = true AND spp.is_active = true
    )
  );
