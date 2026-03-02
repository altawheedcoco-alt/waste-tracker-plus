
-- ═══════════════ 1. مسيّر الرواتب (Payroll Engine) ═══════════════
CREATE TABLE public.hr_payroll_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  period_month INTEGER NOT NULL,
  period_year INTEGER NOT NULL,
  run_date TIMESTAMPTZ DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'draft',
  total_gross NUMERIC DEFAULT 0,
  total_deductions NUMERIC DEFAULT 0,
  total_net NUMERIC DEFAULT 0,
  total_employees INTEGER DEFAULT 0,
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.hr_payroll_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_run_id UUID NOT NULL REFERENCES public.hr_payroll_runs(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL,
  employee_name TEXT NOT NULL,
  basic_salary NUMERIC DEFAULT 0,
  housing_allowance NUMERIC DEFAULT 0,
  transport_allowance NUMERIC DEFAULT 0,
  other_allowances NUMERIC DEFAULT 0,
  overtime_hours NUMERIC DEFAULT 0,
  overtime_amount NUMERIC DEFAULT 0,
  gross_salary NUMERIC DEFAULT 0,
  social_insurance NUMERIC DEFAULT 0,
  tax_deduction NUMERIC DEFAULT 0,
  absence_deduction NUMERIC DEFAULT 0,
  loan_deduction NUMERIC DEFAULT 0,
  other_deductions NUMERIC DEFAULT 0,
  total_deductions NUMERIC DEFAULT 0,
  net_salary NUMERIC DEFAULT 0,
  payment_method TEXT DEFAULT 'bank_transfer',
  payment_status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════ 2. تقييم الأداء (Performance Reviews) ═══════════════
CREATE TABLE public.hr_performance_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  cycle_name TEXT NOT NULL,
  cycle_type TEXT DEFAULT 'annual',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'active',
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.hr_performance_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES public.hr_performance_cycles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL,
  employee_name TEXT NOT NULL,
  reviewer_id UUID REFERENCES public.profiles(id),
  reviewer_name TEXT,
  overall_score NUMERIC,
  goals_score NUMERIC,
  competency_score NUMERIC,
  attendance_score NUMERIC,
  teamwork_score NUMERIC,
  initiative_score NUMERIC,
  strengths TEXT,
  improvements TEXT,
  employee_comments TEXT,
  reviewer_comments TEXT,
  status TEXT DEFAULT 'pending',
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════ 3. إدارة الورديات (Shift Management) ═══════════════
CREATE TABLE public.hr_shift_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  pattern_name TEXT NOT NULL,
  pattern_name_ar TEXT NOT NULL,
  shift_type TEXT DEFAULT 'fixed',
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_duration_minutes INTEGER DEFAULT 60,
  working_days INTEGER[] DEFAULT '{0,1,2,3,4}',
  color TEXT DEFAULT '#3B82F6',
  is_active BOOLEAN DEFAULT true,
  is_overnight BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.hr_shift_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL,
  employee_name TEXT NOT NULL,
  shift_pattern_id UUID NOT NULL REFERENCES public.hr_shift_patterns(id) ON DELETE CASCADE,
  assignment_date DATE NOT NULL,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled',
  swap_requested_with UUID,
  swap_status TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════ 4. نهاية الخدمة (End of Service) ═══════════════
CREATE TABLE public.hr_end_of_service (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL,
  employee_name TEXT NOT NULL,
  hire_date DATE NOT NULL,
  termination_date DATE NOT NULL,
  termination_reason TEXT NOT NULL,
  last_salary NUMERIC DEFAULT 0,
  service_years NUMERIC DEFAULT 0,
  service_months NUMERIC DEFAULT 0,
  eos_amount NUMERIC DEFAULT 0,
  remaining_leave_days NUMERIC DEFAULT 0,
  leave_compensation NUMERIC DEFAULT 0,
  other_entitlements NUMERIC DEFAULT 0,
  total_deductions NUMERIC DEFAULT 0,
  net_settlement NUMERIC DEFAULT 0,
  clearance_status TEXT DEFAULT 'pending',
  it_clearance BOOLEAN DEFAULT false,
  finance_clearance BOOLEAN DEFAULT false,
  hr_clearance BOOLEAN DEFAULT false,
  asset_clearance BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  payment_status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════ 5. الخدمة الذاتية (Employee Self-Service Requests) ═══════════════
CREATE TABLE public.hr_employee_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL,
  employee_name TEXT NOT NULL,
  request_type TEXT NOT NULL,
  request_title TEXT NOT NULL,
  request_details TEXT,
  priority TEXT DEFAULT 'normal',
  status TEXT DEFAULT 'pending',
  attachment_url TEXT,
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  reviewer_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════ 6. الهيكل التنظيمي (Org Chart Nodes) ═══════════════
CREATE TABLE public.hr_org_chart_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  parent_node_id UUID REFERENCES public.hr_org_chart_nodes(id),
  node_type TEXT DEFAULT 'department',
  title TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  head_employee_id UUID,
  head_name TEXT,
  employee_count INTEGER DEFAULT 0,
  color TEXT DEFAULT '#3B82F6',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════ RLS Policies ═══════════════
ALTER TABLE public.hr_payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_payroll_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_performance_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_shift_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_shift_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_end_of_service ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_employee_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_org_chart_nodes ENABLE ROW LEVEL SECURITY;

-- Payroll runs
CREATE POLICY "Users can manage payroll for their org" ON public.hr_payroll_runs
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- Payroll items
CREATE POLICY "Users can manage payroll items for their org" ON public.hr_payroll_items
  FOR ALL USING (payroll_run_id IN (SELECT id FROM public.hr_payroll_runs WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())));

-- Performance cycles
CREATE POLICY "Users can manage perf cycles for their org" ON public.hr_performance_cycles
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- Performance reviews
CREATE POLICY "Users can manage perf reviews for their org" ON public.hr_performance_reviews
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- Shift patterns
CREATE POLICY "Users can manage shifts for their org" ON public.hr_shift_patterns
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- Shift assignments
CREATE POLICY "Users can manage shift assignments for their org" ON public.hr_shift_assignments
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- End of service
CREATE POLICY "Users can manage EOS for their org" ON public.hr_end_of_service
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- Employee requests
CREATE POLICY "Users can manage requests for their org" ON public.hr_employee_requests
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- Org chart
CREATE POLICY "Users can manage org chart for their org" ON public.hr_org_chart_nodes
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
