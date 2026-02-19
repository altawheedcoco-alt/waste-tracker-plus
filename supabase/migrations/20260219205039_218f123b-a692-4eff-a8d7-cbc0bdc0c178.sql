
-- جدول تفضيلات ويدجت لوحة التحكم
-- يدعم تفضيلات شخصية (per user) + افتراضيات المنظمة (per org)

CREATE TABLE public.dashboard_widget_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  widget_order text[] DEFAULT '{}',
  hidden_widgets text[] DEFAULT '{}',
  pinned_widgets text[] DEFAULT '{}',
  is_org_default boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, organization_id),
  CONSTRAINT valid_preference CHECK (
    (user_id IS NOT NULL AND is_org_default = false) OR
    (user_id IS NULL AND is_org_default = true AND organization_id IS NOT NULL)
  )
);

-- فهارس
CREATE INDEX idx_dwp_user ON dashboard_widget_preferences(user_id);
CREATE INDEX idx_dwp_org ON dashboard_widget_preferences(organization_id);
CREATE INDEX idx_dwp_org_default ON dashboard_widget_preferences(organization_id, is_org_default) WHERE is_org_default = true;

-- RLS
ALTER TABLE dashboard_widget_preferences ENABLE ROW LEVEL SECURITY;

-- المستخدم يقرأ تفضيلاته الشخصية + افتراضيات منظمته
CREATE POLICY "Users read own or org default widget prefs"
ON dashboard_widget_preferences FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR (is_org_default = true AND organization_id = get_user_org_id_safe(auth.uid()))
);

-- المستخدم يدير تفضيلاته الشخصية فقط
CREATE POLICY "Users manage own widget prefs"
ON dashboard_widget_preferences FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() AND is_org_default = false);

CREATE POLICY "Users update own widget prefs"
ON dashboard_widget_preferences FOR UPDATE
TO authenticated
USING (user_id = auth.uid() AND is_org_default = false);

CREATE POLICY "Users delete own widget prefs"
ON dashboard_widget_preferences FOR DELETE
TO authenticated
USING (user_id = auth.uid() AND is_org_default = false);

-- المدير يدير الافتراضيات
CREATE POLICY "Admins manage org default widget prefs"
ON dashboard_widget_preferences FOR ALL
TO authenticated
USING (
  is_org_default = true
  AND organization_id = get_user_org_id_safe(auth.uid())
);

-- تحديث التاريخ
CREATE TRIGGER update_dwp_updated_at
  BEFORE UPDATE ON dashboard_widget_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
