-- Add portfolio/profile fields to organizations table
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS vision TEXT,
ADD COLUMN IF NOT EXISTS policy TEXT,
ADD COLUMN IF NOT EXISTS headquarters TEXT,
ADD COLUMN IF NOT EXISTS branches JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS field_of_work TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.organizations.description IS 'وصف الشركة ونبذة عنها';
COMMENT ON COLUMN public.organizations.vision IS 'رؤية الشركة ورسالتها';
COMMENT ON COLUMN public.organizations.policy IS 'سياسة الشركة ومبادئها';
COMMENT ON COLUMN public.organizations.headquarters IS 'وصف المقر الرئيسي';
COMMENT ON COLUMN public.organizations.branches IS 'قائمة الفروع بتفاصيلها';
COMMENT ON COLUMN public.organizations.field_of_work IS 'مجال عمل الشركة';