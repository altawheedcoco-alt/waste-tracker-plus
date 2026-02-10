
-- Pride certificates table for milestone recognition
CREATE TABLE public.pride_certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  organization_type TEXT NOT NULL,
  certificate_number TEXT NOT NULL UNIQUE,
  milestone_tons NUMERIC NOT NULL,
  total_quantity_kg NUMERIC NOT NULL,
  certificate_type TEXT NOT NULL DEFAULT 'pride',
  title TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  description TEXT,
  description_ar TEXT,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_printed BOOLEAN DEFAULT false,
  printed_at TIMESTAMPTZ,
  printed_by UUID REFERENCES public.profiles(id)
);

ALTER TABLE public.pride_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations view own certificates"
  ON public.pride_certificates FOR SELECT
  USING (
    organization_id IN (
      SELECT p.organization_id FROM public.profiles p WHERE p.id = auth.uid()
    )
    OR
    EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  );

CREATE POLICY "Authenticated users can insert certificates"
  ON public.pride_certificates FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can update certificates"
  ON public.pride_certificates FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE INDEX idx_pride_certificates_org ON public.pride_certificates(organization_id);
CREATE INDEX idx_pride_certificates_milestone ON public.pride_certificates(organization_id, milestone_tons);

ALTER PUBLICATION supabase_realtime ADD TABLE public.pride_certificates;
