
-- Work Orders (أوامر الشغل)
CREATE TABLE public.work_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  created_by UUID REFERENCES auth.users(id),
  
  -- Waste details
  waste_type TEXT NOT NULL,
  waste_description TEXT,
  estimated_quantity NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'ton',
  is_hazardous BOOLEAN DEFAULT false,
  
  -- Location & scheduling
  pickup_location TEXT,
  pickup_latitude NUMERIC,
  pickup_longitude NUMERIC,
  preferred_date DATE,
  preferred_time_slot TEXT,
  urgency TEXT NOT NULL DEFAULT 'normal' CHECK (urgency IN ('low', 'normal', 'high', 'urgent')),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'partially_accepted', 'accepted', 'in_progress', 'completed', 'cancelled')),
  
  -- Additional
  special_instructions TEXT,
  requires_special_equipment BOOLEAN DEFAULT false,
  equipment_details TEXT,
  attachments TEXT[],
  
  -- Tracking
  sent_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Work Order Items (بنود أمر الشغل)
CREATE TABLE public.work_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  waste_type TEXT NOT NULL,
  waste_description TEXT,
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'ton',
  is_hazardous BOOLEAN DEFAULT false,
  packaging_type TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Work Order Recipients (الجهات المستلمة لأمر الشغل)
CREATE TABLE public.work_order_recipients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  recipient_organization_id UUID REFERENCES public.organizations(id),
  recipient_external_partner_id UUID REFERENCES public.external_partners(id),
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('transporter', 'recycler', 'disposal')),
  
  -- Response
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'accepted', 'rejected', 'counter_offer')),
  response_notes TEXT,
  counter_quantity NUMERIC,
  counter_date DATE,
  counter_price NUMERIC,
  
  responded_by UUID REFERENCES auth.users(id),
  viewed_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Work Order Activity Log
CREATE TABLE public.work_order_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES auth.users(id),
  actor_organization_id UUID REFERENCES public.organizations(id),
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_work_orders_org ON public.work_orders(organization_id);
CREATE INDEX idx_work_orders_status ON public.work_orders(status);
CREATE INDEX idx_work_orders_number ON public.work_orders(order_number);
CREATE INDEX idx_work_order_recipients_org ON public.work_order_recipients(recipient_organization_id);
CREATE INDEX idx_work_order_recipients_status ON public.work_order_recipients(status);
CREATE INDEX idx_work_order_activity_wo ON public.work_order_activity(work_order_id);

-- Enable RLS
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_activity ENABLE ROW LEVEL SECURITY;

-- RLS: work_orders - creator org can manage, recipient orgs can view
CREATE POLICY "Creator org can manage work orders"
  ON public.work_orders FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Recipients can view work orders"
  ON public.work_orders FOR SELECT
  USING (id IN (
    SELECT work_order_id FROM public.work_order_recipients 
    WHERE recipient_organization_id IN (
      SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
    )
  ));

-- RLS: work_order_items
CREATE POLICY "Access items via work order"
  ON public.work_order_items FOR ALL
  USING (work_order_id IN (
    SELECT id FROM public.work_orders WHERE organization_id IN (
      SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
    )
    UNION
    SELECT work_order_id FROM public.work_order_recipients 
    WHERE recipient_organization_id IN (
      SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
    )
  ));

-- RLS: work_order_recipients
CREATE POLICY "Creator org manages recipients"
  ON public.work_order_recipients FOR ALL
  USING (work_order_id IN (
    SELECT id FROM public.work_orders WHERE organization_id IN (
      SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Recipient org can view and respond"
  ON public.work_order_recipients FOR ALL
  USING (recipient_organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  ));

-- RLS: work_order_activity
CREATE POLICY "Access activity via work order"
  ON public.work_order_activity FOR SELECT
  USING (work_order_id IN (
    SELECT id FROM public.work_orders WHERE organization_id IN (
      SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
    )
    UNION
    SELECT work_order_id FROM public.work_order_recipients 
    WHERE recipient_organization_id IN (
      SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Insert activity for own org"
  ON public.work_order_activity FOR INSERT
  WITH CHECK (actor_organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  ));

-- Auto-generate order number
CREATE OR REPLACE FUNCTION public.generate_work_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'WO-' || TO_CHAR(NOW(), 'YYMM') || '-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_work_order_number
  BEFORE INSERT ON public.work_orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL OR NEW.order_number = '')
  EXECUTE FUNCTION public.generate_work_order_number();

-- Auto-update updated_at
CREATE TRIGGER update_work_orders_updated_at
  BEFORE UPDATE ON public.work_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_work_order_recipients_updated_at
  BEFORE UPDATE ON public.work_order_recipients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for recipients (notifications)
ALTER PUBLICATION supabase_realtime ADD TABLE public.work_order_recipients;
