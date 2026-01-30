-- Create recycling_reports table to store generated reports
CREATE TABLE public.recycling_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  recycler_organization_id UUID NOT NULL REFERENCES public.organizations(id),
  created_by UUID REFERENCES public.profiles(id),
  template_id UUID REFERENCES public.report_templates(id),
  report_number TEXT NOT NULL,
  opening_declaration TEXT,
  processing_details TEXT,
  closing_declaration TEXT,
  custom_notes TEXT,
  waste_category TEXT NOT NULL DEFAULT 'all',
  report_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.recycling_reports ENABLE ROW LEVEL SECURITY;

-- Create unique report number generator
CREATE OR REPLACE FUNCTION public.generate_report_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.report_number := 'RPT-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || 
                       LPAD(CAST(FLOOR(RANDOM() * 10000) AS TEXT), 4, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_report_number
  BEFORE INSERT ON public.recycling_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_report_number();

-- Trigger to update updated_at
CREATE TRIGGER update_recycling_reports_updated_at
  BEFORE UPDATE ON public.recycling_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies
-- Recyclers can view their own reports
CREATE POLICY "Recyclers can view their own reports"
  ON public.recycling_reports
  FOR SELECT
  USING (recycler_organization_id = get_user_org_id_safe(auth.uid()));

-- Recyclers can create reports
CREATE POLICY "Recyclers can create reports"
  ON public.recycling_reports
  FOR INSERT
  WITH CHECK (recycler_organization_id = get_user_org_id_safe(auth.uid()));

-- Generators and transporters can view reports for their shipments
CREATE POLICY "Related parties can view reports"
  ON public.recycling_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.shipments s
      WHERE s.id = shipment_id
      AND (
        s.generator_id = get_user_org_id_safe(auth.uid())
        OR s.transporter_id = get_user_org_id_safe(auth.uid())
      )
    )
  );

-- Admins can view all reports
CREATE POLICY "Admins can view all reports"
  ON public.recycling_reports
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Function to notify generator and transporter when report is created
CREATE OR REPLACE FUNCTION public.notify_recycling_report_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_shipment RECORD;
  v_recycler_name TEXT;
  v_user_ids UUID[];
  v_user_id UUID;
BEGIN
  -- Get shipment details
  SELECT s.*, g.name as generator_name, t.name as transporter_name, r.name as recycler_name
  INTO v_shipment
  FROM shipments s
  LEFT JOIN organizations g ON s.generator_id = g.id
  LEFT JOIN organizations t ON s.transporter_id = t.id
  LEFT JOIN organizations r ON s.recycler_id = r.id
  WHERE s.id = NEW.shipment_id;

  -- Get recycler name
  SELECT name INTO v_recycler_name FROM organizations WHERE id = NEW.recycler_organization_id;

  -- Notify generator users
  SELECT ARRAY_AGG(p.user_id) INTO v_user_ids
  FROM profiles p
  WHERE p.organization_id = v_shipment.generator_id AND p.is_active = true;

  IF v_user_ids IS NOT NULL THEN
    FOREACH v_user_id IN ARRAY v_user_ids
    LOOP
      INSERT INTO notifications (user_id, title, message, type, shipment_id)
      VALUES (
        v_user_id,
        'تقرير تدوير جديد',
        'تم إنشاء تقرير إعادة التدوير للشحنة ' || v_shipment.shipment_number || ' من ' || COALESCE(v_recycler_name, 'جهة التدوير'),
        'recycling_report',
        NEW.shipment_id
      );
    END LOOP;
  END IF;

  -- Notify transporter users
  SELECT ARRAY_AGG(p.user_id) INTO v_user_ids
  FROM profiles p
  WHERE p.organization_id = v_shipment.transporter_id AND p.is_active = true;

  IF v_user_ids IS NOT NULL THEN
    FOREACH v_user_id IN ARRAY v_user_ids
    LOOP
      INSERT INTO notifications (user_id, title, message, type, shipment_id)
      VALUES (
        v_user_id,
        'تقرير تدوير جديد',
        'تم إنشاء تقرير إعادة التدوير للشحنة ' || v_shipment.shipment_number || ' من ' || COALESCE(v_recycler_name, 'جهة التدوير'),
        'recycling_report',
        NEW.shipment_id
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for notifications
CREATE TRIGGER notify_on_recycling_report_created
  AFTER INSERT ON public.recycling_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_recycling_report_created();