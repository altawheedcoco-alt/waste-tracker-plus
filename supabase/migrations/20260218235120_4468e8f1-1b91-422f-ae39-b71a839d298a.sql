
-- Drop existing policies that use TO PUBLIC
DROP POLICY IF EXISTS "Users can view their organization templates" ON public.contract_templates;
DROP POLICY IF EXISTS "Users can create templates for their organization" ON public.contract_templates;
DROP POLICY IF EXISTS "Users can update their organization templates" ON public.contract_templates;
DROP POLICY IF EXISTS "Users can delete their organization templates" ON public.contract_templates;

-- Recreate with TO authenticated
CREATE POLICY "Users can view their organization templates"
ON public.contract_templates FOR SELECT TO authenticated
USING (
  organization_id = get_user_org_id_safe(auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
  OR template_type = 'system'
);

CREATE POLICY "Users can create templates for their organization"
ON public.contract_templates FOR INSERT TO authenticated
WITH CHECK (
  organization_id = get_user_org_id_safe(auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users can update their organization templates"
ON public.contract_templates FOR UPDATE TO authenticated
USING (
  organization_id = get_user_org_id_safe(auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users can delete their organization templates"
ON public.contract_templates FOR DELETE TO authenticated
USING (
  organization_id = get_user_org_id_safe(auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);
