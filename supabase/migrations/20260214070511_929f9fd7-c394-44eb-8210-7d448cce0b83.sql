
-- Waste Exchange Listings (عروض بورصة المخلفات)
CREATE TABLE public.waste_exchange_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  listing_type TEXT NOT NULL CHECK (listing_type IN ('sell', 'buy')),
  waste_type TEXT NOT NULL,
  waste_subtype TEXT,
  waste_category TEXT DEFAULT 'non_hazardous',
  title TEXT NOT NULL,
  description TEXT,
  quantity_tons NUMERIC NOT NULL,
  min_quantity_tons NUMERIC,
  price_per_ton NUMERIC,
  currency TEXT DEFAULT 'EGP',
  price_negotiable BOOLEAN DEFAULT true,
  location_city TEXT,
  location_governorate TEXT,
  pickup_available BOOLEAN DEFAULT false,
  delivery_available BOOLEAN DEFAULT false,
  available_from DATE DEFAULT CURRENT_DATE,
  available_until DATE,
  quality_grade TEXT CHECK (quality_grade IN ('premium', 'standard', 'economy', 'mixed')),
  photo_urls TEXT[],
  lab_report_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'sold', 'expired', 'cancelled')),
  views_count INTEGER DEFAULT 0,
  bids_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Waste Exchange Bids
CREATE TABLE public.waste_exchange_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.waste_exchange_listings(id) ON DELETE CASCADE,
  bidder_organization_id UUID NOT NULL REFERENCES public.organizations(id),
  bid_price_per_ton NUMERIC NOT NULL,
  bid_quantity_tons NUMERIC NOT NULL,
  currency TEXT DEFAULT 'EGP',
  message TEXT,
  delivery_terms TEXT,
  valid_until DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn', 'expired', 'counter_offered')),
  counter_offer_price NUMERIC,
  counter_offer_notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Waste Exchange Price Index
CREATE TABLE public.waste_exchange_price_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  waste_type TEXT NOT NULL,
  waste_subtype TEXT,
  region TEXT DEFAULT 'egypt',
  avg_price_per_ton NUMERIC NOT NULL,
  min_price NUMERIC,
  max_price NUMERIC,
  total_volume_tons NUMERIC,
  total_transactions INTEGER DEFAULT 0,
  price_date DATE DEFAULT CURRENT_DATE,
  trend TEXT DEFAULT 'stable' CHECK (trend IN ('rising', 'falling', 'stable')),
  change_percent NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'EGP',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Waste Exchange Transactions
CREATE TABLE public.waste_exchange_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES public.waste_exchange_listings(id),
  bid_id UUID REFERENCES public.waste_exchange_bids(id),
  seller_organization_id UUID NOT NULL REFERENCES public.organizations(id),
  buyer_organization_id UUID NOT NULL REFERENCES public.organizations(id),
  waste_type TEXT NOT NULL,
  waste_subtype TEXT,
  agreed_price_per_ton NUMERIC NOT NULL,
  agreed_quantity_tons NUMERIC NOT NULL,
  total_value NUMERIC NOT NULL,
  currency TEXT DEFAULT 'EGP',
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'overdue')),
  delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'in_transit', 'delivered', 'confirmed')),
  shipment_id UUID REFERENCES public.shipments(id),
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Watchlist
CREATE TABLE public.waste_exchange_watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.waste_exchange_listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, listing_id)
);

-- Enable RLS
ALTER TABLE public.waste_exchange_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waste_exchange_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waste_exchange_price_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waste_exchange_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waste_exchange_watchlist ENABLE ROW LEVEL SECURITY;

-- RLS: Listings
CREATE POLICY "Authenticated users can view active listings"
ON public.waste_exchange_listings FOR SELECT TO authenticated
USING (status = 'active' OR organization_id IN (
  SELECT uo.organization_id FROM public.user_organizations uo WHERE uo.user_id = auth.uid()
) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Org members can insert listings"
ON public.waste_exchange_listings FOR INSERT TO authenticated
WITH CHECK (organization_id IN (
  SELECT uo.organization_id FROM public.user_organizations uo WHERE uo.user_id = auth.uid()
));

CREATE POLICY "Org members can update own listings"
ON public.waste_exchange_listings FOR UPDATE TO authenticated
USING (organization_id IN (
  SELECT uo.organization_id FROM public.user_organizations uo WHERE uo.user_id = auth.uid()
) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Org members can delete own listings"
ON public.waste_exchange_listings FOR DELETE TO authenticated
USING (organization_id IN (
  SELECT uo.organization_id FROM public.user_organizations uo WHERE uo.user_id = auth.uid()
));

-- RLS: Bids
CREATE POLICY "Listing owner and bidder can view bids"
ON public.waste_exchange_bids FOR SELECT TO authenticated
USING (
  bidder_organization_id IN (SELECT uo.organization_id FROM public.user_organizations uo WHERE uo.user_id = auth.uid())
  OR listing_id IN (
    SELECT l.id FROM public.waste_exchange_listings l 
    JOIN public.user_organizations uo ON uo.organization_id = l.organization_id 
    WHERE uo.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Org members can create bids"
ON public.waste_exchange_bids FOR INSERT TO authenticated
WITH CHECK (bidder_organization_id IN (
  SELECT uo.organization_id FROM public.user_organizations uo WHERE uo.user_id = auth.uid()
));

CREATE POLICY "Bidder or listing owner can update bids"
ON public.waste_exchange_bids FOR UPDATE TO authenticated
USING (
  bidder_organization_id IN (SELECT uo.organization_id FROM public.user_organizations uo WHERE uo.user_id = auth.uid())
  OR listing_id IN (
    SELECT l.id FROM public.waste_exchange_listings l 
    JOIN public.user_organizations uo ON uo.organization_id = l.organization_id 
    WHERE uo.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- RLS: Price Index
CREATE POLICY "All authenticated can view price index"
ON public.waste_exchange_price_index FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admin can manage price index"
ON public.waste_exchange_price_index FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS: Transactions
CREATE POLICY "Transaction parties can view"
ON public.waste_exchange_transactions FOR SELECT TO authenticated
USING (
  seller_organization_id IN (SELECT uo.organization_id FROM public.user_organizations uo WHERE uo.user_id = auth.uid())
  OR buyer_organization_id IN (SELECT uo.organization_id FROM public.user_organizations uo WHERE uo.user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Authenticated can insert transactions"
ON public.waste_exchange_transactions FOR INSERT TO authenticated
WITH CHECK (
  seller_organization_id IN (SELECT uo.organization_id FROM public.user_organizations uo WHERE uo.user_id = auth.uid())
  OR buyer_organization_id IN (SELECT uo.organization_id FROM public.user_organizations uo WHERE uo.user_id = auth.uid())
);

CREATE POLICY "Transaction parties can update"
ON public.waste_exchange_transactions FOR UPDATE TO authenticated
USING (
  seller_organization_id IN (SELECT uo.organization_id FROM public.user_organizations uo WHERE uo.user_id = auth.uid())
  OR buyer_organization_id IN (SELECT uo.organization_id FROM public.user_organizations uo WHERE uo.user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

-- RLS: Watchlist
CREATE POLICY "Users can manage own watchlist"
ON public.waste_exchange_watchlist FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Indexes
CREATE INDEX idx_we_listings_org ON public.waste_exchange_listings(organization_id);
CREATE INDEX idx_we_listings_status ON public.waste_exchange_listings(status);
CREATE INDEX idx_we_listings_waste_type ON public.waste_exchange_listings(waste_type);
CREATE INDEX idx_we_bids_listing ON public.waste_exchange_bids(listing_id);
CREATE INDEX idx_we_bids_bidder ON public.waste_exchange_bids(bidder_organization_id);
CREATE INDEX idx_we_price_index_type_date ON public.waste_exchange_price_index(waste_type, price_date);
CREATE INDEX idx_we_transactions_seller ON public.waste_exchange_transactions(seller_organization_id);
CREATE INDEX idx_we_transactions_buyer ON public.waste_exchange_transactions(buyer_organization_id);

-- Updated_at triggers
CREATE TRIGGER update_waste_exchange_listings_updated_at
BEFORE UPDATE ON public.waste_exchange_listings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_waste_exchange_bids_updated_at
BEFORE UPDATE ON public.waste_exchange_bids
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_waste_exchange_transactions_updated_at
BEFORE UPDATE ON public.waste_exchange_transactions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.waste_exchange_listings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.waste_exchange_bids;
