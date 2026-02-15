
-- Auto-signature settings per organization per document type
CREATE TABLE public.auto_signature_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- shipment, contract, invoice, certificate, award_letter, declaration
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  auto_sign BOOLEAN NOT NULL DEFAULT false,
  auto_stamp BOOLEAN NOT NULL DEFAULT false,
  default_signatory_id UUID REFERENCES public.authorized_signatories(id) ON DELETE SET NULL,
  default_signature_id UUID REFERENCES public.organization_signatures(id) ON DELETE SET NULL,
  default_stamp_id UUID REFERENCES public.organization_stamps(id) ON DELETE SET NULL,
  trigger_on TEXT NOT NULL DEFAULT 'creation', -- creation, approval, status_change
  trigger_status TEXT, -- specific status that triggers auto-sign (e.g. 'delivered', 'approved')
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, document_type)
);

ALTER TABLE public.auto_signature_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org auto-sign settings"
ON public.auto_signature_settings FOR SELECT
TO authenticated
USING (organization_id IN (
  SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid()
));

CREATE POLICY "Users can manage own org auto-sign settings"
ON public.auto_signature_settings FOR ALL
TO authenticated
USING (organization_id IN (
  SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid()
))
WITH CHECK (organization_id IN (
  SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid()
));

-- Trigger for updated_at
CREATE TRIGGER update_auto_signature_settings_updated_at
BEFORE UPDATE ON public.auto_signature_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
