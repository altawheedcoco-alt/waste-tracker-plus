
-- جدول تقييمات السائقين
CREATE TABLE public.driver_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  shipment_id UUID REFERENCES public.shipments(id) ON DELETE SET NULL,
  rated_by_org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  rated_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  rating_direction TEXT NOT NULL DEFAULT 'org_to_driver',
  overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  punctuality_rating INTEGER CHECK (punctuality_rating BETWEEN 1 AND 5),
  safety_rating INTEGER CHECK (safety_rating BETWEEN 1 AND 5),
  communication_rating INTEGER CHECK (communication_rating BETWEEN 1 AND 5),
  professionalism_rating INTEGER CHECK (professionalism_rating BETWEEN 1 AND 5),
  comment TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- فهارس
CREATE INDEX idx_driver_ratings_driver ON public.driver_ratings(driver_id);
CREATE INDEX idx_driver_ratings_shipment ON public.driver_ratings(shipment_id);

-- منع التقييم المزدوج لنفس الشحنة والاتجاه
CREATE UNIQUE INDEX idx_driver_ratings_unique ON public.driver_ratings(driver_id, shipment_id, rating_direction);

-- تمكين RLS
ALTER TABLE public.driver_ratings ENABLE ROW LEVEL SECURITY;

-- سياسة القراءة: الجميع يقرأ التقييمات
CREATE POLICY "Anyone can read driver ratings"
  ON public.driver_ratings FOR SELECT
  TO authenticated
  USING (true);

-- سياسة الإدراج: المستخدم المسجل فقط
CREATE POLICY "Authenticated users can create ratings"
  ON public.driver_ratings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = rated_by_user_id);

-- دالة لحساب متوسط تقييم السائق وتحديثه تلقائياً
CREATE OR REPLACE FUNCTION public.update_driver_rating_avg()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  avg_rating NUMERIC;
  trip_count INTEGER;
BEGIN
  SELECT COALESCE(AVG(overall_rating), 0), COUNT(*)
  INTO avg_rating, trip_count
  FROM public.driver_ratings
  WHERE driver_id = NEW.driver_id
    AND rating_direction = 'org_to_driver';

  UPDATE public.drivers
  SET rating = ROUND(avg_rating, 2),
      total_trips = trip_count
  WHERE id = NEW.driver_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_driver_rating
  AFTER INSERT OR UPDATE ON public.driver_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_driver_rating_avg();
