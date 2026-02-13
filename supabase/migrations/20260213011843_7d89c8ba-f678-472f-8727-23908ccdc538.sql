
-- جدول حساب تكلفة البضاعة المباعة (COGS)
CREATE TABLE public.erp_cogs_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  opening_inventory NUMERIC NOT NULL DEFAULT 0,
  purchases NUMERIC NOT NULL DEFAULT 0,
  purchase_freight NUMERIC NOT NULL DEFAULT 0,
  direct_labor NUMERIC NOT NULL DEFAULT 0,
  wastage NUMERIC NOT NULL DEFAULT 0,
  closing_inventory NUMERIC NOT NULL DEFAULT 0,
  cogs NUMERIC NOT NULL DEFAULT 0,
  revenue NUMERIC NOT NULL DEFAULT 0,
  gross_profit NUMERIC NOT NULL DEFAULT 0,
  gross_profit_margin NUMERIC NOT NULL DEFAULT 0,
  valuation_method TEXT NOT NULL DEFAULT 'weighted_average',
  generated_automatically BOOLEAN DEFAULT false,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.erp_cogs_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org COGS" ON public.erp_cogs_records
  FOR SELECT USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Users can insert own org COGS" ON public.erp_cogs_records
  FOR INSERT WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Users can update own org COGS" ON public.erp_cogs_records
  FOR UPDATE USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() AND is_active = true
  ));

-- إضافة عمود طريقة التقييم وتكاليف إضافية للمخزون
ALTER TABLE public.erp_inventory_items 
  ADD COLUMN IF NOT EXISTS valuation_method TEXT DEFAULT 'weighted_average',
  ADD COLUMN IF NOT EXISTS total_cost NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS freight_cost NUMERIC DEFAULT 0;

-- إضافة عمود نوع التكلفة لحركة المخزون
ALTER TABLE public.erp_stock_movements 
  ADD COLUMN IF NOT EXISTS freight_cost NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_cost NUMERIC DEFAULT 0;
