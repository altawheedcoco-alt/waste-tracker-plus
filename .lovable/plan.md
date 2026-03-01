
# خطة نظام المشاركة الذكية الشاملة (Universal Smart Sharing)

## الحالة: 🔲 جاهز للتنفيذ

---

## الفكرة

نظام مشاركة موحد يتيح لأي مستخدم مشاركة أي مورد في المنصة عبر رابط واحد (`/s/:type/:code`)، مع تحديد مستوى الوصول تلقائياً بناءً على هوية المتلقي (زائر / مسجل / طرف مرتبط).

---

## المعمارية

### رابط موحد
```
/s/:type/:code
مثال: /s/shipment/A3xK9m
مثال: /s/blog/R7yT2p
مثال: /s/certificate/K8mN3q
```

### مستويات الوصول (3 طبقات)

| المستوى | الوصف | مثال |
|---------|-------|------|
| `public` | أي شخص يملك الرابط | حالة الشحنة، مقال المدونة |
| `authenticated` | مستخدم مسجل فقط | تفاصيل الفاتورة |
| `linked_only` | طرف مرتبط بالمورد فقط | المستندات المالية الكاملة |

### أنواع الموارد القابلة للمشاركة (قابلة للتوسع)

| النوع (`resource_type`) | العرض العام | العرض للمرتبط | الأولوية |
|-------------------------|------------|---------------|---------|
| `shipment` | الحالة + التايملاين | كل التفاصيل + المستندات | 🔴 أولى |
| `blog` | المقال كاملاً | — | 🔴 أولى |
| `certificate` | الشهادة + QR تحقق | — | 🟡 ثانية |
| `invoice` | ملخص (رقم + تاريخ + مبلغ) | التفاصيل المالية الكاملة | 🟡 ثانية |
| `organization` | البروفايل العام | بيانات الشراكة | 🟡 ثانية |
| `safety_report` | ملخص النتائج | التقرير + المرفقات | 🟢 ثالثة |
| `track` | تتبع لحظي محدود | تتبع + تفاصيل السائق | 🟢 ثالثة |
| `waste_auction` | تفاصيل المزاد | المزايدات + التواصل | 🟢 ثالثة |
| `document` | معاينة فقط | تحميل + توقيع | 🟢 ثالثة |

---

## الخطوات التنفيذية

### المرحلة 1: البنية التحتية (الأساس)

#### 1.1 جدول `shared_links`
```sql
CREATE TABLE public.shared_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) UNIQUE NOT NULL,            -- كود فريد قصير
  resource_type VARCHAR(50) NOT NULL,           -- shipment, blog, certificate...
  resource_id UUID NOT NULL,                    -- معرف المورد
  created_by UUID REFERENCES auth.users(id),    -- من أنشأ الرابط
  organization_id UUID REFERENCES organizations(id), -- المنظمة المالكة
  
  -- إعدادات الوصول
  visibility_level VARCHAR(20) DEFAULT 'public', -- public | authenticated | linked_only
  allowed_fields JSONB DEFAULT '[]',             -- الحقول المسموح عرضها (فارغ = الكل)
  
  -- حماية اختيارية
  requires_pin BOOLEAN DEFAULT false,
  pin_hash TEXT,
  
  -- صلاحية وانتهاء
  expires_at TIMESTAMPTZ,
  max_views INTEGER,
  view_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  -- بيانات وصفية
  title VARCHAR(200),                           -- عنوان مخصص للرابط
  description TEXT,                              -- وصف اختياري
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- فهرس سريع للبحث بالكود
CREATE UNIQUE INDEX idx_shared_links_code ON shared_links(code);
CREATE INDEX idx_shared_links_resource ON shared_links(resource_type, resource_id);
CREATE INDEX idx_shared_links_creator ON shared_links(created_by);
```

#### 1.2 جدول `shared_link_views` (إحصائيات)
```sql
CREATE TABLE public.shared_link_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_link_id UUID REFERENCES shared_links(id) ON DELETE CASCADE,
  viewer_user_id UUID,                          -- null للزوار
  viewer_ip VARCHAR(50),
  viewer_device VARCHAR(200),
  viewed_at TIMESTAMPTZ DEFAULT now()
);
```

#### 1.3 RLS Policies
- المنشئ يتحكم كاملاً (CRUD)
- أعضاء المنظمة يشاهدون روابط منظمتهم
- الزوار يصلون فقط عبر الكود (عبر Edge Function)

#### 1.4 Edge Function: `resolve-shared-link`
- تستقبل: `code` + `pin` (اختياري) + JWT (اختياري)
- تتحقق من: الصلاحية + الانتهاء + عدد المشاهدات + PIN
- تحدد مستوى الوصول بناءً على هوية الزائر
- ترجع البيانات المناسبة حسب `resource_type` و `visibility_level`

### المرحلة 2: واجهة المشاركة

#### 2.1 مكون `ShareButton` (زر عائم)
- يظهر في كل صفحة تفاصيل (شحنة، فاتورة، شهادة...)
- عند الضغط: يفتح Dialog للتحكم في إعدادات المشاركة

#### 2.2 مكون `ShareDialog`
- اختيار مستوى الوصول (عام / مسجلين / مرتبطين)
- تحديد الحقول المسموح عرضها (checkboxes)
- إعداد PIN اختياري
- تحديد مدة الصلاحية
- نسخ الرابط + مشاركة واتساب

#### 2.3 صفحة `/s/:type/:code` (العرض العام)
- تصميم أنيق مستقل (بدون لوحة التحكم)
- عرض المحتوى حسب النوع والصلاحيات
- شريط علوي بلوجو المنصة + رابط التسجيل
- إذا يتطلب PIN: شاشة إدخال أولاً
- إذا يتطلب تسجيل: توجيه لصفحة الدخول

### المرحلة 3: أنواع الموارد (التوسع)

#### 3.1 الشحنات (`shipment`)
- العام: رقم الشحنة + الحالة + التايملاين المبسط
- المرتبط: كل التفاصيل + المستندات + التتبع

#### 3.2 المدونة (`blog`)
- العام: المقال كاملاً (عرض جميل SEO-friendly)
- هذا النوع دائماً `public`

#### 3.3 الشهادات (`certificate`)
- العام: بيانات الشهادة + QR للتحقق
- إمكانية تحميل PDF

#### 3.4 الفواتير (`invoice`)
- العام: رقم + تاريخ + إجمالي
- المرتبط: كل البنود + التوقيعات

#### 3.5 باقي الأنواع...
- يُضاف كل نوع كـ "renderer" مستقل في `/s/:type/` 
- المعمارية تدعم إضافة أي نوع جديد بملف واحد فقط

---

## مكونات النظام البرمجية

```
src/
├── pages/
│   └── SharedResourcePage.tsx          -- الصفحة الرئيسية /s/:type/:code
├── components/
│   └── sharing/
│       ├── ShareButton.tsx              -- زر المشاركة العائم
│       ├── ShareDialog.tsx              -- نافذة إعدادات المشاركة
│       ├── SharedPinGate.tsx            -- شاشة إدخال PIN
│       ├── SharedResourceLayout.tsx     -- التصميم العام للصفحة
│       └── renderers/                   -- عارض لكل نوع مورد
│           ├── SharedShipmentView.tsx
│           ├── SharedBlogView.tsx
│           ├── SharedCertificateView.tsx
│           ├── SharedInvoiceView.tsx
│           └── SharedOrganizationView.tsx
├── hooks/
│   ├── useShareLink.ts                  -- إنشاء/إدارة روابط المشاركة
│   └── useSharedResource.ts             -- جلب المورد المشارك
supabase/
└── functions/
    └── resolve-shared-link/
        └── index.ts                     -- Edge Function للتحقق والجلب
```

---

## ملاحظات أمنية
- الكود 10 رموز عشوائية (base62) — صعب التخمين
- PIN يُخزن كـ hash (bcrypt)
- Edge Function تتحقق من كل الشروط قبل إرجاع البيانات
- لا يتم كشف بيانات حساسة (مالية/شخصية) في المستوى العام
- Rate limiting على Edge Function لمنع الـ brute force
- `allowed_fields` يضمن عدم تسريب حقول غير مصرح بها

---

## التكامل مع الأنظمة الموجودة
- يتكامل مع `scoped_access_links` (للحالات المتقدمة فقط)
- يستفيد من `partner_visibility_settings` لتحديد ما يظهر للشركاء
- يحترم `bidirectional_masking` عند مشاركة الشحنات
- يُسجل في `activity_logs` كل عملية مشاركة

---

## الفرق بين هذا النظام و Scoped Access Links

| الميزة | Smart Sharing | Scoped Access |
|--------|--------------|---------------|
| الغرض | مشاركة سريعة لأي مورد | وصول عميق لبيانات محددة |
| التعقيد | بسيط (رابط + عرض) | متقدم (جلسة + عمليات) |
| الأنواع | كل أنواع الموارد | شحنات + إيداعات + كشف حساب |
| العمليات | عرض فقط (Read-only) | عرض + رفع + إجراءات |
| المدة | قصيرة (ساعات/أيام) | طويلة (أسابيع/شهور) |

---

# نظام إدارة معلومات المخلفات (WMIS)

## الحالة: ✅ تم التأسيس

---

## المعمارية

### 1. ربط التراخيص بالعمليات (License-Operation Binding)
- عمود `licensed_waste_types TEXT[]` على جدول `organizations`
- دالة `check_waste_license_compliance()` للتحقق الآلي
- جدول `wmis_license_checks` لتسجيل كل عملية تحقق
- مكون `LicenseComplianceBanner` يعرض نتيجة التحقق فوراً
- مكون `LicensedWasteTypesEditor` لإدارة أنواع المخلفات المرخصة

### 2. بوابة الاستشاري الإلزامية (Consultant Approval Gate)
- جدول `wmis_consultant_gates` لتحديد البوابات والشروط
- مكون `ConsultantApprovalGate` يحجب الإجراء حتى موافقة الاستشاري
- دعم الموافقة التلقائية (أقل من وزن معين)
- تصعيد آلي بعد مهلة محددة
- نقل المسؤولية الفنية من المنصة للاستشاري

### 3. أحداث IoT/AI (WMIS Events)
- جدول `wmis_events` لتسجيل كافة الأحداث
- 6 مصادر: iot_sensor, ai_vision, gps_tracker, weighbridge, manual, system
- 15 نوع حدث من تنبيهات الحرارة لخرق الجيوفنس
- 4 مستويات خطورة: info, warning, critical, emergency
- إشعارات تلقائية للأطراف المعنية عبر Trigger
- Realtime مفعل للأحداث الحية

### المكونات البرمجية
```
src/hooks/useWMIS.ts              — Hook شامل للتحقق والأحداث والبوابات
src/components/wmis/
├── LicenseComplianceBanner.tsx   — شريط التحقق من الترخيص
├── LicensedWasteTypesEditor.tsx  — محرر أنواع المخلفات المرخصة
├── WMISEventsFeed.tsx            — خلاصة الأحداث مع فلترة وحل
├── CreateWMISEventDialog.tsx     — نافذة تسجيل حدث جديد
└── ConsultantApprovalGate.tsx    — بوابة موافقة الاستشاري
```

### ملاحظة قانونية
- المنصة = أداة رقابة وشفافية
- المسؤولية على مُدخل البيانات وصاحب التوقيع (المادة 18، قانون 202/2020)
- الختم النهائي في يد الاستشاري البيئي المعتمد
