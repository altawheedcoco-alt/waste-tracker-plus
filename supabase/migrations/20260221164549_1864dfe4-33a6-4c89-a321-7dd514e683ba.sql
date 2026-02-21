
-- =============================================
-- HRMS Phase 1, Step 1: Employee Enhancement + Contracts + Leave Balances
-- =============================================

-- 1. Add FK columns to erp_employees (department_id, position_id linking to org tables)
ALTER TABLE public.erp_employees 
  ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.organization_departments(id),
  ADD COLUMN IF NOT EXISTS position_id UUID REFERENCES public.organization_positions(id),
  ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'male',
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS marital_status TEXT DEFAULT 'single',
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_relation TEXT,
  ADD COLUMN IF NOT EXISTS social_insurance_number TEXT,
  ADD COLUMN IF NOT EXISTS tax_id TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS member_id UUID REFERENCES public.organization_members(id);

-- 2. Employment Contracts table
CREATE TABLE IF NOT EXISTS public.hr_employment_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  employee_id UUID NOT NULL REFERENCES public.erp_employees(id) ON DELETE CASCADE,
  contract_number TEXT,
  contract_type TEXT NOT NULL DEFAULT 'full_time', -- full_time, part_time, temporary, probation, freelance
  status TEXT NOT NULL DEFAULT 'active', -- active, expired, terminated, suspended
  start_date DATE NOT NULL,
  end_date DATE,
  probation_end_date DATE,
  base_salary NUMERIC(12,2) NOT NULL DEFAULT 0,
  housing_allowance NUMERIC(12,2) DEFAULT 0,
  transport_allowance NUMERIC(12,2) DEFAULT 0,
  food_allowance NUMERIC(12,2) DEFAULT 0,
  other_allowances NUMERIC(12,2) DEFAULT 0,
  total_salary NUMERIC(12,2) GENERATED ALWAYS AS (
    base_salary + COALESCE(housing_allowance, 0) + COALESCE(transport_allowance, 0) + COALESCE(food_allowance, 0) + COALESCE(other_allowances, 0)
  ) STORED,
  currency TEXT DEFAULT 'EGP',
  working_hours_per_day NUMERIC(4,2) DEFAULT 8,
  working_days_per_week INTEGER DEFAULT 5,
  annual_leave_days INTEGER DEFAULT 21,
  sick_leave_days INTEGER DEFAULT 30,
  notice_period_days INTEGER DEFAULT 30,
  terms TEXT,
  notes TEXT,
  attachment_url TEXT,
  signed_at TIMESTAMPTZ,
  signed_by_employee BOOLEAN DEFAULT FALSE,
  signed_by_employer BOOLEAN DEFAULT FALSE,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Leave Types configuration per organization
CREATE TABLE IF NOT EXISTS public.hr_leave_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  name_ar TEXT NOT NULL,
  name TEXT,
  code TEXT NOT NULL, -- annual, sick, unpaid, maternity, paternity, emergency, hajj, etc.
  is_paid BOOLEAN DEFAULT TRUE,
  default_days INTEGER DEFAULT 0,
  max_carry_over INTEGER DEFAULT 0,
  requires_attachment BOOLEAN DEFAULT FALSE,
  requires_approval BOOLEAN DEFAULT TRUE,
  min_notice_days INTEGER DEFAULT 0,
  color TEXT DEFAULT '#3b82f6',
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, code)
);

-- 4. Leave Balances per employee per year
CREATE TABLE IF NOT EXISTS public.hr_leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  employee_id UUID NOT NULL REFERENCES public.erp_employees(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES public.hr_leave_types(id),
  year INTEGER NOT NULL,
  entitled_days NUMERIC(5,1) NOT NULL DEFAULT 0,
  used_days NUMERIC(5,1) NOT NULL DEFAULT 0,
  carried_over_days NUMERIC(5,1) DEFAULT 0,
  adjustment_days NUMERIC(5,1) DEFAULT 0,
  remaining_days NUMERIC(5,1) GENERATED ALWAYS AS (
    entitled_days + COALESCE(carried_over_days, 0) + COALESCE(adjustment_days, 0) - used_days
  ) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(employee_id, leave_type_id, year)
);

-- 5. Attendance Policies per organization
CREATE TABLE IF NOT EXISTS public.hr_attendance_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  name_ar TEXT NOT NULL,
  name TEXT,
  work_start_time TIME NOT NULL DEFAULT '08:00',
  work_end_time TIME NOT NULL DEFAULT '17:00',
  break_duration_minutes INTEGER DEFAULT 60,
  grace_period_minutes INTEGER DEFAULT 15,
  late_deduction_per_minute NUMERIC(8,4) DEFAULT 0,
  early_leave_deduction_per_minute NUMERIC(8,4) DEFAULT 0,
  overtime_rate_multiplier NUMERIC(4,2) DEFAULT 1.5,
  weekend_days INTEGER[] DEFAULT '{5,6}', -- Friday=5, Saturday=6
  geofencing_enabled BOOLEAN DEFAULT FALSE,
  geofencing_latitude NUMERIC(10,7),
  geofencing_longitude NUMERIC(10,7),
  geofencing_radius_meters INTEGER DEFAULT 200,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Enhanced attendance: add geolocation and policy reference
ALTER TABLE public.erp_attendance
  ADD COLUMN IF NOT EXISTS check_in_latitude NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS check_in_longitude NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS check_out_latitude NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS check_out_longitude NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS policy_id UUID REFERENCES public.hr_attendance_policies(id),
  ADD COLUMN IF NOT EXISTS late_minutes INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS early_leave_minutes INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS working_hours NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS check_in_method TEXT DEFAULT 'manual', -- manual, gps, biometric, qr
  ADD COLUMN IF NOT EXISTS check_out_method TEXT;

-- 7. Enhanced leave requests: add approval workflow fields
ALTER TABLE public.erp_leave_requests
  ADD COLUMN IF NOT EXISTS leave_type_id UUID REFERENCES public.hr_leave_types(id),
  ADD COLUMN IF NOT EXISTS attachment_url TEXT,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS substitute_employee_id UUID REFERENCES public.erp_employees(id);

-- 8. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_hr_contracts_employee ON public.hr_employment_contracts(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_contracts_org ON public.hr_employment_contracts(organization_id);
CREATE INDEX IF NOT EXISTS idx_hr_contracts_status ON public.hr_employment_contracts(status);
CREATE INDEX IF NOT EXISTS idx_hr_leave_balances_employee ON public.hr_leave_balances(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_leave_balances_year ON public.hr_leave_balances(year);
CREATE INDEX IF NOT EXISTS idx_hr_attendance_policies_org ON public.hr_attendance_policies(organization_id);
CREATE INDEX IF NOT EXISTS idx_erp_employees_dept ON public.erp_employees(department_id);
CREATE INDEX IF NOT EXISTS idx_erp_employees_position ON public.erp_employees(position_id);

-- 9. RLS Policies
ALTER TABLE public.hr_employment_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_attendance_policies ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's org
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1
$$;

-- Contracts RLS
CREATE POLICY "Users can view their org contracts" ON public.hr_employment_contracts
  FOR SELECT USING (organization_id = public.get_user_org_id());

CREATE POLICY "Users can insert their org contracts" ON public.hr_employment_contracts
  FOR INSERT WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "Users can update their org contracts" ON public.hr_employment_contracts
  FOR UPDATE USING (organization_id = public.get_user_org_id());

CREATE POLICY "Users can delete their org contracts" ON public.hr_employment_contracts
  FOR DELETE USING (organization_id = public.get_user_org_id());

-- Leave Types RLS
CREATE POLICY "Users can view their org leave types" ON public.hr_leave_types
  FOR SELECT USING (organization_id = public.get_user_org_id());

CREATE POLICY "Users can manage their org leave types" ON public.hr_leave_types
  FOR ALL USING (organization_id = public.get_user_org_id());

-- Leave Balances RLS
CREATE POLICY "Users can view their org leave balances" ON public.hr_leave_balances
  FOR SELECT USING (organization_id = public.get_user_org_id());

CREATE POLICY "Users can manage their org leave balances" ON public.hr_leave_balances
  FOR ALL USING (organization_id = public.get_user_org_id());

-- Attendance Policies RLS
CREATE POLICY "Users can view their org attendance policies" ON public.hr_attendance_policies
  FOR SELECT USING (organization_id = public.get_user_org_id());

CREATE POLICY "Users can manage their org attendance policies" ON public.hr_attendance_policies
  FOR ALL USING (organization_id = public.get_user_org_id());

-- 10. Auto-populate default leave types trigger
CREATE OR REPLACE FUNCTION public.seed_default_leave_types()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.hr_leave_types (organization_id, name_ar, name, code, is_paid, default_days, sort_order) VALUES
    (NEW.id, 'إجازة سنوية', 'Annual Leave', 'annual', true, 21, 1),
    (NEW.id, 'إجازة مرضية', 'Sick Leave', 'sick', true, 30, 2),
    (NEW.id, 'إجازة بدون راتب', 'Unpaid Leave', 'unpaid', false, 0, 3),
    (NEW.id, 'إجازة طارئة', 'Emergency Leave', 'emergency', true, 6, 4),
    (NEW.id, 'إجازة أمومة', 'Maternity Leave', 'maternity', true, 90, 5),
    (NEW.id, 'إجازة أبوة', 'Paternity Leave', 'paternity', true, 3, 6),
    (NEW.id, 'إجازة حج', 'Hajj Leave', 'hajj', true, 15, 7),
    (NEW.id, 'إجازة زواج', 'Marriage Leave', 'marriage', true, 5, 8),
    (NEW.id, 'إجازة وفاة', 'Bereavement Leave', 'bereavement', true, 5, 9)
  ON CONFLICT (organization_id, code) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Only add trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_seed_leave_types') THEN
    CREATE TRIGGER trigger_seed_leave_types
      AFTER INSERT ON public.organizations
      FOR EACH ROW
      EXECUTE FUNCTION public.seed_default_leave_types();
  END IF;
END;
$$;

-- 11. Updated_at triggers
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_hr_contracts_updated_at') THEN
    CREATE TRIGGER set_hr_contracts_updated_at BEFORE UPDATE ON public.hr_employment_contracts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_hr_leave_balances_updated_at') THEN
    CREATE TRIGGER set_hr_leave_balances_updated_at BEFORE UPDATE ON public.hr_leave_balances FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_hr_attendance_policies_updated_at') THEN
    CREATE TRIGGER set_hr_attendance_policies_updated_at BEFORE UPDATE ON public.hr_attendance_policies FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END;
$$;
