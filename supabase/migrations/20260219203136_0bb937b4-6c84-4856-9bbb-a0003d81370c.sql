
-- =============================================
-- المرحلة 2: تأمين جداول التسعير
-- =============================================

-- تأمين pricing_rule_templates - تقييد للمصادقين فقط
DROP POLICY IF EXISTS "Anyone can view pricing templates" ON pricing_rule_templates;
DROP POLICY IF EXISTS "Public can view pricing templates" ON pricing_rule_templates;
CREATE POLICY "Authenticated users view pricing templates"
ON pricing_rule_templates FOR SELECT
TO authenticated
USING (true);

-- تأمين revenue_services - تقييد للمصادقين فقط
DROP POLICY IF EXISTS "Anyone can view revenue services" ON revenue_services;
DROP POLICY IF EXISTS "Public can view revenue services" ON revenue_services;
CREATE POLICY "Authenticated users view revenue services"
ON revenue_services FOR SELECT
TO authenticated
USING (true);

-- تأمين stationery_templates - تقييد للمصادقين فقط
DROP POLICY IF EXISTS "Anyone can view stationery templates" ON stationery_templates;
DROP POLICY IF EXISTS "Public can view stationery templates" ON stationery_templates;
CREATE POLICY "Authenticated users view stationery templates"
ON stationery_templates FOR SELECT
TO authenticated
USING (true);
