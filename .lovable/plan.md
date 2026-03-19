

# تنفيذ: نظام قفل الملف الشخصي (Profile Lock) بنمط Facebook

## التغييرات المطلوبة

### 1. Migration — إضافة `is_profile_locked`
```sql
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_profile_locked boolean NOT NULL DEFAULT false;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS is_profile_locked boolean NOT NULL DEFAULT false;
```

### 2. `ProfileHeader.tsx`
- إضافة `is_profile_locked` للـ interface
- عند القفل: دائرة زرقاء (`ring-4 ring-blue-500`) حول الأفاتار
- أيقونة `ShieldCheck` في أسفل منتصف الأفاتار (شارة زرقاء صغيرة)
- زر "قفل/فتح الملف الشخصي" لصاحب الحساب (`isEditable`)
- منطق الحماية: `protected={organization.is_profile_locked && !isEditable}`

### 3. `BusinessPagePreview.tsx` + `OrganizationView` وباقي المكونات
- قراءة `is_profile_locked` وعرض المؤشرات البصرية (الدائرة + الدرع)
- تمرير `protected` بناءً على حالة القفل

### الملفات المتأثرة
| ملف | التغيير |
|-----|--------|
| Migration جديد | إضافة العمود |
| `ProfileHeader.tsx` | دائرة زرقاء + درع + زر قفل + منطق protected |
| `BusinessPagePreview.tsx` | عرض مؤشرات القفل |
| `SharedOrganizationView.tsx` | عرض مؤشرات القفل في الصفحة العامة |

