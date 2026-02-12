-- Add declaration_type to distinguish generator handover vs transporter delivery
ALTER TABLE public.delivery_declarations 
ADD COLUMN IF NOT EXISTS declaration_type text NOT NULL DEFAULT 'transporter_delivery';

-- Add comment for clarity
COMMENT ON COLUMN public.delivery_declarations.declaration_type IS 'generator_handover = المولد يسلم للناقل, transporter_delivery = الناقل يسلم للمدوّر';

-- Create index for faster lookups by type
CREATE INDEX IF NOT EXISTS idx_delivery_declarations_type 
ON public.delivery_declarations(shipment_id, declaration_type);

-- Update existing RLS to allow generators to insert handover declarations
DROP POLICY IF EXISTS "Users can insert delivery declarations" ON public.delivery_declarations;
CREATE POLICY "Users can insert delivery declarations"
ON public.delivery_declarations FOR INSERT
TO authenticated
WITH CHECK (
  declared_by_user_id = auth.uid()
  AND declared_by_organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  )
);