
-- =============================================
-- 1) نظام مزادات المخلفات (Waste Auctions)
-- =============================================
CREATE TABLE public.waste_auctions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  waste_type TEXT NOT NULL,
  waste_subtype TEXT,
  estimated_quantity NUMERIC NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'ton',
  minimum_price NUMERIC DEFAULT 0,
  current_highest_bid NUMERIC DEFAULT 0,
  buy_now_price NUMERIC,
  auction_type TEXT DEFAULT 'standard', -- standard, reverse, dutch
  status TEXT DEFAULT 'draft', -- draft, pending_approval, active, ended, cancelled, awarded
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ NOT NULL,
  location_text TEXT,
  pickup_deadline TIMESTAMPTZ,
  images TEXT[] DEFAULT '{}',
  quality_grade TEXT, -- A, B, C
  requires_transport BOOLEAN DEFAULT false,
  winner_bid_id UUID,
  platform_commission_rate NUMERIC DEFAULT 0.05,
  admin_notes TEXT,
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.auction_bids (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auction_id UUID NOT NULL REFERENCES public.waste_auctions(id) ON DELETE CASCADE,
  bidder_organization_id UUID NOT NULL REFERENCES public.organizations(id),
  bidder_user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  notes TEXT,
  can_transport BOOLEAN DEFAULT false,
  proposed_pickup_date TIMESTAMPTZ,
  status TEXT DEFAULT 'active', -- active, outbid, won, withdrawn
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.waste_auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_bids ENABLE ROW LEVEL SECURITY;

-- Auctions visible to all authenticated users when active
CREATE POLICY "Active auctions visible to all" ON public.waste_auctions
  FOR SELECT USING (status = 'active' OR organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Org members manage own auctions" ON public.waste_auctions
  FOR ALL USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Bids visible to auction owner and bidder" ON public.auction_bids
  FOR SELECT USING (
    bidder_organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    OR auction_id IN (SELECT id FROM public.waste_auctions WHERE organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can place bids" ON public.auction_bids
  FOR INSERT WITH CHECK (bidder_organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

-- Enable realtime for bids
ALTER PUBLICATION supabase_realtime ADD TABLE public.auction_bids;

-- =============================================
-- 2) نظام التقييم والمراجعات (Reviews & Ratings)
-- =============================================
CREATE TABLE public.partner_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reviewer_organization_id UUID NOT NULL REFERENCES public.organizations(id),
  reviewed_organization_id UUID NOT NULL REFERENCES public.organizations(id),
  reviewer_user_id UUID NOT NULL,
  shipment_id UUID REFERENCES public.shipments(id),
  
  overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  punctuality_rating INTEGER CHECK (punctuality_rating BETWEEN 1 AND 5),
  quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
  communication_rating INTEGER CHECK (communication_rating BETWEEN 1 AND 5),
  compliance_rating INTEGER CHECK (compliance_rating BETWEEN 1 AND 5),
  
  review_text TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'published', -- published, hidden, flagged
  
  -- Owner response
  response_text TEXT,
  response_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_review_per_shipment UNIQUE (reviewer_organization_id, reviewed_organization_id, shipment_id)
);

ALTER TABLE public.partner_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published reviews visible to all" ON public.partner_reviews
  FOR SELECT USING (status = 'published' OR reviewer_organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ) OR reviewed_organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can create reviews" ON public.partner_reviews
  FOR INSERT WITH CHECK (reviewer_organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update own reviews" ON public.partner_reviews
  FOR UPDATE USING (
    reviewer_organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    OR reviewed_organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

-- =============================================
-- 3) سوق المعدات المستعملة (Equipment Marketplace)
-- =============================================
CREATE TABLE public.equipment_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  seller_user_id UUID NOT NULL,
  
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- compactor, shredder, baler, truck, container, scale, conveyor, other
  condition TEXT DEFAULT 'used', -- new, like_new, used, needs_repair
  brand TEXT,
  model TEXT,
  year_manufactured INTEGER,
  
  price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'EGP',
  is_negotiable BOOLEAN DEFAULT true,
  
  images TEXT[] DEFAULT '{}',
  video_url TEXT,
  location_text TEXT,
  
  status TEXT DEFAULT 'pending_review', -- pending_review, active, sold, expired, rejected
  views_count INTEGER DEFAULT 0,
  inquiries_count INTEGER DEFAULT 0,
  
  platform_commission_rate NUMERIC DEFAULT 0.04,
  featured BOOLEAN DEFAULT false,
  featured_until TIMESTAMPTZ,
  
  admin_notes TEXT,
  approved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.equipment_inquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.equipment_listings(id) ON DELETE CASCADE,
  inquirer_organization_id UUID NOT NULL REFERENCES public.organizations(id),
  inquirer_user_id UUID NOT NULL,
  message TEXT NOT NULL,
  contact_phone TEXT,
  offer_amount NUMERIC,
  status TEXT DEFAULT 'pending', -- pending, replied, accepted, rejected
  seller_reply TEXT,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.equipment_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active listings visible to all" ON public.equipment_listings
  FOR SELECT USING (status = 'active' OR organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Org manages own listings" ON public.equipment_listings
  FOR ALL USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Inquiries visible to seller and inquirer" ON public.equipment_inquiries
  FOR SELECT USING (
    inquirer_organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    OR listing_id IN (SELECT id FROM public.equipment_listings WHERE organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can create inquiries" ON public.equipment_inquiries
  FOR INSERT WITH CHECK (inquirer_organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Seller can update inquiries" ON public.equipment_inquiries
  FOR UPDATE USING (listing_id IN (SELECT id FROM public.equipment_listings WHERE organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )));

-- =============================================
-- 4) بوابة العملاء ذاتية الخدمة (White-Label Portal)
-- =============================================
CREATE TABLE public.client_portals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  
  portal_name TEXT NOT NULL,
  portal_slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#1a365d',
  secondary_color TEXT DEFAULT '#16a34a',
  welcome_message TEXT DEFAULT 'مرحباً بك في بوابة العملاء',
  
  features JSONB DEFAULT '["track_shipments","view_invoices","view_certificates"]'::jsonb,
  
  is_active BOOLEAN DEFAULT true,
  requires_auth BOOLEAN DEFAULT true,
  
  plan_tier TEXT DEFAULT 'basic', -- basic, professional, enterprise  
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.portal_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portal_id UUID NOT NULL REFERENCES public.client_portals(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  access_code TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.client_portals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org manages own portals" ON public.client_portals
  FOR ALL USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Org manages own portal clients" ON public.portal_clients
  FOR ALL USING (portal_id IN (
    SELECT id FROM public.client_portals WHERE organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  ));

-- Public read for portal by slug (for client access)
CREATE POLICY "Public can read active portals by slug" ON public.client_portals
  FOR SELECT USING (is_active = true);
