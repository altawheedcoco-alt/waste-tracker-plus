-- ===========================================
-- iRecycle System Integration Migration
-- Phase 1: Visual Documentation & Award Letters
-- ===========================================

-- 1. Add weighbridge photo fields to shipments
ALTER TABLE public.shipments 
ADD COLUMN IF NOT EXISTS weighbridge_photo_url TEXT,
ADD COLUMN IF NOT EXISTS weighbridge_ticket_number TEXT,
ADD COLUMN IF NOT EXISTS weighbridge_gross_weight NUMERIC,
ADD COLUMN IF NOT EXISTS weighbridge_tare_weight NUMERIC,
ADD COLUMN IF NOT EXISTS weighbridge_net_weight NUMERIC,
ADD COLUMN IF NOT EXISTS weighbridge_date DATE,
ADD COLUMN IF NOT EXISTS weighbridge_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS actual_weight NUMERIC,
ADD COLUMN IF NOT EXISTS price_per_unit NUMERIC,
ADD COLUMN IF NOT EXISTS price_source TEXT CHECK (price_source IN ('award_letter', 'manual', 'partner_price', 'contract')),
ADD COLUMN IF NOT EXISTS award_letter_id UUID,
ADD COLUMN IF NOT EXISTS total_value NUMERIC,
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT,
ADD COLUMN IF NOT EXISTS payment_proof_type TEXT CHECK (payment_proof_type IN ('bank_receipt', 'cash_note', 'external_url', 'pending')),
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'disputed')),
ADD COLUMN IF NOT EXISTS call_log_id UUID,
ADD COLUMN IF NOT EXISTS gps_pickup_lat NUMERIC,
ADD COLUMN IF NOT EXISTS gps_pickup_lng NUMERIC,
ADD COLUMN IF NOT EXISTS gps_delivery_lat NUMERIC,
ADD COLUMN IF NOT EXISTS gps_delivery_lng NUMERIC;

-- 2. Create Award Letters table (خطابات الترسية)
CREATE TABLE IF NOT EXISTS public.award_letters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  partner_organization_id UUID REFERENCES public.organizations(id),
  external_partner_id UUID REFERENCES public.external_partners(id),
  letter_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  issue_date DATE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'expired', 'cancelled')),
  total_estimated_quantity NUMERIC,
  currency TEXT DEFAULT 'EGP',
  notes TEXT,
  attachment_url TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create Award Letter Items (تفاصيل أسعار خطابات الترسية)
CREATE TABLE IF NOT EXISTS public.award_letter_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  award_letter_id UUID NOT NULL REFERENCES public.award_letters(id) ON DELETE CASCADE,
  waste_type TEXT NOT NULL,
  waste_description TEXT,
  unit_price NUMERIC NOT NULL,
  unit TEXT DEFAULT 'kg',
  min_quantity NUMERIC,
  max_quantity NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Create Factory Map Labels (ملصقات المصانع على الخريطة)
CREATE TABLE IF NOT EXISTS public.factory_map_labels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  external_partner_id UUID REFERENCES public.external_partners(id),
  name TEXT NOT NULL,
  short_name TEXT,
  label_type TEXT DEFAULT 'factory' CHECK (label_type IN ('factory', 'recycler', 'collection_point', 'warehouse', 'office')),
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  address TEXT,
  city TEXT,
  icon_type TEXT DEFAULT 'factory',
  color TEXT DEFAULT '#10B981',
  is_visible BOOLEAN DEFAULT true,
  display_priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Add call linking to shipments
ALTER TABLE public.call_logs
ADD COLUMN IF NOT EXISTS linked_manually BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS link_notes TEXT;

-- 6. Create Accounting Ledger (دفتر الأستاذ المحاسبي)
CREATE TABLE IF NOT EXISTS public.accounting_ledger (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  partner_organization_id UUID REFERENCES public.organizations(id),
  external_partner_id UUID REFERENCES public.external_partners(id),
  shipment_id UUID REFERENCES public.shipments(id),
  deposit_id UUID REFERENCES public.deposits(id),
  invoice_id UUID REFERENCES public.invoices(id),
  entry_type TEXT NOT NULL CHECK (entry_type IN ('debit', 'credit')),
  entry_category TEXT NOT NULL CHECK (entry_category IN ('shipment', 'payment', 'deposit', 'adjustment', 'opening_balance')),
  amount NUMERIC NOT NULL,
  balance_after NUMERIC,
  description TEXT,
  reference_number TEXT,
  weighbridge_photo_url TEXT,
  payment_proof_url TEXT,
  call_recording_url TEXT,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES public.profiles(id),
  verified_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Enable RLS
ALTER TABLE public.award_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.award_letter_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.factory_map_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_ledger ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies for award_letters
CREATE POLICY "Users can view their organization's award letters"
ON public.award_letters FOR SELECT
USING (
  public.user_belongs_to_org(auth.uid(), organization_id)
  OR public.user_belongs_to_org(auth.uid(), partner_organization_id)
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can create award letters for their organization"
ON public.award_letters FOR INSERT
WITH CHECK (public.user_belongs_to_org(auth.uid(), organization_id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update their organization's award letters"
ON public.award_letters FOR UPDATE
USING (public.user_belongs_to_org(auth.uid(), organization_id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete their organization's award letters"
ON public.award_letters FOR DELETE
USING (public.user_belongs_to_org(auth.uid(), organization_id) OR public.has_role(auth.uid(), 'admin'));

-- 9. RLS Policies for award_letter_items
CREATE POLICY "Users can view award letter items via parent"
ON public.award_letter_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.award_letters al
    WHERE al.id = award_letter_items.award_letter_id
    AND (
      public.user_belongs_to_org(auth.uid(), al.organization_id)
      OR public.user_belongs_to_org(auth.uid(), al.partner_organization_id)
      OR public.has_role(auth.uid(), 'admin')
    )
  )
);

CREATE POLICY "Users can manage award letter items via parent"
ON public.award_letter_items FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.award_letters al
    WHERE al.id = award_letter_items.award_letter_id
    AND (public.user_belongs_to_org(auth.uid(), al.organization_id) OR public.has_role(auth.uid(), 'admin'))
  )
);

-- 10. RLS Policies for factory_map_labels
CREATE POLICY "Everyone can view visible factory labels"
ON public.factory_map_labels FOR SELECT
USING (is_visible = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can manage their organization's labels"
ON public.factory_map_labels FOR ALL
USING (
  public.user_belongs_to_org(auth.uid(), organization_id)
  OR public.has_role(auth.uid(), 'admin')
);

-- 11. RLS Policies for accounting_ledger
CREATE POLICY "Users can view their organization's ledger entries"
ON public.accounting_ledger FOR SELECT
USING (
  public.user_belongs_to_org(auth.uid(), organization_id)
  OR public.user_belongs_to_org(auth.uid(), partner_organization_id)
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can create ledger entries for their organization"
ON public.accounting_ledger FOR INSERT
WITH CHECK (public.user_belongs_to_org(auth.uid(), organization_id) OR public.has_role(auth.uid(), 'admin'));

-- 12. Trigger to auto-create ledger entry on shipment confirmation
CREATE OR REPLACE FUNCTION public.auto_create_ledger_entry_on_shipment()
RETURNS TRIGGER AS $$
BEGIN
  -- Create ledger entry when shipment is confirmed and has pricing
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' AND NEW.total_value IS NOT NULL THEN
    INSERT INTO public.accounting_ledger (
      organization_id,
      partner_organization_id,
      shipment_id,
      entry_type,
      entry_category,
      amount,
      description,
      weighbridge_photo_url,
      entry_date
    ) VALUES (
      NEW.transporter_id,
      NEW.generator_id,
      NEW.id,
      'debit',
      'shipment',
      NEW.total_value,
      'شحنة رقم ' || NEW.shipment_number || ' - ' || COALESCE(NEW.waste_description, NEW.waste_type::TEXT),
      NEW.weighbridge_photo_url,
      CURRENT_DATE
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trigger_auto_ledger_on_shipment
  AFTER UPDATE ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_ledger_entry_on_shipment();

-- 13. Trigger to auto-create ledger entry on deposit
CREATE OR REPLACE FUNCTION public.auto_create_ledger_entry_on_deposit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.accounting_ledger (
    organization_id,
    partner_organization_id,
    deposit_id,
    entry_type,
    entry_category,
    amount,
    description,
    payment_proof_url,
    entry_date
  ) VALUES (
    NEW.organization_id,
    NEW.partner_organization_id,
    NEW.id,
    'credit',
    'deposit',
    NEW.amount,
    'إيداع من ' || NEW.depositor_name || ' - ' || NEW.transfer_method,
    NEW.receipt_url,
    NEW.deposit_date::DATE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trigger_auto_ledger_on_deposit
  AFTER INSERT ON public.deposits
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_ledger_entry_on_deposit();

-- 14. Function to get price from award letter
CREATE OR REPLACE FUNCTION public.get_award_letter_price(
  p_partner_org_id UUID,
  p_waste_type TEXT,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  award_letter_id UUID,
  letter_number TEXT,
  unit_price NUMERIC,
  unit TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.id,
    al.letter_number,
    ali.unit_price,
    ali.unit
  FROM public.award_letters al
  JOIN public.award_letter_items ali ON ali.award_letter_id = al.id
  WHERE (al.partner_organization_id = p_partner_org_id OR al.organization_id = p_partner_org_id)
    AND ali.waste_type = p_waste_type
    AND al.status = 'active'
    AND al.start_date <= p_date
    AND (al.end_date IS NULL OR al.end_date >= p_date)
  ORDER BY al.start_date DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 15. Add FK for shipment call_log link
ALTER TABLE public.shipments
ADD CONSTRAINT fk_shipments_call_log
FOREIGN KEY (call_log_id) REFERENCES public.call_logs(id) ON DELETE SET NULL;

-- 16. Add FK for shipment award_letter link
ALTER TABLE public.shipments
ADD CONSTRAINT fk_shipments_award_letter
FOREIGN KEY (award_letter_id) REFERENCES public.award_letters(id) ON DELETE SET NULL;

-- 17. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_award_letters_partner ON public.award_letters(partner_organization_id);
CREATE INDEX IF NOT EXISTS idx_award_letters_status ON public.award_letters(status);
CREATE INDEX IF NOT EXISTS idx_award_letter_items_waste_type ON public.award_letter_items(waste_type);
CREATE INDEX IF NOT EXISTS idx_factory_labels_location ON public.factory_map_labels(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_accounting_ledger_partner ON public.accounting_ledger(partner_organization_id);
CREATE INDEX IF NOT EXISTS idx_accounting_ledger_shipment ON public.accounting_ledger(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipments_weighbridge ON public.shipments(weighbridge_verified);

-- 18. Generate award letter number trigger
CREATE OR REPLACE FUNCTION public.generate_award_letter_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.letter_number IS NULL OR NEW.letter_number = '' THEN
    NEW.letter_number := 'AWD-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || 
                         LPAD(CAST(FLOOR(RANDOM() * 10000) AS TEXT), 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trigger_generate_award_letter_number
  BEFORE INSERT ON public.award_letters
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_award_letter_number();