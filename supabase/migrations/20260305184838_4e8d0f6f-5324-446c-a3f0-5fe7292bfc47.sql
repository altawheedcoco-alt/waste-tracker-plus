
DROP POLICY IF EXISTS "Org members manage drafts" ON public.manual_shipment_drafts;

CREATE POLICY "Org members manage drafts" ON public.manual_shipment_drafts
FOR ALL TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    UNION
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    UNION
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);
