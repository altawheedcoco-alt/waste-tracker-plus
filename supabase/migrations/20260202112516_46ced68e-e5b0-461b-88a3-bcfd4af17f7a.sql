-- =============================================
-- COMPREHENSIVE ACCOUNTING SYSTEM FOR ORGANIZATIONS
-- =============================================

-- 1. Financial Accounts (الحسابات المالية)
CREATE TABLE public.financial_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'current', -- current, savings, receivable, payable
  account_number TEXT,
  balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EGP',
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Invoices (الفواتير)
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  partner_organization_id UUID REFERENCES public.organizations(id),
  partner_name TEXT,
  invoice_type TEXT NOT NULL DEFAULT 'sales', -- sales, purchase, service
  invoice_category TEXT NOT NULL DEFAULT 'shipment', -- shipment, service, expense, other
  status TEXT NOT NULL DEFAULT 'draft', -- draft, pending, sent, paid, partial, overdue, cancelled
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(15,2) DEFAULT 0,
  remaining_amount DECIMAL(15,2) DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EGP',
  notes TEXT,
  terms TEXT,
  created_by UUID REFERENCES public.profiles(id),
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Invoice Items (بنود الفاتورة)
CREATE TABLE public.invoice_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  shipment_id UUID REFERENCES public.shipments(id),
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'unit',
  unit_price DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_price DECIMAL(15,2) NOT NULL DEFAULT 0,
  waste_type TEXT,
  waste_quantity DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Payments (المدفوعات)
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_number TEXT NOT NULL UNIQUE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.invoices(id),
  partner_organization_id UUID REFERENCES public.organizations(id),
  partner_name TEXT,
  payment_type TEXT NOT NULL DEFAULT 'incoming', -- incoming (وارد), outgoing (صادر)
  payment_method TEXT NOT NULL DEFAULT 'cash', -- cash, bank_transfer, check, card, other
  amount DECIMAL(15,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EGP',
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reference_number TEXT,
  bank_name TEXT,
  check_number TEXT,
  status TEXT NOT NULL DEFAULT 'completed', -- pending, completed, cancelled, bounced
  notes TEXT,
  receipt_url TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Expenses (المصروفات التشغيلية)
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_number TEXT NOT NULL UNIQUE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- fuel, maintenance, salaries, rent, utilities, equipment, other
  subcategory TEXT,
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EGP',
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  shipment_id UUID REFERENCES public.shipments(id),
  driver_id UUID REFERENCES public.drivers(id),
  vehicle_plate TEXT,
  payment_method TEXT DEFAULT 'cash',
  receipt_url TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurring_frequency TEXT, -- daily, weekly, monthly, yearly
  status TEXT NOT NULL DEFAULT 'approved', -- pending, approved, rejected
  approved_by UUID REFERENCES public.profiles(id),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Partner Balances (أرصدة الشركاء)
CREATE TABLE public.partner_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  partner_organization_id UUID NOT NULL REFERENCES public.organizations(id),
  total_invoiced DECIMAL(15,2) DEFAULT 0,
  total_paid DECIMAL(15,2) DEFAULT 0,
  balance DECIMAL(15,2) DEFAULT 0, -- positive = partner owes us, negative = we owe partner
  last_transaction_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, partner_organization_id)
);

-- 7. Financial Transactions (حركات مالية تفصيلية)
CREATE TABLE public.financial_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_number TEXT NOT NULL UNIQUE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.financial_accounts(id),
  transaction_type TEXT NOT NULL, -- invoice, payment, expense, adjustment, opening_balance
  transaction_category TEXT, -- receivable, payable, income, expense
  reference_type TEXT, -- invoice, payment, expense, shipment
  reference_id UUID,
  partner_organization_id UUID REFERENCES public.organizations(id),
  description TEXT NOT NULL,
  debit_amount DECIMAL(15,2) DEFAULT 0,
  credit_amount DECIMAL(15,2) DEFAULT 0,
  balance_after DECIMAL(15,2),
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 8. Aggregate Invoices (فواتير مجمعة)
CREATE TABLE public.aggregate_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  shipment_id UUID NOT NULL REFERENCES public.shipments(id),
  shipment_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 9. Payment Reminders (تذكيرات الدفع)
CREATE TABLE public.payment_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  reminder_date DATE NOT NULL,
  reminder_type TEXT NOT NULL DEFAULT 'due_soon', -- due_soon, overdue, final_notice
  is_sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aggregate_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for financial_accounts
CREATE POLICY "Organizations can view their own accounts" ON public.financial_accounts
  FOR SELECT USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Organizations can manage their own accounts" ON public.financial_accounts
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()));

-- RLS Policies for invoices
CREATE POLICY "Organizations can view their invoices" ON public.invoices
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
    OR partner_organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
  );
CREATE POLICY "Organizations can manage their own invoices" ON public.invoices
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()));

-- RLS Policies for invoice_items
CREATE POLICY "Users can view invoice items" ON public.invoice_items
  FOR SELECT USING (
    invoice_id IN (SELECT id FROM public.invoices WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()))
  );
CREATE POLICY "Users can manage invoice items" ON public.invoice_items
  FOR ALL USING (
    invoice_id IN (SELECT id FROM public.invoices WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()))
  );

-- RLS Policies for payments
CREATE POLICY "Organizations can view their payments" ON public.payments
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
    OR partner_organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
  );
CREATE POLICY "Organizations can manage their own payments" ON public.payments
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()));

-- RLS Policies for expenses
CREATE POLICY "Organizations can view their expenses" ON public.expenses
  FOR SELECT USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Organizations can manage their own expenses" ON public.expenses
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()));

-- RLS Policies for partner_balances
CREATE POLICY "Organizations can view their partner balances" ON public.partner_balances
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
    OR partner_organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
  );
CREATE POLICY "Organizations can manage their own partner balances" ON public.partner_balances
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()));

-- RLS Policies for financial_transactions
CREATE POLICY "Organizations can view their transactions" ON public.financial_transactions
  FOR SELECT USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Organizations can create transactions" ON public.financial_transactions
  FOR INSERT WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()));

-- RLS Policies for aggregate_invoices
CREATE POLICY "Users can view aggregate invoices" ON public.aggregate_invoices
  FOR SELECT USING (
    invoice_id IN (SELECT id FROM public.invoices WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()))
  );
CREATE POLICY "Users can manage aggregate invoices" ON public.aggregate_invoices
  FOR ALL USING (
    invoice_id IN (SELECT id FROM public.invoices WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()))
  );

-- RLS Policies for payment_reminders
CREATE POLICY "Organizations can view their reminders" ON public.payment_reminders
  FOR SELECT USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Organizations can manage their reminders" ON public.payment_reminders
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()));

-- Admin policies
CREATE POLICY "Admins can view all financial_accounts" ON public.financial_accounts
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can view all invoices" ON public.invoices
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can view all payments" ON public.payments
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can view all expenses" ON public.expenses
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can view all partner_balances" ON public.partner_balances
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can view all transactions" ON public.financial_transactions
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Functions for auto-generating numbers
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.invoice_number := 'INV-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || 
                        LPAD(CAST(FLOOR(RANDOM() * 10000) AS TEXT), 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.generate_payment_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.payment_number := 'PAY-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || 
                        LPAD(CAST(FLOOR(RANDOM() * 10000) AS TEXT), 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.generate_expense_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.expense_number := 'EXP-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || 
                        LPAD(CAST(FLOOR(RANDOM() * 10000) AS TEXT), 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.generate_transaction_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.transaction_number := 'TXN-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || 
                            LPAD(CAST(FLOOR(RANDOM() * 10000) AS TEXT), 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for auto-generating numbers
CREATE TRIGGER generate_invoice_number_trigger
  BEFORE INSERT ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_invoice_number();

CREATE TRIGGER generate_payment_number_trigger
  BEFORE INSERT ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_payment_number();

CREATE TRIGGER generate_expense_number_trigger
  BEFORE INSERT ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_expense_number();

CREATE TRIGGER generate_transaction_number_trigger
  BEFORE INSERT ON public.financial_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_transaction_number();

-- Function to update invoice remaining amount
CREATE OR REPLACE FUNCTION public.update_invoice_remaining()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.invoices 
  SET 
    remaining_amount = total_amount - paid_amount,
    status = CASE 
      WHEN paid_amount >= total_amount THEN 'paid'
      WHEN paid_amount > 0 THEN 'partial'
      WHEN due_date < CURRENT_DATE AND paid_amount < total_amount THEN 'overdue'
      ELSE status
    END,
    updated_at = now()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Function to update partner balance after payment
CREATE OR REPLACE FUNCTION public.update_partner_balance_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Update or insert partner balance
  INSERT INTO public.partner_balances (organization_id, partner_organization_id, total_paid, balance, last_transaction_date)
  VALUES (
    NEW.organization_id,
    NEW.partner_organization_id,
    CASE WHEN NEW.payment_type = 'outgoing' THEN NEW.amount ELSE 0 END,
    CASE WHEN NEW.payment_type = 'outgoing' THEN -NEW.amount ELSE NEW.amount END,
    now()
  )
  ON CONFLICT (organization_id, partner_organization_id)
  DO UPDATE SET
    total_paid = partner_balances.total_paid + 
      CASE WHEN NEW.payment_type = 'outgoing' THEN NEW.amount ELSE 0 END,
    balance = partner_balances.balance + 
      CASE WHEN NEW.payment_type = 'outgoing' THEN -NEW.amount ELSE NEW.amount END,
    last_transaction_date = now(),
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_partner_balance_trigger
  AFTER INSERT ON public.payments
  FOR EACH ROW
  WHEN (NEW.partner_organization_id IS NOT NULL)
  EXECUTE FUNCTION public.update_partner_balance_on_payment();

-- Function to create invoice from shipment
CREATE OR REPLACE FUNCTION public.create_invoice_from_shipment()
RETURNS TRIGGER AS $$
DECLARE
  v_generator_org RECORD;
  v_transporter_org RECORD;
  v_recycler_org RECORD;
BEGIN
  -- Only create invoice when shipment is confirmed
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
    -- Get organization details
    SELECT * INTO v_generator_org FROM organizations WHERE id = NEW.generator_id;
    SELECT * INTO v_transporter_org FROM organizations WHERE id = NEW.transporter_id;
    SELECT * INTO v_recycler_org FROM organizations WHERE id = NEW.recycler_id;
    
    -- Create invoice from transporter to generator (for transport services)
    IF NEW.transporter_id IS NOT NULL AND NEW.generator_id IS NOT NULL THEN
      INSERT INTO public.invoices (
        organization_id,
        partner_organization_id,
        partner_name,
        invoice_type,
        invoice_category,
        status,
        issue_date,
        due_date,
        notes
      ) VALUES (
        NEW.transporter_id,
        NEW.generator_id,
        v_generator_org.name,
        'sales',
        'shipment',
        'pending',
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '30 days',
        'فاتورة خدمات نقل للشحنة رقم ' || NEW.shipment_number
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Indexes for performance
CREATE INDEX idx_invoices_organization ON public.invoices(organization_id);
CREATE INDEX idx_invoices_partner ON public.invoices(partner_organization_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX idx_payments_organization ON public.payments(organization_id);
CREATE INDEX idx_payments_invoice ON public.payments(invoice_id);
CREATE INDEX idx_expenses_organization ON public.expenses(organization_id);
CREATE INDEX idx_expenses_category ON public.expenses(category);
CREATE INDEX idx_transactions_organization ON public.financial_transactions(organization_id);
CREATE INDEX idx_partner_balances_orgs ON public.partner_balances(organization_id, partner_organization_id);