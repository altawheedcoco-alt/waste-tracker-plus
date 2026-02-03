-- Create industrial facilities table
CREATE TABLE public.industrial_facilities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  facility_type TEXT NOT NULL DEFAULT 'factory',
  address TEXT,
  city TEXT,
  governorate TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  osm_id TEXT,
  tags JSONB,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(osm_id)
);

-- Create index for geospatial queries
CREATE INDEX idx_industrial_facilities_coords ON public.industrial_facilities (latitude, longitude);
CREATE INDEX idx_industrial_facilities_type ON public.industrial_facilities (facility_type);
CREATE INDEX idx_industrial_facilities_city ON public.industrial_facilities (city);

-- Enable RLS
ALTER TABLE public.industrial_facilities ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read facilities (public data)
CREATE POLICY "Anyone can view industrial facilities"
ON public.industrial_facilities
FOR SELECT
USING (true);

-- Allow authenticated users to insert
CREATE POLICY "Authenticated users can insert facilities"
ON public.industrial_facilities
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow admins to update/delete
CREATE POLICY "Admins can update facilities"
ON public.industrial_facilities
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete facilities"
ON public.industrial_facilities
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_industrial_facilities_updated_at
BEFORE UPDATE ON public.industrial_facilities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.industrial_facilities;