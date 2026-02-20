
-- جدول عروض الشحنات للسائقين (نظام شبيه DiDi)
CREATE TABLE public.driver_shipment_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  offered_by UUID REFERENCES public.profiles(id), -- من أرسل العرض (مدير النقل)
  organization_id UUID REFERENCES public.organizations(id),
  
  -- التسعير
  system_price NUMERIC DEFAULT 0, -- السعر المحسوب تلقائياً
  offered_price NUMERIC DEFAULT 0, -- السعر المعروض على السائق
  counter_price NUMERIC, -- السعر المقترح من السائق
  final_price NUMERIC, -- السعر النهائي المتفق عليه
  
  -- الحالة
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'counter_offered', 'expired', 'auto_accepted')),
  
  -- التوقيت
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 seconds'),
  responded_at TIMESTAMPTZ,
  auto_accepted BOOLEAN DEFAULT false,
  
  -- ملاحظات
  driver_notes TEXT,
  rejection_reason TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- فهارس للأداء
CREATE INDEX idx_driver_offers_driver ON public.driver_shipment_offers(driver_id, status);
CREATE INDEX idx_driver_offers_shipment ON public.driver_shipment_offers(shipment_id);
CREATE INDEX idx_driver_offers_expires ON public.driver_shipment_offers(expires_at) WHERE status = 'pending';

-- تفعيل RLS
ALTER TABLE public.driver_shipment_offers ENABLE ROW LEVEL SECURITY;

-- السائق يرى عروضه فقط
CREATE POLICY "Drivers can view their own offers"
ON public.driver_shipment_offers FOR SELECT
TO authenticated
USING (
  driver_id = auth.uid()
  OR offered_by = auth.uid()
  OR organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- السائق يمكنه تحديث عروضه (قبول/رفض/عرض مقابل)
CREATE POLICY "Drivers can update their own offers"
ON public.driver_shipment_offers FOR UPDATE
TO authenticated
USING (driver_id = auth.uid())
WITH CHECK (driver_id = auth.uid());

-- مديرو النقل يمكنهم إنشاء عروض
CREATE POLICY "Org members can create offers"
ON public.driver_shipment_offers FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- تحديث updated_at تلقائياً
CREATE TRIGGER update_driver_offers_updated_at
BEFORE UPDATE ON public.driver_shipment_offers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- إشعار السائق عند إنشاء عرض جديد
CREATE OR REPLACE FUNCTION public.notify_driver_new_offer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    action_url,
    metadata
  ) VALUES (
    NEW.driver_id,
    'طلب شحنة جديد 🚛',
    'لديك طلب شحنة جديد بسعر ' || COALESCE(NEW.offered_price::text, '0') || ' ج.م - الرد خلال 30 ثانية',
    'shipment',
    '/dashboard/driver-offers',
    jsonb_build_object('offer_id', NEW.id, 'shipment_id', NEW.shipment_id, 'price', NEW.offered_price)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_driver_new_offer
AFTER INSERT ON public.driver_shipment_offers
FOR EACH ROW
EXECUTE FUNCTION public.notify_driver_new_offer();

-- تفعيل Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_shipment_offers;
