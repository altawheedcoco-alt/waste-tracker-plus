-- Create quick driver links table
CREATE TABLE IF NOT EXISTS public.driver_quick_links (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL,
    driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
    token TEXT NOT NULL UNIQUE,
    title TEXT DEFAULT 'رابط سائق سريع',
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID,
    
    -- Preset fields for driver info
    preset_driver_name TEXT,
    preset_phone TEXT,
    preset_vehicle_type TEXT,
    preset_plate_number TEXT,
    preset_license_number TEXT,
    preset_notes TEXT,
    
    -- Control fields
    allow_name_edit BOOLEAN DEFAULT true,
    allow_phone_edit BOOLEAN DEFAULT true,
    allow_vehicle_edit BOOLEAN DEFAULT true,
    is_for_registration BOOLEAN DEFAULT false,
    
    -- Enhanced fields
    is_pinned BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

-- Enable RLS
ALTER TABLE public.driver_quick_links ENABLE ROW LEVEL SECURITY;

-- Create policies for driver_quick_links
CREATE POLICY "Organizations can view their own driver links"
ON public.driver_quick_links
FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
);

CREATE POLICY "Organizations can create driver links"
ON public.driver_quick_links
FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
);

CREATE POLICY "Organizations can update their driver links"
ON public.driver_quick_links
FOR UPDATE
USING (
    organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
);

CREATE POLICY "Organizations can delete their driver links"
ON public.driver_quick_links
FOR DELETE
USING (
    organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
);

-- Allow anonymous access for public link access (by token)
CREATE POLICY "Public can view active links by token"
ON public.driver_quick_links
FOR SELECT
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Create index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_driver_quick_links_token ON public.driver_quick_links(token);
CREATE INDEX IF NOT EXISTS idx_driver_quick_links_org ON public.driver_quick_links(organization_id);