-- Allow regulators to view all shipments for chain of custody oversight
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Regulators can view all shipments' 
    AND tablename = 'shipments'
  ) THEN
    CREATE POLICY "Regulators can view all shipments"
    ON public.shipments
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM organizations o
        WHERE o.id = get_user_org_id_safe(auth.uid())
        AND o.organization_type = 'regulator'
      )
    );
  END IF;
END $$;