
-- Auto Actions Settings per Organization
CREATE TABLE public.organization_auto_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Master toggle
  all_actions_enabled BOOLEAN NOT NULL DEFAULT true,
  
  -- Document auto-generation
  auto_delivery_certificate BOOLEAN NOT NULL DEFAULT true,
  auto_receipt_generation BOOLEAN NOT NULL DEFAULT true,
  auto_manifest_generation BOOLEAN NOT NULL DEFAULT true,
  auto_invoice_generation BOOLEAN NOT NULL DEFAULT true,
  auto_tracking_form BOOLEAN NOT NULL DEFAULT true,
  
  -- Notifications
  auto_shipment_notifications BOOLEAN NOT NULL DEFAULT true,
  auto_status_change_alerts BOOLEAN NOT NULL DEFAULT true,
  auto_partner_notifications BOOLEAN NOT NULL DEFAULT true,
  auto_whatsapp_notifications BOOLEAN NOT NULL DEFAULT true,
  auto_email_notifications BOOLEAN NOT NULL DEFAULT true,
  
  -- Operations
  auto_shipment_status_update BOOLEAN NOT NULL DEFAULT true,
  auto_weight_reconciliation BOOLEAN NOT NULL DEFAULT true,
  auto_compliance_check BOOLEAN NOT NULL DEFAULT true,
  auto_archive_documents BOOLEAN NOT NULL DEFAULT true,
  auto_signature_request BOOLEAN NOT NULL DEFAULT true,
  
  -- AI & Smart Features
  auto_waste_classification BOOLEAN NOT NULL DEFAULT true,
  auto_route_optimization BOOLEAN NOT NULL DEFAULT true,
  auto_fraud_detection BOOLEAN NOT NULL DEFAULT true,
  auto_price_calculation BOOLEAN NOT NULL DEFAULT true,
  
  -- Metadata
  last_modified_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(organization_id)
);

-- Enable RLS
ALTER TABLE public.organization_auto_actions ENABLE ROW LEVEL SECURITY;

-- Org members can read their settings
CREATE POLICY "Org members can read auto actions"
  ON public.organization_auto_actions FOR SELECT
  USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_members om WHERE om.user_id = auth.uid()
    )
  );

-- Org members can manage (owner check done in app layer)
CREATE POLICY "Org members can manage auto actions"
  ON public.organization_auto_actions FOR ALL
  USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_members om WHERE om.user_id = auth.uid()
    )
  );

-- System admins can manage all
CREATE POLICY "System admins can manage all auto actions"
  ON public.organization_auto_actions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Updated at trigger
CREATE TRIGGER update_org_auto_actions_updated_at
  BEFORE UPDATE ON public.organization_auto_actions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create settings when organization is created
CREATE OR REPLACE FUNCTION public.auto_create_org_auto_actions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.organization_auto_actions (organization_id)
  VALUES (NEW.id)
  ON CONFLICT (organization_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_create_org_auto_actions
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_org_auto_actions();

-- Seed for existing organizations
INSERT INTO public.organization_auto_actions (organization_id)
SELECT id FROM public.organizations
ON CONFLICT (organization_id) DO NOTHING;
