-- Add cover_url column to organizations table for cover photo
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS cover_url text;

-- Add comment
COMMENT ON COLUMN public.organizations.cover_url IS 'صورة الغلاف للجهة';