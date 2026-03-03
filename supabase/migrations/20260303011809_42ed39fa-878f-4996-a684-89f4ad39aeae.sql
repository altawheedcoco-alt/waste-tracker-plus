-- Add view_count column to org_public_profiles
ALTER TABLE public.org_public_profiles ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;

-- Create a function to increment view count (avoids race conditions)
CREATE OR REPLACE FUNCTION public.increment_org_profile_views(_share_code text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE org_public_profiles
  SET view_count = view_count + 1
  WHERE share_code = _share_code AND is_active = true;
$$;