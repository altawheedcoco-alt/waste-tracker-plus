-- حذف التكرارات في triggers الإشعارات
-- حذف trigger مكرر لإنشاء الشحنات
DROP TRIGGER IF EXISTS trigger_new_shipment_notification ON public.shipments;

-- حذف trigger مكرر لتغيير حالة الشحنات  
DROP TRIGGER IF EXISTS trigger_shipment_status_notification ON public.shipments;

-- حذف trigger إضافي يسبب إشعارات مكررة أيضاً
DROP TRIGGER IF EXISTS on_shipment_created ON public.shipments;

-- حذف الدالة المكررة إذا لم تكن مستخدمة
DROP FUNCTION IF EXISTS notify_shipment_created();