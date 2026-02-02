
-- Create partner price items table for each organization's pricing with partners
CREATE TABLE public.partner_price_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  partner_organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  partner_name VARCHAR(255),
  item_code VARCHAR(50),
  item_name VARCHAR(255) NOT NULL,
  item_description TEXT,
  waste_type VARCHAR(255),
  unit VARCHAR(50) DEFAULT 'kg',
  unit_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'EGP',
  price_type VARCHAR(50) DEFAULT 'fixed' CHECK (price_type IN ('fixed', 'variable', 'negotiable')),
  min_quantity DECIMAL(12, 2),
  max_quantity DECIMAL(12, 2),
  effective_from DATE,
  effective_to DATE,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create partner account settings for custom configurations
CREATE TABLE public.partner_account_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  partner_organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  credit_limit DECIMAL(12, 2) DEFAULT 0,
  payment_terms_days INTEGER DEFAULT 30,
  discount_percentage DECIMAL(5, 2) DEFAULT 0,
  tax_rate DECIMAL(5, 2) DEFAULT 14,
  account_status VARCHAR(50) DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'closed')),
  billing_cycle VARCHAR(50) DEFAULT 'monthly',
  auto_invoice BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, partner_organization_id)
);

-- Enable RLS
ALTER TABLE public.partner_price_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_account_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for partner_price_items
CREATE POLICY "Organizations can view their own price items"
ON public.partner_price_items FOR SELECT
USING (
  organization_id IN (
    SELECT id FROM public.organizations WHERE id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "Organizations can manage their own price items"
ON public.partner_price_items FOR ALL
USING (
  organization_id IN (
    SELECT id FROM public.organizations WHERE id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

-- RLS Policies for partner_account_settings
CREATE POLICY "Organizations can view their partner settings"
ON public.partner_account_settings FOR SELECT
USING (
  organization_id IN (
    SELECT id FROM public.organizations WHERE id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "Organizations can manage their partner settings"
ON public.partner_account_settings FOR ALL
USING (
  organization_id IN (
    SELECT id FROM public.organizations WHERE id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

-- Generate item code trigger
CREATE OR REPLACE FUNCTION public.generate_item_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.item_code IS NULL OR NEW.item_code = '' THEN
    NEW.item_code := 'ITM-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_item_code
BEFORE INSERT ON public.partner_price_items
FOR EACH ROW EXECUTE FUNCTION public.generate_item_code();

-- Update timestamp trigger
CREATE TRIGGER update_partner_price_items_updated_at
BEFORE UPDATE ON public.partner_price_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_partner_account_settings_updated_at
BEFORE UPDATE ON public.partner_account_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_partner_price_items_org ON public.partner_price_items(organization_id);
CREATE INDEX idx_partner_price_items_partner ON public.partner_price_items(partner_organization_id);
CREATE INDEX idx_partner_account_settings_org ON public.partner_account_settings(organization_id);
CREATE INDEX idx_partner_account_settings_partner ON public.partner_account_settings(partner_organization_id);
