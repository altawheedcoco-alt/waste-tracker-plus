-- Add org-level default for driver declaration visibility to generator
ALTER TABLE public.organization_auto_actions 
ADD COLUMN IF NOT EXISTS driver_declaration_visible_to_generator boolean NOT NULL DEFAULT true;

-- Add per-driver override (null = use org default)
ALTER TABLE public.drivers 
ADD COLUMN IF NOT EXISTS declaration_visible_to_generator boolean DEFAULT NULL;

-- Update all existing rows to have the default
UPDATE public.organization_auto_actions SET driver_declaration_visible_to_generator = true WHERE driver_declaration_visible_to_generator IS NULL;