-- Add transporter documents visibility control to generator
ALTER TABLE public.organization_auto_actions 
ADD COLUMN IF NOT EXISTS transporter_docs_visible_to_generator boolean NOT NULL DEFAULT true;

-- Update existing rows
UPDATE public.organization_auto_actions SET transporter_docs_visible_to_generator = true WHERE transporter_docs_visible_to_generator IS NULL;