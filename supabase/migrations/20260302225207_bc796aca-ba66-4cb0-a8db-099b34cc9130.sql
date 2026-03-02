
-- Multi-signature document templates
CREATE TABLE public.multi_sign_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  template_type TEXT NOT NULL DEFAULT 'shipment_release',
  category TEXT NOT NULL DEFAULT 'operational',
  approval_mode TEXT NOT NULL DEFAULT 'all' CHECK (approval_mode IN ('all', 'joint', 'individual', 'sequential')),
  required_signatures_count INTEGER DEFAULT 1,
  auto_attach_to_shipments BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  content_template TEXT,
  notes TEXT,
  tags TEXT[],
  created_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Signatories required for each template
CREATE TABLE public.multi_sign_signatories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.multi_sign_templates(id) ON DELETE CASCADE,
  signatory_role TEXT NOT NULL,
  signatory_title TEXT,
  organization_id UUID REFERENCES public.organizations(id),
  profile_id UUID REFERENCES public.profiles(id),
  sign_order INTEGER DEFAULT 1,
  is_mandatory BOOLEAN DEFAULT true,
  can_delegate BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Link templates to shipments
CREATE TABLE public.multi_sign_shipments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.multi_sign_templates(id) ON DELETE CASCADE,
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected', 'expired')),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(template_id, shipment_id)
);

-- Individual signature records
CREATE TABLE public.multi_sign_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_link_id UUID NOT NULL REFERENCES public.multi_sign_shipments(id) ON DELETE CASCADE,
  signatory_config_id UUID REFERENCES public.multi_sign_signatories(id),
  signer_profile_id UUID REFERENCES public.profiles(id),
  signer_organization_id UUID REFERENCES public.organizations(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'rejected', 'delegated')),
  signature_data TEXT,
  signature_image_url TEXT,
  rejection_reason TEXT,
  delegated_to UUID REFERENCES public.profiles(id),
  signed_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT,
  integrity_hash TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Mentions / comments on templates
CREATE TABLE public.multi_sign_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.multi_sign_templates(id) ON DELETE CASCADE,
  shipment_link_id UUID REFERENCES public.multi_sign_shipments(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id),
  content TEXT NOT NULL,
  mentions JSONB DEFAULT '[]',
  is_internal BOOLEAN DEFAULT false,
  parent_id UUID REFERENCES public.multi_sign_comments(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.multi_sign_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multi_sign_signatories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multi_sign_shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multi_sign_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multi_sign_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members manage templates" ON public.multi_sign_templates
  FOR ALL TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id))
  WITH CHECK (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members manage signatories" ON public.multi_sign_signatories
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.multi_sign_templates t WHERE t.id = template_id AND public.is_org_member(auth.uid(), t.organization_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.multi_sign_templates t WHERE t.id = template_id AND public.is_org_member(auth.uid(), t.organization_id)));

CREATE POLICY "Org members manage shipment links" ON public.multi_sign_shipments
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.multi_sign_templates t WHERE t.id = template_id AND public.is_org_member(auth.uid(), t.organization_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.multi_sign_templates t WHERE t.id = template_id AND public.is_org_member(auth.uid(), t.organization_id)));

CREATE POLICY "Org members manage sign records" ON public.multi_sign_records
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.multi_sign_shipments sl
    JOIN public.multi_sign_templates t ON t.id = sl.template_id
    WHERE sl.id = shipment_link_id AND public.is_org_member(auth.uid(), t.organization_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.multi_sign_shipments sl
    JOIN public.multi_sign_templates t ON t.id = sl.template_id
    WHERE sl.id = shipment_link_id AND public.is_org_member(auth.uid(), t.organization_id)
  ));

CREATE POLICY "Org members manage comments" ON public.multi_sign_comments
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.multi_sign_templates t WHERE t.id = template_id AND public.is_org_member(auth.uid(), t.organization_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.multi_sign_templates t WHERE t.id = template_id AND public.is_org_member(auth.uid(), t.organization_id)));

-- Trigger for updated_at on templates
CREATE TRIGGER update_multi_sign_templates_updated_at
  BEFORE UPDATE ON public.multi_sign_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
