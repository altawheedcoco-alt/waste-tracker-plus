
-- =============================================
-- 1) نظام ردود الفعل (Reactions) - إعجاب وتفاعلات
-- =============================================
CREATE TABLE public.entity_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, -- 'shipment', 'auction', 'marketplace_listing', 'organization_profile'
  entity_id UUID NOT NULL,
  reaction_type TEXT NOT NULL DEFAULT 'like', -- 'like', 'excellent', 'warning', 'support', 'celebrate'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, entity_type, entity_id)
);

ALTER TABLE public.entity_reactions ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_entity_reactions_entity ON public.entity_reactions(entity_type, entity_id);
CREATE INDEX idx_entity_reactions_user ON public.entity_reactions(user_id);

CREATE POLICY "Users can view reactions" ON public.entity_reactions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can add reactions" ON public.entity_reactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own reactions" ON public.entity_reactions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =============================================
-- 2) نظام التعليقات والمناقشات (Comments)
-- =============================================
CREATE TABLE public.entity_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, -- 'shipment', 'auction', 'marketplace_listing', 'organization_profile'
  entity_id UUID NOT NULL,
  parent_comment_id UUID REFERENCES public.entity_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_edited BOOLEAN DEFAULT false,
  is_hidden BOOLEAN DEFAULT false,
  hidden_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.entity_comments ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_entity_comments_entity ON public.entity_comments(entity_type, entity_id);
CREATE INDEX idx_entity_comments_parent ON public.entity_comments(parent_comment_id);

CREATE POLICY "Users can view non-hidden comments" ON public.entity_comments
  FOR SELECT TO authenticated USING (is_hidden = false OR auth.uid() = user_id);

CREATE POLICY "Users can add comments" ON public.entity_comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can edit own comments" ON public.entity_comments
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON public.entity_comments
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =============================================
-- 3) نظام الإبلاغ (Reports)
-- =============================================
CREATE TABLE public.entity_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reporter_organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, -- 'shipment', 'comment', 'organization', 'marketplace_listing', 'auction'
  entity_id UUID NOT NULL,
  report_category TEXT NOT NULL, -- 'fraud', 'spam', 'inappropriate', 'safety_violation', 'weight_manipulation', 'license_violation', 'misleading_info'
  description TEXT,
  evidence_urls TEXT[],
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'under_review', 'resolved', 'dismissed'
  admin_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.entity_reports ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_entity_reports_status ON public.entity_reports(status);
CREATE INDEX idx_entity_reports_entity ON public.entity_reports(entity_type, entity_id);

CREATE POLICY "Users can view own reports" ON public.entity_reports
  FOR SELECT TO authenticated USING (auth.uid() = reporter_user_id);

CREATE POLICY "Users can submit reports" ON public.entity_reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_user_id);

-- Admin can view all reports via has_role function
CREATE POLICY "Admins can view all reports" ON public.entity_reports
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update reports" ON public.entity_reports
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 4) نظام الحظر بين الجهات (Blocks)
-- =============================================
CREATE TABLE public.organization_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  blocked_organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  blocked_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(blocker_organization_id, blocked_organization_id)
);

ALTER TABLE public.organization_blocks ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_org_blocks_blocker ON public.organization_blocks(blocker_organization_id);
CREATE INDEX idx_org_blocks_blocked ON public.organization_blocks(blocked_organization_id);

CREATE POLICY "Org members can view blocks" ON public.organization_blocks
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
      AND p.organization_id = blocker_organization_id
    )
  );

CREATE POLICY "Org members can create blocks" ON public.organization_blocks
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = blocked_by AND
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
      AND p.organization_id = blocker_organization_id
    )
  );

CREATE POLICY "Org members can remove blocks" ON public.organization_blocks
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
      AND p.organization_id = blocker_organization_id
    )
  );

-- =============================================
-- 5) نظام العقوبات التدريجية (Sanctions)
-- =============================================
CREATE TABLE public.organization_sanctions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  sanction_level TEXT NOT NULL DEFAULT 'warning', -- 'warning', 'restriction', 'suspension', 'ban'
  reason TEXT NOT NULL,
  report_id UUID REFERENCES public.entity_reports(id),
  issued_by UUID REFERENCES auth.users(id),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ, -- NULL = permanent
  is_active BOOLEAN DEFAULT true,
  restrictions JSONB, -- e.g. {"can_create_shipments": false, "can_bid": false}
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.organization_sanctions ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_org_sanctions_org ON public.organization_sanctions(organization_id);
CREATE INDEX idx_org_sanctions_active ON public.organization_sanctions(is_active, sanction_level);

CREATE POLICY "Org members can view own sanctions" ON public.organization_sanctions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
      AND p.organization_id = organization_sanctions.organization_id
    )
  );

CREATE POLICY "Admins can manage sanctions" ON public.organization_sanctions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 6) إعدادات خصوصية التفاعلات لكل جهة
-- =============================================
CREATE TABLE public.organization_interaction_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE UNIQUE,
  allow_reactions BOOLEAN DEFAULT true,
  allow_comments BOOLEAN DEFAULT true,
  allow_reviews BOOLEAN DEFAULT true,
  comments_visibility TEXT DEFAULT 'partners', -- 'public', 'partners', 'private'
  profile_visibility TEXT DEFAULT 'public', -- 'public', 'partners', 'private'
  show_reaction_count BOOLEAN DEFAULT true,
  auto_hide_flagged_comments BOOLEAN DEFAULT true,
  require_comment_approval BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.organization_interaction_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view interaction settings" ON public.organization_interaction_settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Org members can update own settings" ON public.organization_interaction_settings
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
      AND p.organization_id = organization_interaction_settings.organization_id
    )
  );

CREATE POLICY "Org members can insert own settings" ON public.organization_interaction_settings
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
      AND p.organization_id = organization_interaction_settings.organization_id
    )
  );

-- =============================================
-- 7) شارات التحقق والموثوقية (Verification Badges)
-- =============================================
CREATE TABLE public.organization_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  verification_type TEXT NOT NULL, -- 'identity_verified', 'license_verified', 'iso_certified', 'top_rated', 'trusted_partner'
  verified_by UUID REFERENCES auth.users(id),
  verification_data JSONB,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, verification_type)
);

ALTER TABLE public.organization_verifications ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_org_verifications_org ON public.organization_verifications(organization_id);

CREATE POLICY "Anyone can view verifications" ON public.organization_verifications
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage verifications" ON public.organization_verifications
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_entity_comments_updated_at
  BEFORE UPDATE ON public.entity_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_entity_reports_updated_at
  BEFORE UPDATE ON public.entity_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_org_sanctions_updated_at
  BEFORE UPDATE ON public.organization_sanctions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_org_interaction_settings_updated_at
  BEFORE UPDATE ON public.organization_interaction_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_org_verifications_updated_at
  BEFORE UPDATE ON public.organization_verifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
