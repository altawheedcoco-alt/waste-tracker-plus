
-- 1. Add member_type to distinguish board members from employees
ALTER TABLE public.organization_members 
  ADD COLUMN IF NOT EXISTS member_type text NOT NULL DEFAULT 'board_member';

-- Add comment
COMMENT ON COLUMN public.organization_members.member_type IS 'board_member = عضو مجلس إدارة, employee = موظف تشغيلي';

-- 2. Task Templates (قوالب المهام الجاهزة)
CREATE TABLE public.employee_task_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  name_ar text NOT NULL,
  description text,
  description_ar text,
  task_permissions jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.employee_task_templates IS 'قوالب مهام جاهزة للتعيين السريع للموظفين';
COMMENT ON COLUMN public.employee_task_templates.task_permissions IS 'Array of {permission, scoped_partner_ids[]}';

-- 3. Employee Task Assignments (مهام الموظف المقيدة بجهات)
CREATE TABLE public.employee_task_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.organization_members(id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.employee_task_templates(id) ON DELETE SET NULL,
  permission_key text NOT NULL,
  scoped_partner_ids uuid[] DEFAULT '{}',
  scoped_department_ids uuid[] DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  assigned_by uuid REFERENCES auth.users(id),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.employee_task_assignments IS 'مهام الموظف المقيدة بجهات/أقسام محددة';
COMMENT ON COLUMN public.employee_task_assignments.permission_key IS 'نوع الصلاحية مثل view_shipments, create_deposits';
COMMENT ON COLUMN public.employee_task_assignments.scoped_partner_ids IS 'الجهات المرتبطة المحددة - فارغ يعني كل الجهات';

-- Indexes
CREATE INDEX idx_task_assignments_member ON public.employee_task_assignments(member_id) WHERE is_active = true;
CREATE INDEX idx_task_assignments_org ON public.employee_task_assignments(organization_id) WHERE is_active = true;
CREATE INDEX idx_task_templates_org ON public.employee_task_templates(organization_id) WHERE is_active = true;
CREATE INDEX idx_org_members_type ON public.organization_members(member_type, organization_id) WHERE status = 'active';

-- 4. RLS
ALTER TABLE public.employee_task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_task_assignments ENABLE ROW LEVEL SECURITY;

-- Templates: org members can read, board members with manage_members can write
CREATE POLICY "Members can view task templates" ON public.employee_task_templates
  FOR SELECT TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.organization_members 
    WHERE user_id = auth.uid() AND status = 'active'
  ));

CREATE POLICY "Board members can manage task templates" ON public.employee_task_templates
  FOR ALL TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.organization_members 
    WHERE user_id = auth.uid() AND status = 'active' 
    AND member_type = 'board_member'
    AND (member_role IN ('entity_head', 'assistant', 'deputy_assistant') OR can_manage_members = true)
  ));

-- Assignments: employees can read their own, board members can manage
CREATE POLICY "Employees can view own assignments" ON public.employee_task_assignments
  FOR SELECT TO authenticated
  USING (member_id IN (
    SELECT id FROM public.organization_members 
    WHERE user_id = auth.uid() AND status = 'active'
  ));

CREATE POLICY "Board members can manage assignments" ON public.employee_task_assignments
  FOR ALL TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.organization_members 
    WHERE user_id = auth.uid() AND status = 'active' 
    AND member_type = 'board_member'
    AND (member_role IN ('entity_head', 'assistant', 'deputy_assistant') OR can_manage_members = true)
  ));
