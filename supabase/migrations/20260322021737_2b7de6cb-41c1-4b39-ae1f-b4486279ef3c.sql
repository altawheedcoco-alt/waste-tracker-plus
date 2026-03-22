ALTER TABLE public.organization_documents
  ADD COLUMN IF NOT EXISTS protection_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS protection_pin text DEFAULT null,
  ADD COLUMN IF NOT EXISTS allow_view boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_download boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_print boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS watermark_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS notify_on_download boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS public.document_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES public.organization_documents(id) ON DELETE CASCADE,
  user_id uuid,
  action_type text NOT NULL,
  ip_address text,
  user_agent text,
  success boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.document_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view access logs" ON public.document_access_log
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert access logs" ON public.document_access_log
  FOR INSERT TO authenticated
  WITH CHECK (true);