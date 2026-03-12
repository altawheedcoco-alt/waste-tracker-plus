-- Create table to persist the 175 automation settings per organization
CREATE TABLE IF NOT EXISTS public.organization_automation_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_org_automation_settings UNIQUE (organization_id)
);

ALTER TABLE public.organization_automation_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read automation settings"
ON public.organization_automation_settings
FOR SELECT TO authenticated
USING (public.can_access_organization_auto_actions(organization_id));

CREATE POLICY "Org members can upsert automation settings"
ON public.organization_automation_settings
FOR INSERT TO authenticated
WITH CHECK (public.can_access_organization_auto_actions(organization_id));

CREATE POLICY "Org members can update automation settings"
ON public.organization_automation_settings
FOR UPDATE TO authenticated
USING (public.can_access_organization_auto_actions(organization_id))
WITH CHECK (public.can_access_organization_auto_actions(organization_id));

CREATE POLICY "System admins can manage automation settings"
ON public.organization_automation_settings
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));