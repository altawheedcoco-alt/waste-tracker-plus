
-- Create separate table for sensitive profile data
CREATE TABLE IF NOT EXISTS public.profile_sensitive_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  national_id TEXT,
  id_card_front_url TEXT,
  id_card_back_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profile_sensitive_data ENABLE ROW LEVEL SECURITY;

-- Only the user themselves can view their sensitive data
CREATE POLICY "Users can view own sensitive data"
ON public.profile_sensitive_data FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Admins can view all sensitive data
CREATE POLICY "Admins can view all sensitive data"
ON public.profile_sensitive_data FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Company admins can view org member sensitive data
CREATE POLICY "Company admins can view org sensitive data"
ON public.profile_sensitive_data FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'company_admin'::app_role)
  AND user_id IN (
    SELECT p.user_id FROM profiles p 
    WHERE p.organization_id = get_user_org_id_safe(auth.uid())
  )
);

-- Users can insert their own sensitive data
CREATE POLICY "Users can insert own sensitive data"
ON public.profile_sensitive_data FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own sensitive data
CREATE POLICY "Users can update own sensitive data"
ON public.profile_sensitive_data FOR UPDATE TO authenticated
USING (user_id = auth.uid());

-- Admins can update any sensitive data
CREATE POLICY "Admins can update any sensitive data"
ON public.profile_sensitive_data FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Migrate existing data
INSERT INTO public.profile_sensitive_data (user_id, national_id, id_card_front_url, id_card_back_url)
SELECT user_id, national_id, id_card_front_url, id_card_back_url
FROM public.profiles
WHERE national_id IS NOT NULL OR id_card_front_url IS NOT NULL OR id_card_back_url IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- Remove sensitive columns from profiles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS national_id;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS id_card_front_url;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS id_card_back_url;
