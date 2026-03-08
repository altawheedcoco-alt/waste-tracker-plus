
-- Bulk weight entries table for multi-shipment weight recording
CREATE TABLE public.bulk_weight_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  batch_number TEXT NOT NULL,
  
  -- Partner info
  transporter_id UUID REFERENCES public.organizations(id),
  recycler_id UUID REFERENCES public.organizations(id),
  driver_id UUID REFERENCES public.drivers(id),
  external_partner_id UUID REFERENCES public.external_partners(id),
  
  -- Weight ticket info
  ticket_number TEXT,
  shipment_number TEXT,
  waste_type TEXT NOT NULL,
  waste_description TEXT,
  
  -- Weight data
  first_weight NUMERIC(12,3),
  first_weight_date TIMESTAMPTZ,
  second_weight NUMERIC(12,3),
  second_weight_date TIMESTAMPTZ,
  net_weight NUMERIC(12,3) NOT NULL,
  unit TEXT NOT NULL DEFAULT 'طن',
  
  -- Financial data
  price_per_unit NUMERIC(12,2) DEFAULT 0,
  subtotal NUMERIC(12,2) DEFAULT 0,
  tax_rate NUMERIC(5,2) DEFAULT 0,
  tax_amount NUMERIC(12,2) DEFAULT 0,
  total_amount NUMERIC(12,2) DEFAULT 0,
  paid_amount NUMERIC(12,2) DEFAULT 0,
  remaining_amount NUMERIC(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'EGP',
  
  -- Visibility controls
  visible_to_transporter BOOLEAN DEFAULT true,
  visible_to_recycler BOOLEAN DEFAULT true,
  visible_to_driver BOOLEAN DEFAULT false,
  show_financial_data BOOLEAN DEFAULT false,
  
  -- AI extraction
  weighbridge_image_url TEXT,
  ai_extracted BOOLEAN DEFAULT false,
  ai_extraction_data JSONB,
  
  -- Metadata
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  status TEXT DEFAULT 'active',
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_bwe_org ON public.bulk_weight_entries(organization_id);
CREATE INDEX idx_bwe_batch ON public.bulk_weight_entries(batch_number);
CREATE INDEX idx_bwe_transporter ON public.bulk_weight_entries(transporter_id);
CREATE INDEX idx_bwe_recycler ON public.bulk_weight_entries(recycler_id);
CREATE INDEX idx_bwe_entry_date ON public.bulk_weight_entries(entry_date);
CREATE INDEX idx_bwe_status ON public.bulk_weight_entries(status);

-- RLS
ALTER TABLE public.bulk_weight_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org entries" ON public.bulk_weight_entries
  FOR SELECT USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_members om 
      WHERE om.user_id = (SELECT id FROM public.profiles WHERE id = auth.uid())
    )
    OR transporter_id IN (
      SELECT om.organization_id FROM public.organization_members om 
      WHERE om.user_id = (SELECT id FROM public.profiles WHERE id = auth.uid())
    )
    OR recycler_id IN (
      SELECT om.organization_id FROM public.organization_members om 
      WHERE om.user_id = (SELECT id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can insert own org entries" ON public.bulk_weight_entries
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_members om 
      WHERE om.user_id = (SELECT id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can update own org entries" ON public.bulk_weight_entries
  FOR UPDATE USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_members om 
      WHERE om.user_id = (SELECT id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can delete own org entries" ON public.bulk_weight_entries
  FOR DELETE USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_members om 
      WHERE om.user_id = (SELECT id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- Add to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.bulk_weight_entries;

-- Auto-generate shipment number
CREATE OR REPLACE FUNCTION public.generate_bwe_shipment_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.shipment_number IS NULL OR NEW.shipment_number = '' THEN
    NEW.shipment_number := 'BWE-' || to_char(now(), 'YYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 6);
  END IF;
  -- Auto-calculate financials
  NEW.subtotal := COALESCE(NEW.net_weight, 0) * COALESCE(NEW.price_per_unit, 0);
  NEW.tax_amount := NEW.subtotal * COALESCE(NEW.tax_rate, 0) / 100;
  NEW.total_amount := NEW.subtotal + NEW.tax_amount;
  NEW.remaining_amount := NEW.total_amount - COALESCE(NEW.paid_amount, 0);
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_bwe_auto_calc
  BEFORE INSERT OR UPDATE ON public.bulk_weight_entries
  FOR EACH ROW EXECUTE FUNCTION public.generate_bwe_shipment_number();
