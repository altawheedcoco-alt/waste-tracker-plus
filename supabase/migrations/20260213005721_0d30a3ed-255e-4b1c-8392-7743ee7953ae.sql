
-- ============================================
-- ERP SYSTEM TABLES
-- ============================================

-- 1. CHART OF ACCOUNTS (شجرة الحسابات)
CREATE TABLE public.erp_chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  account_code TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_name_en TEXT,
  account_type TEXT NOT NULL CHECK (account_type IN ('asset','liability','equity','revenue','expense')),
  parent_id UUID REFERENCES public.erp_chart_of_accounts(id),
  is_active BOOLEAN DEFAULT true,
  balance NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, account_code)
);

-- 2. JOURNAL ENTRIES (القيود اليومية)
CREATE TABLE public.erp_journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  entry_number TEXT NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  reference_type TEXT,
  reference_id UUID,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','posted','reversed')),
  total_debit NUMERIC DEFAULT 0,
  total_credit NUMERIC DEFAULT 0,
  created_by UUID,
  posted_by UUID,
  posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.erp_journal_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id UUID NOT NULL REFERENCES public.erp_journal_entries(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.erp_chart_of_accounts(id),
  debit NUMERIC DEFAULT 0,
  credit NUMERIC DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. FINANCIAL REPORTS CACHE
CREATE TABLE public.erp_financial_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('balance_sheet','income_statement','cash_flow','trial_balance')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  report_data JSONB DEFAULT '{}',
  generated_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. WAREHOUSES (المستودعات)
CREATE TABLE public.erp_warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  location TEXT,
  manager_id UUID,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. INVENTORY ITEMS (الأصناف)
CREATE TABLE public.erp_inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  item_code TEXT NOT NULL,
  item_name TEXT NOT NULL,
  category TEXT,
  unit TEXT DEFAULT 'piece',
  unit_cost NUMERIC DEFAULT 0,
  selling_price NUMERIC DEFAULT 0,
  current_stock NUMERIC DEFAULT 0,
  minimum_stock NUMERIC DEFAULT 0,
  maximum_stock NUMERIC,
  warehouse_id UUID REFERENCES public.erp_warehouses(id),
  barcode TEXT,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, item_code)
);

-- 6. STOCK MOVEMENTS (حركة المخزون)
CREATE TABLE public.erp_stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.erp_inventory_items(id),
  warehouse_id UUID REFERENCES public.erp_warehouses(id),
  movement_type TEXT NOT NULL CHECK (movement_type IN ('in','out','transfer','adjustment')),
  quantity NUMERIC NOT NULL,
  unit_cost NUMERIC,
  reference_type TEXT,
  reference_id UUID,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. STOCK COUNTS (الجرد)
CREATE TABLE public.erp_stock_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES public.erp_warehouses(id),
  count_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','in_progress','completed','approved')),
  notes TEXT,
  created_by UUID,
  approved_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.erp_stock_count_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_count_id UUID NOT NULL REFERENCES public.erp_stock_counts(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.erp_inventory_items(id),
  system_quantity NUMERIC DEFAULT 0,
  actual_quantity NUMERIC DEFAULT 0,
  difference NUMERIC GENERATED ALWAYS AS (actual_quantity - system_quantity) STORED,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. EMPLOYEES (الموظفين) - extends profiles
CREATE TABLE public.erp_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  profile_id UUID,
  employee_number TEXT,
  full_name TEXT NOT NULL,
  national_id TEXT,
  phone TEXT,
  email TEXT,
  department TEXT,
  job_title TEXT,
  hire_date DATE,
  contract_type TEXT CHECK (contract_type IN ('full_time','part_time','contract','temporary')),
  base_salary NUMERIC DEFAULT 0,
  housing_allowance NUMERIC DEFAULT 0,
  transport_allowance NUMERIC DEFAULT 0,
  other_allowances NUMERIC DEFAULT 0,
  bank_name TEXT,
  iban TEXT,
  is_active BOOLEAN DEFAULT true,
  termination_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. ATTENDANCE (الحضور والانصراف)
CREATE TABLE public.erp_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.erp_employees(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  status TEXT DEFAULT 'present' CHECK (status IN ('present','absent','late','half_day','holiday','weekend')),
  overtime_hours NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, attendance_date)
);

-- 10. LEAVE REQUESTS (طلبات الإجازة)
CREATE TABLE public.erp_leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.erp_employees(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('annual','sick','emergency','unpaid','maternity','other')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_count INTEGER,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','cancelled')),
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 11. PAYROLL (الرواتب)
CREATE TABLE public.erp_payroll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  period_month INTEGER NOT NULL,
  period_year INTEGER NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','calculated','approved','paid')),
  total_amount NUMERIC DEFAULT 0,
  notes TEXT,
  created_by UUID,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.erp_payroll_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_id UUID NOT NULL REFERENCES public.erp_payroll(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.erp_employees(id),
  base_salary NUMERIC DEFAULT 0,
  allowances NUMERIC DEFAULT 0,
  overtime_pay NUMERIC DEFAULT 0,
  deductions NUMERIC DEFAULT 0,
  net_salary NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. PURCHASE ORDERS (أوامر الشراء)
CREATE TABLE public.erp_purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  po_number TEXT NOT NULL,
  supplier_name TEXT NOT NULL,
  supplier_contact TEXT,
  order_date DATE DEFAULT CURRENT_DATE,
  expected_delivery DATE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','sent','confirmed','received','cancelled')),
  subtotal NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  notes TEXT,
  created_by UUID,
  approved_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.erp_purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES public.erp_purchase_orders(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.erp_inventory_items(id),
  description TEXT,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC DEFAULT 0,
  total_price NUMERIC DEFAULT 0,
  received_quantity NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 13. SALES ORDERS (أوامر البيع)
CREATE TABLE public.erp_sales_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  so_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_contact TEXT,
  order_date DATE DEFAULT CURRENT_DATE,
  delivery_date DATE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','confirmed','shipped','delivered','cancelled')),
  subtotal NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.erp_sales_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order_id UUID NOT NULL REFERENCES public.erp_sales_orders(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.erp_inventory_items(id),
  description TEXT,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC DEFAULT 0,
  total_price NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 14. QUOTATIONS (عروض الأسعار)
CREATE TABLE public.erp_quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  quotation_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_contact TEXT,
  quote_date DATE DEFAULT CURRENT_DATE,
  valid_until DATE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','sent','accepted','rejected','expired')),
  subtotal NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.erp_quotation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES public.erp_quotations(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.erp_inventory_items(id),
  description TEXT,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC DEFAULT 0,
  total_price NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE public.erp_chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_journal_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_financial_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_stock_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_stock_count_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_payroll_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_sales_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_quotation_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - Organization members can CRUD their own data
-- Admins can access all
-- ============================================

-- Helper: Check if user belongs to org
CREATE OR REPLACE FUNCTION public.user_belongs_to_org(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = _user_id AND organization_id = _org_id
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin'
  );
$$;

-- Macro for org-based RLS (apply to all ERP tables)
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'erp_chart_of_accounts','erp_journal_entries','erp_financial_reports',
    'erp_warehouses','erp_inventory_items','erp_stock_movements',
    'erp_stock_counts','erp_employees','erp_attendance',
    'erp_leave_requests','erp_payroll','erp_purchase_orders',
    'erp_sales_orders','erp_quotations'
  ] LOOP
    EXECUTE format('
      CREATE POLICY "org_select_%1$s" ON public.%1$I FOR SELECT TO authenticated
        USING (public.user_belongs_to_org(auth.uid(), organization_id));
      CREATE POLICY "org_insert_%1$s" ON public.%1$I FOR INSERT TO authenticated
        WITH CHECK (public.user_belongs_to_org(auth.uid(), organization_id));
      CREATE POLICY "org_update_%1$s" ON public.%1$I FOR UPDATE TO authenticated
        USING (public.user_belongs_to_org(auth.uid(), organization_id));
      CREATE POLICY "org_delete_%1$s" ON public.%1$I FOR DELETE TO authenticated
        USING (public.user_belongs_to_org(auth.uid(), organization_id));
    ', tbl);
  END LOOP;
END
$$;

-- Child tables: access via parent
DO $$
DECLARE
  child_tbl TEXT;
  parent_tbl TEXT;
  parent_col TEXT;
BEGIN
  -- journal_lines -> journal_entries
  CREATE POLICY "org_select_erp_journal_lines" ON public.erp_journal_lines FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.erp_journal_entries je WHERE je.id = journal_entry_id AND public.user_belongs_to_org(auth.uid(), je.organization_id)));
  CREATE POLICY "org_insert_erp_journal_lines" ON public.erp_journal_lines FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM public.erp_journal_entries je WHERE je.id = journal_entry_id AND public.user_belongs_to_org(auth.uid(), je.organization_id)));
  CREATE POLICY "org_update_erp_journal_lines" ON public.erp_journal_lines FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.erp_journal_entries je WHERE je.id = journal_entry_id AND public.user_belongs_to_org(auth.uid(), je.organization_id)));
  CREATE POLICY "org_delete_erp_journal_lines" ON public.erp_journal_lines FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.erp_journal_entries je WHERE je.id = journal_entry_id AND public.user_belongs_to_org(auth.uid(), je.organization_id)));

  -- stock_count_items -> stock_counts
  CREATE POLICY "org_select_erp_stock_count_items" ON public.erp_stock_count_items FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.erp_stock_counts sc WHERE sc.id = stock_count_id AND public.user_belongs_to_org(auth.uid(), sc.organization_id)));
  CREATE POLICY "org_insert_erp_stock_count_items" ON public.erp_stock_count_items FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM public.erp_stock_counts sc WHERE sc.id = stock_count_id AND public.user_belongs_to_org(auth.uid(), sc.organization_id)));
  CREATE POLICY "org_update_erp_stock_count_items" ON public.erp_stock_count_items FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.erp_stock_counts sc WHERE sc.id = stock_count_id AND public.user_belongs_to_org(auth.uid(), sc.organization_id)));
  CREATE POLICY "org_delete_erp_stock_count_items" ON public.erp_stock_count_items FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.erp_stock_counts sc WHERE sc.id = stock_count_id AND public.user_belongs_to_org(auth.uid(), sc.organization_id)));

  -- payroll_items -> payroll
  CREATE POLICY "org_select_erp_payroll_items" ON public.erp_payroll_items FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.erp_payroll p WHERE p.id = payroll_id AND public.user_belongs_to_org(auth.uid(), p.organization_id)));
  CREATE POLICY "org_insert_erp_payroll_items" ON public.erp_payroll_items FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM public.erp_payroll p WHERE p.id = payroll_id AND public.user_belongs_to_org(auth.uid(), p.organization_id)));
  CREATE POLICY "org_update_erp_payroll_items" ON public.erp_payroll_items FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.erp_payroll p WHERE p.id = payroll_id AND public.user_belongs_to_org(auth.uid(), p.organization_id)));
  CREATE POLICY "org_delete_erp_payroll_items" ON public.erp_payroll_items FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.erp_payroll p WHERE p.id = payroll_id AND public.user_belongs_to_org(auth.uid(), p.organization_id)));

  -- purchase_order_items -> purchase_orders
  CREATE POLICY "org_select_erp_po_items" ON public.erp_purchase_order_items FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.erp_purchase_orders po WHERE po.id = purchase_order_id AND public.user_belongs_to_org(auth.uid(), po.organization_id)));
  CREATE POLICY "org_insert_erp_po_items" ON public.erp_purchase_order_items FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM public.erp_purchase_orders po WHERE po.id = purchase_order_id AND public.user_belongs_to_org(auth.uid(), po.organization_id)));
  CREATE POLICY "org_update_erp_po_items" ON public.erp_purchase_order_items FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.erp_purchase_orders po WHERE po.id = purchase_order_id AND public.user_belongs_to_org(auth.uid(), po.organization_id)));
  CREATE POLICY "org_delete_erp_po_items" ON public.erp_purchase_order_items FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.erp_purchase_orders po WHERE po.id = purchase_order_id AND public.user_belongs_to_org(auth.uid(), po.organization_id)));

  -- sales_order_items -> sales_orders
  CREATE POLICY "org_select_erp_so_items" ON public.erp_sales_order_items FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.erp_sales_orders so WHERE so.id = sales_order_id AND public.user_belongs_to_org(auth.uid(), so.organization_id)));
  CREATE POLICY "org_insert_erp_so_items" ON public.erp_sales_order_items FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM public.erp_sales_orders so WHERE so.id = sales_order_id AND public.user_belongs_to_org(auth.uid(), so.organization_id)));
  CREATE POLICY "org_update_erp_so_items" ON public.erp_sales_order_items FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.erp_sales_orders so WHERE so.id = sales_order_id AND public.user_belongs_to_org(auth.uid(), so.organization_id)));
  CREATE POLICY "org_delete_erp_so_items" ON public.erp_sales_order_items FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.erp_sales_orders so WHERE so.id = sales_order_id AND public.user_belongs_to_org(auth.uid(), so.organization_id)));

  -- quotation_items -> quotations
  CREATE POLICY "org_select_erp_quot_items" ON public.erp_quotation_items FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.erp_quotations q WHERE q.id = quotation_id AND public.user_belongs_to_org(auth.uid(), q.organization_id)));
  CREATE POLICY "org_insert_erp_quot_items" ON public.erp_quotation_items FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM public.erp_quotations q WHERE q.id = quotation_id AND public.user_belongs_to_org(auth.uid(), q.organization_id)));
  CREATE POLICY "org_update_erp_quot_items" ON public.erp_quotation_items FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.erp_quotations q WHERE q.id = quotation_id AND public.user_belongs_to_org(auth.uid(), q.organization_id)));
  CREATE POLICY "org_delete_erp_quot_items" ON public.erp_quotation_items FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.erp_quotations q WHERE q.id = quotation_id AND public.user_belongs_to_org(auth.uid(), q.organization_id)));
END
$$;

-- Indexes for performance
CREATE INDEX idx_erp_coa_org ON public.erp_chart_of_accounts(organization_id);
CREATE INDEX idx_erp_je_org ON public.erp_journal_entries(organization_id);
CREATE INDEX idx_erp_inv_items_org ON public.erp_inventory_items(organization_id);
CREATE INDEX idx_erp_employees_org ON public.erp_employees(organization_id);
CREATE INDEX idx_erp_attendance_emp ON public.erp_attendance(employee_id, attendance_date);
CREATE INDEX idx_erp_po_org ON public.erp_purchase_orders(organization_id);
CREATE INDEX idx_erp_so_org ON public.erp_sales_orders(organization_id);
