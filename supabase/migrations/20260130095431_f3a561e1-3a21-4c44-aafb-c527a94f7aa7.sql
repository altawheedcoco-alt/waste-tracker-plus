-- Create organization_locations table to store multiple addresses for each organization
CREATE TABLE public.organization_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  location_name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100),
  region VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

-- Enable RLS
ALTER TABLE public.organization_locations ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow users to view locations of organizations they work with (from shipments)
CREATE POLICY "Users can view locations of partner organizations"
ON public.organization_locations
FOR SELECT
USING (
  organization_id IN (
    SELECT generator_id FROM shipments WHERE transporter_id = get_user_org_id_safe(auth.uid())
    UNION
    SELECT recycler_id FROM shipments WHERE transporter_id = get_user_org_id_safe(auth.uid())
    UNION
    SELECT transporter_id FROM shipments WHERE generator_id = get_user_org_id_safe(auth.uid())
    UNION
    SELECT recycler_id FROM shipments WHERE generator_id = get_user_org_id_safe(auth.uid())
    UNION
    SELECT generator_id FROM shipments WHERE recycler_id = get_user_org_id_safe(auth.uid())
    UNION
    SELECT transporter_id FROM shipments WHERE recycler_id = get_user_org_id_safe(auth.uid())
  )
  OR organization_id = get_user_org_id_safe(auth.uid())
  OR has_role(auth.uid(), 'admin')
);

-- Allow users to insert locations for their own organization
CREATE POLICY "Users can insert locations for their organization"
ON public.organization_locations
FOR INSERT
WITH CHECK (
  organization_id = get_user_org_id_safe(auth.uid())
  OR has_role(auth.uid(), 'admin')
);

-- Allow users to update locations for their own organization
CREATE POLICY "Users can update their organization locations"
ON public.organization_locations
FOR UPDATE
USING (
  organization_id = get_user_org_id_safe(auth.uid())
  OR has_role(auth.uid(), 'admin')
);

-- Allow users to delete locations for their own organization
CREATE POLICY "Users can delete their organization locations"
ON public.organization_locations
FOR DELETE
USING (
  organization_id = get_user_org_id_safe(auth.uid())
  OR has_role(auth.uid(), 'admin')
);

-- Create trigger for updated_at
CREATE TRIGGER update_organization_locations_updated_at
BEFORE UPDATE ON public.organization_locations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_organization_locations_org_id ON public.organization_locations(organization_id);
CREATE INDEX idx_organization_locations_active ON public.organization_locations(is_active) WHERE is_active = true;