
-- B2B Marketplace Enhancement: Requests (demand side), Deals, Favorites, Messages

-- 1) Requests table (demand side - "أريد شراء / أحتاج خدمة")
CREATE TABLE IF NOT EXISTS public.b2b_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  requester_type text NOT NULL DEFAULT 'generator',
  title text NOT NULL,
  description text,
  waste_type text NOT NULL,
  quantity numeric NOT NULL DEFAULT 0,
  unit text DEFAULT 'ton',
  budget_min numeric,
  budget_max numeric,
  target_audience text[] DEFAULT ARRAY['generator','transporter','recycler','disposal']::text[],
  delivery_preference text DEFAULT 'any',
  location_city text,
  location_address text,
  urgency text DEFAULT 'normal',
  deadline date,
  status text DEFAULT 'open',
  responses_count integer DEFAULT 0,
  views_count integer DEFAULT 0,
  request_number text NOT NULL DEFAULT ('REQ-' || upper(substring(gen_random_uuid()::text from 1 for 8))),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2) B2B Deals (tracks negotiations from listing/request to completion)
CREATE TABLE IF NOT EXISTS public.b2b_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES public.marketplace_listings(id) ON DELETE SET NULL,
  request_id uuid REFERENCES public.b2b_requests(id) ON DELETE SET NULL,
  seller_organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  buyer_organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  deal_number text NOT NULL DEFAULT ('DEAL-' || upper(substring(gen_random_uuid()::text from 1 for 8))),
  title text NOT NULL,
  agreed_price numeric,
  agreed_quantity numeric,
  unit text DEFAULT 'ton',
  currency text DEFAULT 'EGP',
  status text DEFAULT 'negotiating',
  seller_confirmed boolean DEFAULT false,
  buyer_confirmed boolean DEFAULT false,
  notes text,
  delivery_date date,
  delivery_method text,
  payment_terms text,
  seller_rating integer,
  buyer_rating integer,
  seller_review text,
  buyer_review text,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3) B2B Favorites / Watchlist
CREATE TABLE IF NOT EXISTS public.b2b_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  request_id uuid REFERENCES public.b2b_requests(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, listing_id),
  UNIQUE(user_id, request_id)
);

-- 4) B2B Messages (per-deal communication thread)
CREATE TABLE IF NOT EXISTS public.b2b_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid REFERENCES public.b2b_deals(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  sender_organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  sender_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  message_type text DEFAULT 'text',
  attachment_url text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.b2b_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b2b_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b2b_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b2b_messages ENABLE ROW LEVEL SECURITY;

-- b2b_requests: anyone authenticated can read open requests; own org can manage
CREATE POLICY "Anyone can view open b2b requests" ON public.b2b_requests
  FOR SELECT TO authenticated USING (status = 'open' OR organization_id IN (
    SELECT om.organization_id FROM public.organization_members om WHERE om.user_id = auth.uid()
  ));

CREATE POLICY "Org members can insert b2b requests" ON public.b2b_requests
  FOR INSERT TO authenticated WITH CHECK (organization_id IN (
    SELECT om.organization_id FROM public.organization_members om WHERE om.user_id = auth.uid()
  ));

CREATE POLICY "Org members can update own b2b requests" ON public.b2b_requests
  FOR UPDATE TO authenticated USING (organization_id IN (
    SELECT om.organization_id FROM public.organization_members om WHERE om.user_id = auth.uid()
  ));

-- b2b_deals: only seller or buyer org can see/manage
CREATE POLICY "Deal parties can view deals" ON public.b2b_deals
  FOR SELECT TO authenticated USING (
    seller_organization_id IN (SELECT om.organization_id FROM public.organization_members om WHERE om.user_id = auth.uid())
    OR buyer_organization_id IN (SELECT om.organization_id FROM public.organization_members om WHERE om.user_id = auth.uid())
  );

CREATE POLICY "Authenticated can create deals" ON public.b2b_deals
  FOR INSERT TO authenticated WITH CHECK (
    seller_organization_id IN (SELECT om.organization_id FROM public.organization_members om WHERE om.user_id = auth.uid())
    OR buyer_organization_id IN (SELECT om.organization_id FROM public.organization_members om WHERE om.user_id = auth.uid())
  );

CREATE POLICY "Deal parties can update deals" ON public.b2b_deals
  FOR UPDATE TO authenticated USING (
    seller_organization_id IN (SELECT om.organization_id FROM public.organization_members om WHERE om.user_id = auth.uid())
    OR buyer_organization_id IN (SELECT om.organization_id FROM public.organization_members om WHERE om.user_id = auth.uid())
  );

-- b2b_favorites: own user only
CREATE POLICY "Users manage own favorites" ON public.b2b_favorites
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- b2b_messages: deal/listing parties only
CREATE POLICY "Message parties can view messages" ON public.b2b_messages
  FOR SELECT TO authenticated USING (
    sender_user_id = auth.uid()
    OR sender_organization_id IN (SELECT om.organization_id FROM public.organization_members om WHERE om.user_id = auth.uid())
    OR deal_id IN (
      SELECT d.id FROM public.b2b_deals d 
      WHERE d.seller_organization_id IN (SELECT om.organization_id FROM public.organization_members om WHERE om.user_id = auth.uid())
      OR d.buyer_organization_id IN (SELECT om.organization_id FROM public.organization_members om WHERE om.user_id = auth.uid())
    )
  );

CREATE POLICY "Authenticated can send messages" ON public.b2b_messages
  FOR INSERT TO authenticated WITH CHECK (sender_user_id = auth.uid());

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.b2b_messages;
