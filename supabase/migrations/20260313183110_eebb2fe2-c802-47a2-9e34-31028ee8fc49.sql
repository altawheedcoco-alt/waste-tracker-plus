-- Add visible_to_generator flag to delivery_declarations for driver declarations
ALTER TABLE public.delivery_declarations 
ADD COLUMN IF NOT EXISTS visible_to_generator boolean DEFAULT true;