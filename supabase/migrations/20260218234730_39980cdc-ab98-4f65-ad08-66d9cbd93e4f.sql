
-- Create a separate secure table for password hashes (no SELECT policy for authenticated users)
CREATE TABLE IF NOT EXISTS public.page_password_hashes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_password_id UUID NOT NULL UNIQUE REFERENCES public.page_passwords(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS - NO select policy for authenticated users (only service role can read)
ALTER TABLE public.page_password_hashes ENABLE ROW LEVEL SECURITY;

-- Only INSERT policy for authenticated users (to create passwords)
CREATE POLICY "Org managers can insert password hashes"
ON public.page_password_hashes FOR INSERT TO authenticated
WITH CHECK (
  page_password_id IN (
    SELECT pp.id FROM page_passwords pp
    WHERE pp.organization_id IN (
      SELECT p.organization_id FROM profiles p WHERE p.user_id = auth.uid()
    )
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Migrate existing hashes to new table
INSERT INTO public.page_password_hashes (page_password_id, password_hash)
SELECT id, password_hash FROM public.page_passwords
WHERE password_hash IS NOT NULL
ON CONFLICT (page_password_id) DO NOTHING;

-- Remove password_hash column from page_passwords table
ALTER TABLE public.page_passwords DROP COLUMN IF EXISTS password_hash;
