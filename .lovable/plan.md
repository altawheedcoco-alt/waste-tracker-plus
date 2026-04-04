

# خطة تطوير صفحة المنظمة (Organization Profile Enhancement)

## التحليل الحالي

الصفحة الحالية (1,059 سطر) تحتوي على 15 تبويب مع بنية Facebook-style جيدة (Cover + Avatar + Stats + Tabs). لكنها تفتقر لـ:
- **عداد التأثير البيئي الحي** (لا يوجد أي ربط بـ `useEnvironmentalKPIs` أو شحنات المنظمة)
- **أوسمة المنظمة** (النظام الحالي `gamification` يعمل على مستوى الفرد فقط، لا يظهر في بروفايل المنظمة)
- **معرض العمليات** (يوجد `OrganizationPhotoGallery` لكنه مخفي في تبويب "الموقع والصور" وغير مدمج في `BusinessPagePreview`)
- **SEO ديناميكي** (لا يوجد Meta Tags ديناميكية للصفحة العامة)
- **ترتيب المعلومات**: المعلومات الأهم للشريك المحتمل (قانونية، قرب جغرافي، تأثير بيئي) ليست بارزة

---

## خطة التنفيذ

### 1. عداد التأثير البيئي اللحظي (Live ESG Impact Counter)
**ملف جديد**: `src/components/organization/OrgImpactCounter.tsx`
- Hook جديد `useOrganizationImpact(orgId)` يسحب شحنات المنظمة المكتملة ويحسب:
  - إجمالي الأطنان المُدوّرة
  - CO₂ الموفّر (باستخدام معاملات `RECYCLING_CO2_FACTORS` من `useEnvironmentalKPIs`)
  - مكافئ الأشجار المُنقذة
  - معدل التدوير
- عرض بـ **Animated Counters** (CSS counter animation) في شريط أسفل الـ Cover مباشرة
- يظهر في `BusinessPagePreview` للزوار + `ProfileHeader` للمالك

### 2. نظام أوسمة المنظمة (Organization Achievement Badges)
**ملف جديد**: `src/components/organization/OrgAchievementBadges.tsx`
- حساب الأوسمة ديناميكياً من بيانات الشحنات (بدون جدول جديد):
  - **صديق البيئة الذهبي**: دوّر > 100 طن
  - **صديق البيئة الفضي**: دوّر > 50 طن
  - **ناقل موثوق**: > 50 شحنة مكتملة
  - **شريك ملتزم**: > 10 شراكات نشطة
  - **مُوثّق**: لديه ختم + توقيع + سجل تجاري
  - **رائد بيئي**: وفّر > 10 طن CO₂
- عرض كشارات لامعة أسفل اسم المنظمة في `BusinessPagePreview`

### 3. تعزيز BusinessPagePreview بالمعلومات الحاسمة
**تعديل**: `src/components/organization/BusinessPagePreview.tsx`
- إضافة **قسم "لماذا نتميز"** (Trust Signals) يظهر فوق المنشورات:
  - أوسمة المنظمة (من المكون أعلاه)
  - عداد التأثير البيئي (4 بطاقات صغيرة)
  - حالة التراخيص (سارية/منتهية) من `orgData`
  - التقييم العام (عدد النجوم من الشراكات)
- إضافة تبويب **"الإنجازات"** جديد بجانب المنشورات/حول/الصور
- دمج معرض العمليات (صور المعدات والمصنع) في تبويب الصور

### 4. SEO ديناميكي للبروفايل العام
**تعديل**: `src/pages/dashboard/OrganizationProfile.tsx`
- إضافة `useEffect` لتحديث `document.title` و `meta description` ديناميكياً
- تضمين JSON-LD (Organization schema) للبروفايلات العامة

### 5. تفكيك OrganizationProfile.tsx (1,059 سطر)
- نقل منطق الوثائق (upload/download/print) لـ `src/components/organization/OrgDocumentsManager.tsx`
- نقل بيانات الممثلين لـ `src/components/organization/OrgRepresentatives.tsx`
- نقل بيانات التواصل لـ `src/components/organization/OrgContactInfo.tsx`
- الصفحة الرئيسية تصبح ~300 سطر (tab router فقط)

---

## الملفات

| الملف | الإجراء |
|-------|---------|
| `src/hooks/useOrganizationImpact.ts` | إنشاء — Hook حساب التأثير البيئي للمنظمة |
| `src/components/organization/OrgImpactCounter.tsx` | إنشاء — عداد التأثير الحي (animated) |
| `src/components/organization/OrgAchievementBadges.tsx` | إنشاء — أوسمة المنظمة الديناميكية |
| `src/components/organization/OrgDocumentsManager.tsx` | إنشاء — منطق الوثائق (مستخرج) |
| `src/components/organization/OrgRepresentatives.tsx` | إنشاء — بيانات الممثلين (مستخرج) |
| `src/components/organization/OrgContactInfo.tsx` | إنشاء — بيانات التواصل (مستخرج) |
| `src/components/organization/BusinessPagePreview.tsx` | تعديل — إضافة Trust Signals + أوسمة + تبويب إنجازات |
| `src/pages/dashboard/OrganizationProfile.tsx` | تعديل — تفكيك + SEO ديناميكي |

**لا تغييرات في قاعدة البيانات** — كل الحسابات من بيانات موجودة فعلاً (شحنات + شراكات + وثائق).

