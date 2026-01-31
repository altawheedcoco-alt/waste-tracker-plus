-- Add columns for manual organization names when they're not in the system
ALTER TABLE public.shipments 
ADD COLUMN IF NOT EXISTS manual_generator_name TEXT,
ADD COLUMN IF NOT EXISTS manual_recycler_name TEXT,
ADD COLUMN IF NOT EXISTS manual_transporter_name TEXT;

-- Make generator_id nullable to allow manual entries
ALTER TABLE public.shipments 
ALTER COLUMN generator_id DROP NOT NULL;

-- Make recycler_id nullable to allow manual entries  
ALTER TABLE public.shipments 
ALTER COLUMN recycler_id DROP NOT NULL;

-- Add comments for clarity
COMMENT ON COLUMN public.shipments.manual_generator_name IS 'Manual generator name when generator_id is null';
COMMENT ON COLUMN public.shipments.manual_recycler_name IS 'Manual recycler name when recycler_id is null';
COMMENT ON COLUMN public.shipments.manual_transporter_name IS 'Manual transporter name when transporter_id is null';