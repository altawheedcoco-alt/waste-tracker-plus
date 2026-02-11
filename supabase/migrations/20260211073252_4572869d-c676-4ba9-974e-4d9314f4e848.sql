
-- Add lab sampling and processing path columns to disposal_operations
ALTER TABLE public.disposal_operations 
ADD COLUMN IF NOT EXISTS lab_sample_taken boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS lab_sample_result text,
ADD COLUMN IF NOT EXISTS lab_analysis_date timestamptz,
ADD COLUMN IF NOT EXISTS processing_path text, -- 'incineration', 'landfill', 'chemical_neutralization'
ADD COLUMN IF NOT EXISTS incineration_temperature numeric,
ADD COLUMN IF NOT EXISTS emissions_reading jsonb,
ADD COLUMN IF NOT EXISTS landfill_cell_id text,
ADD COLUMN IF NOT EXISTS weight_ticket_number text,
ADD COLUMN IF NOT EXISTS weight_gross numeric,
ADD COLUMN IF NOT EXISTS weight_tare numeric,
ADD COLUMN IF NOT EXISTS weight_net numeric,
ADD COLUMN IF NOT EXISTS verified_by text,
ADD COLUMN IF NOT EXISTS verified_at timestamptz,
ADD COLUMN IF NOT EXISTS processing_started_at timestamptz,
ADD COLUMN IF NOT EXISTS processing_completed_at timestamptz,
ADD COLUMN IF NOT EXISTS operation_number text;

-- Add landfill cells tracking to disposal_facilities
ALTER TABLE public.disposal_facilities
ADD COLUMN IF NOT EXISTS landfill_cells jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS environmental_alerts jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS emission_thresholds jsonb DEFAULT '{"max_temperature": 1200, "max_co2_ppm": 500}'::jsonb;

-- Generate operation numbers for existing records
UPDATE public.disposal_operations 
SET operation_number = 'OP-' || to_char(created_at, 'YYYYMMDD') || '-' || substring(id::text, 1, 4)
WHERE operation_number IS NULL;
