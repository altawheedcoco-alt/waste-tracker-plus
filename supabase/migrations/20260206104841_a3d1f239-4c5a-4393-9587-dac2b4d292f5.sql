-- Drop existing incorrect INSERT policy
DROP POLICY IF EXISTS "Transporters can create receipts" ON public.shipment_receipts;

-- Create corrected INSERT policy using user_id
CREATE POLICY "Transporters can create receipts" 
ON public.shipment_receipts 
FOR INSERT 
TO authenticated
WITH CHECK (
  public.user_belongs_to_org(auth.uid(), transporter_id)
);

-- Also fix SELECT policies to use the helper function
DROP POLICY IF EXISTS "Transporters can view their receipts" ON public.shipment_receipts;
CREATE POLICY "Transporters can view their receipts" 
ON public.shipment_receipts 
FOR SELECT 
TO authenticated
USING (
  public.user_belongs_to_org(auth.uid(), transporter_id)
);

DROP POLICY IF EXISTS "Generators can view their receipts" ON public.shipment_receipts;
CREATE POLICY "Generators can view their receipts" 
ON public.shipment_receipts 
FOR SELECT 
TO authenticated
USING (
  public.user_belongs_to_org(auth.uid(), generator_id)
);

DROP POLICY IF EXISTS "Transporters can update their receipts" ON public.shipment_receipts;
CREATE POLICY "Transporters can update their receipts" 
ON public.shipment_receipts 
FOR UPDATE 
TO authenticated
USING (
  public.user_belongs_to_org(auth.uid(), transporter_id)
);

DROP POLICY IF EXISTS "Generators can confirm receipts" ON public.shipment_receipts;
CREATE POLICY "Generators can confirm receipts" 
ON public.shipment_receipts 
FOR UPDATE 
TO authenticated
USING (
  public.user_belongs_to_org(auth.uid(), generator_id)
);

-- Add admin access policies
CREATE POLICY "Admins can manage all receipts" 
ON public.shipment_receipts 
FOR ALL 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));