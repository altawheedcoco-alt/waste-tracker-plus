-- Add waste_state column to shipments table
ALTER TABLE public.shipments 
ADD COLUMN waste_state VARCHAR(20) DEFAULT 'solid' CHECK (waste_state IN ('solid', 'liquid', 'semi_solid', 'gas'));