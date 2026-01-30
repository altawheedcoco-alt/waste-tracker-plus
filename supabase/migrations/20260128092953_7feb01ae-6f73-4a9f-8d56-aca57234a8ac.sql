-- إصلاح سياسات RLS المتساهلة

-- حذف السياسات القديمة المتساهلة
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Logs insertable by authenticated users" ON public.shipment_logs;

-- سياسة إشعارات أكثر تحديداً - فقط للشحنات المرتبطة
CREATE POLICY "Insert notifications for related shipments"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    -- يمكن إضافة إشعار فقط إذا كان المستخدم مرتبط بالشحنة
    shipment_id IS NULL
    OR shipment_id IN (
      SELECT id FROM public.shipments
      WHERE generator_id = public.get_user_organization_id(auth.uid())
         OR transporter_id = public.get_user_organization_id(auth.uid())
         OR recycler_id = public.get_user_organization_id(auth.uid())
    )
  );

-- سياسة سجلات الشحنات - فقط للشحنات المرتبطة
CREATE POLICY "Insert logs for related shipments"
  ON public.shipment_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    shipment_id IN (
      SELECT id FROM public.shipments
      WHERE generator_id = public.get_user_organization_id(auth.uid())
         OR transporter_id = public.get_user_organization_id(auth.uid())
         OR recycler_id = public.get_user_organization_id(auth.uid())
    )
  );