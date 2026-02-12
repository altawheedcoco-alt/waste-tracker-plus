
-- Add rejection and status fields to delivery_declarations
ALTER TABLE public.delivery_declarations 
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS rejected_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS rejected_by text,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS auto_generated boolean NOT NULL DEFAULT false;

-- Add recycler_declaration type support (already has generator_handover and transporter_delivery)
-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_delivery_declarations_status ON public.delivery_declarations(status);
CREATE INDEX IF NOT EXISTS idx_delivery_declarations_type ON public.delivery_declarations(declaration_type);
