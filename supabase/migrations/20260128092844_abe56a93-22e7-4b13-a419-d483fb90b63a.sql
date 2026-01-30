-- ====================================
-- نظام إدارة المخلفات - آي ريسايكل
-- ====================================

-- 1. إنشاء أنواع الحسابات (Enum)
CREATE TYPE public.organization_type AS ENUM (
  'generator',      -- جهة مولدة للمخلفات (مصانع، شركات)
  'transporter',    -- شركة جمع ونقل
  'recycler'        -- جهة تدوير
);

-- 2. إنشاء أنواع الأدوار
CREATE TYPE public.app_role AS ENUM (
  'admin',          -- مدير النظام
  'company_admin',  -- مدير الشركة
  'employee',       -- موظف
  'driver'          -- سائق
);

-- 3. إنشاء حالات الشحنة
CREATE TYPE public.shipment_status AS ENUM (
  'new',            -- جديدة
  'approved',       -- معتمدة
  'collecting',     -- قيد الجمع
  'in_transit',     -- في الطريق
  'delivered',      -- تم التسليم
  'confirmed'       -- مؤكدة
);

-- 4. إنشاء أنواع المخلفات
CREATE TYPE public.waste_type AS ENUM (
  'plastic',        -- بلاستيك
  'paper',          -- ورق وكرتون
  'metal',          -- معادن
  'glass',          -- زجاج
  'electronic',     -- إلكترونيات
  'organic',        -- عضوية
  'chemical',       -- كيميائية
  'medical',        -- طبية
  'construction',   -- مخلفات بناء
  'other'           -- أخرى
);

-- ====================================
-- 5. جدول المؤسسات/الشركات
-- ====================================
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_en TEXT,
  organization_type organization_type NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  secondary_phone TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  region TEXT,
  commercial_register TEXT,
  environmental_license TEXT,
  activity_type TEXT,
  production_capacity TEXT,
  logo_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. جدول البروفايلات (للمستخدمين)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. جدول الأدوار
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, role)
);

-- ====================================
-- 8. جدول السائقين
-- ====================================
CREATE TABLE public.drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  license_number TEXT NOT NULL,
  license_expiry DATE,
  vehicle_type TEXT,
  vehicle_plate TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ====================================
-- 9. جدول الشحنات
-- ====================================
CREATE TABLE public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_number TEXT UNIQUE NOT NULL,
  
  -- الجهات المشاركة
  generator_id UUID REFERENCES public.organizations(id) NOT NULL,
  transporter_id UUID REFERENCES public.organizations(id) NOT NULL,
  recycler_id UUID REFERENCES public.organizations(id) NOT NULL,
  
  -- السائق والمنشئ
  driver_id UUID REFERENCES public.drivers(id),
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  
  -- تفاصيل الشحنة
  waste_type waste_type NOT NULL,
  waste_description TEXT,
  quantity DECIMAL(10,2) NOT NULL,
  unit TEXT DEFAULT 'كجم',
  
  -- الحالة والمواعيد
  status shipment_status DEFAULT 'new',
  auto_approve_at TIMESTAMPTZ,
  
  -- تواريخ المراحل
  approved_at TIMESTAMPTZ,
  collection_started_at TIMESTAMPTZ,
  in_transit_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  
  -- الموقع
  pickup_address TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  
  -- ملاحظات
  notes TEXT,
  generator_notes TEXT,
  recycler_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ====================================
-- 10. جدول الإشعارات
-- ====================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shipment_id UUID REFERENCES public.shipments(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ====================================
-- 11. جدول سجل الشحنات (للتتبع)
-- ====================================
CREATE TABLE public.shipment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID REFERENCES public.shipments(id) ON DELETE CASCADE NOT NULL,
  status shipment_status NOT NULL,
  changed_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ====================================
-- تفعيل RLS
-- ====================================
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_logs ENABLE ROW LEVEL SECURITY;

-- ====================================
-- دالة التحقق من الدور
-- ====================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- دالة للحصول على organization_id للمستخدم
CREATE OR REPLACE FUNCTION public.get_user_organization_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM public.profiles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- ====================================
-- سياسات Organizations
-- ====================================
CREATE POLICY "Organizations viewable by authenticated users"
  ON public.organizations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Organizations manageable by company admins"
  ON public.organizations FOR ALL
  TO authenticated
  USING (
    id = public.get_user_organization_id(auth.uid())
    AND (public.has_role(auth.uid(), 'company_admin') OR public.has_role(auth.uid(), 'admin'))
  );

-- ====================================
-- سياسات Profiles
-- ====================================
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view same organization profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ====================================
-- سياسات User Roles
-- ====================================
CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ====================================
-- سياسات Drivers
-- ====================================
CREATE POLICY "Drivers viewable by same organization"
  ON public.drivers FOR SELECT
  TO authenticated
  USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Drivers manageable by company admins"
  ON public.drivers FOR ALL
  TO authenticated
  USING (
    organization_id = public.get_user_organization_id(auth.uid())
    AND (public.has_role(auth.uid(), 'company_admin') OR public.has_role(auth.uid(), 'admin'))
  );

-- ====================================
-- سياسات Shipments
-- ====================================
CREATE POLICY "Shipments viewable by related organizations"
  ON public.shipments FOR SELECT
  TO authenticated
  USING (
    generator_id = public.get_user_organization_id(auth.uid())
    OR transporter_id = public.get_user_organization_id(auth.uid())
    OR recycler_id = public.get_user_organization_id(auth.uid())
  );

CREATE POLICY "Shipments creatable by transporters"
  ON public.shipments FOR INSERT
  TO authenticated
  WITH CHECK (
    transporter_id = public.get_user_organization_id(auth.uid())
  );

CREATE POLICY "Shipments updatable by related parties"
  ON public.shipments FOR UPDATE
  TO authenticated
  USING (
    generator_id = public.get_user_organization_id(auth.uid())
    OR transporter_id = public.get_user_organization_id(auth.uid())
    OR recycler_id = public.get_user_organization_id(auth.uid())
  );

-- ====================================
-- سياسات Notifications
-- ====================================
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ====================================
-- سياسات Shipment Logs
-- ====================================
CREATE POLICY "Logs viewable by shipment related parties"
  ON public.shipment_logs FOR SELECT
  TO authenticated
  USING (
    shipment_id IN (
      SELECT id FROM public.shipments
      WHERE generator_id = public.get_user_organization_id(auth.uid())
         OR transporter_id = public.get_user_organization_id(auth.uid())
         OR recycler_id = public.get_user_organization_id(auth.uid())
    )
  );

CREATE POLICY "Logs insertable by authenticated users"
  ON public.shipment_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ====================================
-- Triggers للتحديث التلقائي
-- ====================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at
  BEFORE UPDATE ON public.drivers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shipments_updated_at
  BEFORE UPDATE ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ====================================
-- دالة إنشاء رقم الشحنة التلقائي
-- ====================================
CREATE OR REPLACE FUNCTION public.generate_shipment_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.shipment_number := 'SHP-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || 
                         LPAD(CAST(FLOOR(RANDOM() * 10000) AS TEXT), 4, '0');
  NEW.auto_approve_at := now() + INTERVAL '6 hours';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER generate_shipment_number_trigger
  BEFORE INSERT ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION public.generate_shipment_number();

-- ====================================
-- تفعيل Realtime للشحنات والإشعارات
-- ====================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.shipments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;