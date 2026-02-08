-- تحديث سياسة رؤية المنظمات
DROP POLICY IF EXISTS "Users can view all organizations" ON organizations;
DROP POLICY IF EXISTS "Anyone can view organizations" ON organizations;
DROP POLICY IF EXISTS "Organizations are viewable by authenticated users" ON organizations;
DROP POLICY IF EXISTS "Users can view own org and partners" ON organizations;

CREATE POLICY "Users can view own org and partners"
ON organizations FOR SELECT
TO authenticated
USING (
  public.can_view_organization(id)
);

-- تحديث سياسة رؤية الشحنات
DROP POLICY IF EXISTS "Users can view shipments" ON shipments;
DROP POLICY IF EXISTS "Authenticated users can view all shipments" ON shipments;
DROP POLICY IF EXISTS "Users can view all shipments" ON shipments;
DROP POLICY IF EXISTS "Users can view shipments with partners only" ON shipments;

CREATE POLICY "Users can view shipments with partners only"
ON shipments FOR SELECT
TO authenticated
USING (
  public.can_view_shipment(generator_id, transporter_id, recycler_id)
);