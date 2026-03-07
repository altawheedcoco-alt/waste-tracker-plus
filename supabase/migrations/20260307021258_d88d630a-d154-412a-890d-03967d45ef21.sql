
-- 1. Custom Governance Roles per Organization
CREATE TABLE public.governance_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL,
  role_name_en TEXT,
  description TEXT,
  is_system_role BOOLEAN DEFAULT false,
  permissions JSONB DEFAULT '{}',
  max_approval_amount NUMERIC DEFAULT 0,
  can_approve_shipments BOOLEAN DEFAULT false,
  can_approve_invoices BOOLEAN DEFAULT false,
  can_approve_contracts BOOLEAN DEFAULT false,
  can_approve_payments BOOLEAN DEFAULT false,
  can_manage_employees BOOLEAN DEFAULT false,
  can_view_financials BOOLEAN DEFAULT false,
  can_export_data BOOLEAN DEFAULT false,
  can_manage_settings BOOLEAN DEFAULT false,
  hierarchy_level INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  UNIQUE(organization_id, role_name)
);

-- 2. Role assignments to employees
CREATE TABLE public.governance_role_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.governance_roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES public.profiles(id),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(profile_id, role_id)
);

-- 3. Approval Workflows
CREATE TABLE public.governance_approval_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  workflow_name TEXT NOT NULL,
  workflow_name_en TEXT,
  resource_type TEXT NOT NULL, -- shipment, invoice, contract, payment, employee_action
  condition_type TEXT DEFAULT 'always', -- always, amount_above, custom
  condition_value NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  enforce_segregation BOOLEAN DEFAULT true, -- فصل المهام
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

-- 4. Approval Steps (multi-level)
CREATE TABLE public.governance_approval_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES public.governance_approval_workflows(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  approver_role_id UUID REFERENCES public.governance_roles(id),
  approver_profile_id UUID REFERENCES public.profiles(id), -- specific person
  required_count INTEGER DEFAULT 1,
  auto_approve_after_hours INTEGER, -- auto-escalation
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Approval Instances (runtime)
CREATE TABLE public.governance_approval_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  workflow_id UUID NOT NULL REFERENCES public.governance_approval_workflows(id),
  resource_type TEXT NOT NULL,
  resource_id UUID NOT NULL,
  resource_title TEXT,
  requested_by UUID NOT NULL REFERENCES public.profiles(id),
  current_step INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected, escalated
  amount NUMERIC,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- 6. Approval Actions (who approved/rejected each step)
CREATE TABLE public.governance_approval_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES public.governance_approval_instances(id) ON DELETE CASCADE,
  step_id UUID REFERENCES public.governance_approval_steps(id),
  step_order INTEGER NOT NULL,
  action TEXT NOT NULL, -- approved, rejected, escalated
  acted_by UUID NOT NULL REFERENCES public.profiles(id),
  comments TEXT,
  acted_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Governance Audit Trail
CREATE TABLE public.governance_audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  user_name TEXT,
  action_type TEXT NOT NULL, -- create, update, delete, approve, reject, login, export, permission_change
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  resource_title TEXT,
  old_value JSONB,
  new_value JSONB,
  ip_address TEXT,
  user_agent TEXT,
  severity TEXT DEFAULT 'info', -- info, warning, critical
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Governance Alerts
CREATE TABLE public.governance_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL, -- unauthorized_access, policy_violation, segregation_breach, approval_timeout
  severity TEXT DEFAULT 'warning', -- info, warning, critical
  title TEXT NOT NULL,
  description TEXT,
  resource_type TEXT,
  resource_id TEXT,
  triggered_by UUID REFERENCES public.profiles(id),
  is_resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES public.profiles(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.governance_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governance_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governance_approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governance_approval_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governance_approval_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governance_approval_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governance_audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governance_alerts ENABLE ROW LEVEL SECURITY;

-- Security definer function for org membership check
CREATE OR REPLACE FUNCTION public.is_org_member(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND organization_id = _org_id
  )
$$;

-- Security definer for admin/company_admin check
CREATE OR REPLACE FUNCTION public.is_org_admin(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.user_id
    WHERE p.user_id = _user_id 
    AND p.organization_id = _org_id
    AND ur.role IN ('admin', 'company_admin')
  )
$$;

-- RLS Policies: org members can read, admins can write
CREATE POLICY "org_members_read_roles" ON public.governance_roles FOR SELECT USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "org_admins_manage_roles" ON public.governance_roles FOR ALL USING (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "org_members_read_assignments" ON public.governance_role_assignments FOR SELECT USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "org_admins_manage_assignments" ON public.governance_role_assignments FOR ALL USING (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "org_members_read_workflows" ON public.governance_approval_workflows FOR SELECT USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "org_admins_manage_workflows" ON public.governance_approval_workflows FOR ALL USING (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "org_members_read_steps" ON public.governance_approval_steps FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.governance_approval_workflows w WHERE w.id = workflow_id AND public.is_org_member(auth.uid(), w.organization_id))
);
CREATE POLICY "org_admins_manage_steps" ON public.governance_approval_steps FOR ALL USING (
  EXISTS (SELECT 1 FROM public.governance_approval_workflows w WHERE w.id = workflow_id AND public.is_org_admin(auth.uid(), w.organization_id))
);

CREATE POLICY "org_members_read_instances" ON public.governance_approval_instances FOR SELECT USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "org_members_create_instances" ON public.governance_approval_instances FOR INSERT WITH CHECK (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "org_members_update_instances" ON public.governance_approval_instances FOR UPDATE USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "org_members_read_actions" ON public.governance_approval_actions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.governance_approval_instances i WHERE i.id = instance_id AND public.is_org_member(auth.uid(), i.organization_id))
);
CREATE POLICY "org_members_create_actions" ON public.governance_approval_actions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.governance_approval_instances i WHERE i.id = instance_id AND public.is_org_member(auth.uid(), i.organization_id))
);

CREATE POLICY "org_members_read_audit" ON public.governance_audit_trail FOR SELECT USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "org_members_insert_audit" ON public.governance_audit_trail FOR INSERT WITH CHECK (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "org_members_read_alerts" ON public.governance_alerts FOR SELECT USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "org_admins_manage_alerts" ON public.governance_alerts FOR ALL USING (public.is_org_admin(auth.uid(), organization_id));

-- Admin override: system admins can access all
CREATE POLICY "admin_full_access_roles" ON public.governance_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_full_access_assignments" ON public.governance_role_assignments FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_full_access_workflows" ON public.governance_approval_workflows FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_full_access_steps" ON public.governance_approval_steps FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_full_access_instances" ON public.governance_approval_instances FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_full_access_actions" ON public.governance_approval_actions FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_full_access_audit" ON public.governance_audit_trail FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_full_access_alerts" ON public.governance_alerts FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Indexes for performance
CREATE INDEX idx_governance_roles_org ON public.governance_roles(organization_id);
CREATE INDEX idx_governance_assignments_org ON public.governance_role_assignments(organization_id);
CREATE INDEX idx_governance_assignments_profile ON public.governance_role_assignments(profile_id);
CREATE INDEX idx_governance_workflows_org ON public.governance_approval_workflows(organization_id);
CREATE INDEX idx_governance_instances_org ON public.governance_approval_instances(organization_id);
CREATE INDEX idx_governance_instances_status ON public.governance_approval_instances(status);
CREATE INDEX idx_governance_audit_org ON public.governance_audit_trail(organization_id);
CREATE INDEX idx_governance_audit_created ON public.governance_audit_trail(created_at DESC);
CREATE INDEX idx_governance_alerts_org ON public.governance_alerts(organization_id);
CREATE INDEX idx_governance_alerts_resolved ON public.governance_alerts(is_resolved);
