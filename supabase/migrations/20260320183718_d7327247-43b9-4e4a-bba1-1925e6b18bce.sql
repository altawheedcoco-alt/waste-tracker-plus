
-- Add shipment creation control for generators (default: disabled)
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS can_create_shipments boolean NOT NULL DEFAULT false;

-- Admin can update this field
CREATE POLICY "Admins can update can_create_shipments"
ON public.organizations
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_sovereign_roles
    WHERE user_id = auth.uid() AND is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_sovereign_roles
    WHERE user_id = auth.uid() AND is_active = true
  )
);
