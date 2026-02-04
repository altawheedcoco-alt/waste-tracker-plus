-- Create saved_locations table for storing favorite/frequently used locations
CREATE TABLE public.saved_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id),
  name TEXT NOT NULL,
  name_en TEXT,
  address TEXT NOT NULL,
  city TEXT,
  governorate TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  location_type TEXT DEFAULT 'custom',
  category TEXT DEFAULT 'other',
  phone TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for faster queries
CREATE INDEX idx_saved_locations_org ON public.saved_locations(organization_id);
CREATE INDEX idx_saved_locations_name ON public.saved_locations USING gin(to_tsvector('arabic', name));
CREATE INDEX idx_saved_locations_coords ON public.saved_locations(latitude, longitude);
CREATE INDEX idx_saved_locations_type ON public.saved_locations(location_type);

-- Enable RLS
ALTER TABLE public.saved_locations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their organization's saved locations
CREATE POLICY "Users can view organization saved locations"
ON public.saved_locations
FOR SELECT
USING (
  organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() AND is_active = true)
  OR public.has_role(auth.uid(), 'admin')
);

-- Policy: Users can create locations for their organization
CREATE POLICY "Users can create organization saved locations"
ON public.saved_locations
FOR INSERT
WITH CHECK (
  organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() AND is_active = true)
);

-- Policy: Users can update their organization's locations
CREATE POLICY "Users can update organization saved locations"
ON public.saved_locations
FOR UPDATE
USING (
  organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() AND is_active = true)
);

-- Policy: Users can delete their organization's locations
CREATE POLICY "Users can delete organization saved locations"
ON public.saved_locations
FOR DELETE
USING (
  organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() AND is_active = true)
);

-- Trigger for updated_at
CREATE TRIGGER update_saved_locations_updated_at
BEFORE UPDATE ON public.saved_locations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-save location from shipment
CREATE OR REPLACE FUNCTION public.auto_save_shipment_locations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_org_id UUID;
  v_profile_id UUID;
BEGIN
  -- Get the transporter's organization and profile
  SELECT p.organization_id, p.id INTO v_org_id, v_profile_id
  FROM profiles p
  WHERE p.id = NEW.created_by;

  -- Only proceed if we have valid org
  IF v_org_id IS NOT NULL THEN
    -- Save pickup location if coordinates exist
    IF NEW.pickup_latitude IS NOT NULL AND NEW.pickup_longitude IS NOT NULL THEN
      INSERT INTO saved_locations (
        organization_id, created_by, name, address, city,
        latitude, longitude, location_type, source
      )
      SELECT 
        v_org_id, v_profile_id, 
        COALESCE(NEW.pickup_address, 'موقع استلام'),
        NEW.pickup_address,
        NEW.pickup_city,
        NEW.pickup_latitude,
        NEW.pickup_longitude,
        'pickup',
        'shipment'
      WHERE NOT EXISTS (
        SELECT 1 FROM saved_locations 
        WHERE organization_id = v_org_id
        AND ABS(latitude - NEW.pickup_latitude) < 0.0001
        AND ABS(longitude - NEW.pickup_longitude) < 0.0001
      );
    END IF;

    -- Save delivery location if coordinates exist
    IF NEW.delivery_latitude IS NOT NULL AND NEW.delivery_longitude IS NOT NULL THEN
      INSERT INTO saved_locations (
        organization_id, created_by, name, address, city,
        latitude, longitude, location_type, source
      )
      SELECT 
        v_org_id, v_profile_id, 
        COALESCE(NEW.delivery_address, 'موقع تسليم'),
        NEW.delivery_address,
        NEW.delivery_city,
        NEW.delivery_latitude,
        NEW.delivery_longitude,
        'delivery',
        'shipment'
      WHERE NOT EXISTS (
        SELECT 1 FROM saved_locations 
        WHERE organization_id = v_org_id
        AND ABS(latitude - NEW.delivery_latitude) < 0.0001
        AND ABS(longitude - NEW.delivery_longitude) < 0.0001
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger to auto-save on shipment creation
CREATE TRIGGER auto_save_locations_on_shipment
AFTER INSERT ON public.shipments
FOR EACH ROW
EXECUTE FUNCTION public.auto_save_shipment_locations();