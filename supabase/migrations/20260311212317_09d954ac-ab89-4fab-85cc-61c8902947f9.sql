
-- C2B Submissions table for external users/individuals
CREATE TABLE public.c2b_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  whatsapp_number TEXT,
  submission_type TEXT NOT NULL DEFAULT 'inquiry' CHECK (submission_type IN ('waste_offer', 'service_request', 'inquiry', 'contact_request', 'complaint')),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  photo_urls TEXT[] DEFAULT '{}',
  waste_type TEXT,
  estimated_quantity TEXT,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_review', 'forwarded', 'responded', 'closed')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  forwarded_to_org_id UUID REFERENCES public.organizations(id),
  forwarded_to_user_id UUID,
  forwarded_at TIMESTAMPTZ,
  forwarded_by UUID,
  admin_notes TEXT,
  response_message TEXT,
  responded_at TIMESTAMPTZ,
  external_share_code TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.c2b_submissions ENABLE ROW LEVEL SECURITY;

-- Public can insert (submit forms)
CREATE POLICY "Anyone can submit c2b form" ON public.c2b_submissions
  FOR INSERT WITH CHECK (true);

-- Admins can do everything (using sovereign role check)
CREATE POLICY "Admins can manage all c2b submissions" ON public.c2b_submissions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_sovereign_roles
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Org members can see submissions forwarded to their org
CREATE POLICY "Org members see forwarded submissions" ON public.c2b_submissions
  FOR SELECT TO authenticated
  USING (
    forwarded_to_org_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
  );

-- Index for admin queries
CREATE INDEX idx_c2b_submissions_status ON public.c2b_submissions(status);
CREATE INDEX idx_c2b_submissions_created ON public.c2b_submissions(created_at DESC);
CREATE INDEX idx_c2b_submissions_share_code ON public.c2b_submissions(external_share_code) WHERE external_share_code IS NOT NULL;

-- Create storage bucket for c2b photos (public for upload simplicity)
INSERT INTO storage.buckets (id, name, public) VALUES ('c2b-photos', 'c2b-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to upload to c2b-photos
CREATE POLICY "Anyone can upload c2b photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'c2b-photos');

CREATE POLICY "Anyone can view c2b photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'c2b-photos');
