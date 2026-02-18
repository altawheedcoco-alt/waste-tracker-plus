
-- جدول إعدادات الملف العام للمنشأة
CREATE TABLE public.org_public_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  share_code TEXT NOT NULL UNIQUE DEFAULT substr(md5(random()::text), 1, 10),
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- صلاحيات العرض
  show_basic_info BOOLEAN NOT NULL DEFAULT true,       -- الاسم، النشاط، الشعار
  show_contact_info BOOLEAN NOT NULL DEFAULT false,    -- الهاتف، البريد، العنوان
  show_licenses BOOLEAN NOT NULL DEFAULT false,        -- التراخيص والسجلات
  show_team BOOLEAN NOT NULL DEFAULT false,            -- قائمة الموظفين
  show_team_details BOOLEAN NOT NULL DEFAULT false,    -- تفاصيل الموظف (المنصب، القسم)
  show_team_documents BOOLEAN NOT NULL DEFAULT false,  -- مستندات الموظفين
  show_statistics BOOLEAN NOT NULL DEFAULT false,      -- إحصائيات عامة
  
  -- بيانات إضافية
  custom_message TEXT,                                  -- رسالة ترحيبية مخصصة
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(organization_id)
);

-- Enable RLS
ALTER TABLE public.org_public_profiles ENABLE ROW LEVEL SECURITY;

-- سياسة القراءة العامة (للزوار عبر الكود)
CREATE POLICY "Public profiles are viewable by share code"
  ON public.org_public_profiles
  FOR SELECT
  USING (is_active = true);

-- سياسة الإدارة لأعضاء المنظمة
CREATE POLICY "Org members can manage their public profile"
  ON public.org_public_profiles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      JOIN public.profiles p ON p.id = om.profile_id
      WHERE om.organization_id = org_public_profiles.organization_id
      AND p.user_id = auth.uid()
      AND om.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      JOIN public.profiles p ON p.id = om.profile_id
      WHERE om.organization_id = org_public_profiles.organization_id
      AND p.user_id = auth.uid()
      AND om.status = 'active'
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_org_public_profiles_updated_at
  BEFORE UPDATE ON public.org_public_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
