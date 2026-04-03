

# خطة: توحيد الإجراءات السريعة في اللوحة الجانبية وحذف جميع الأزرار العائمة

## ملخص
نقل جميع الإجراءات من 9 أزرار عائمة (FABs) إلى **FloatingSidePanel** الموجود، ورفع موضعه لأعلى، وتحويله ليقرأ الإجراءات ديناميكياً من `quickActions.ts` حسب نوع المستخدم، مع فصل دردشة السائقين عن الدردشة العادية.

---

## الخطوة 1: تطوير FloatingSidePanel ليقرأ من quickActions.ts ديناميكياً
**ملف:** `src/components/layout/FloatingSidePanel.tsx`

- رفع الموضع من `top-1/2 -translate-y-1/2` إلى `top-[30%]`
- استبدال قائمة الإجراءات الثابتة (actions array) بقراءة ديناميكية من `getQuickActionsByType()` حسب `organization_type` و `roles`
- تقسيم الإجراءات لـ 4 فئات: **تواصل** (المساعد الذكي، الدعم، المحادثات، محادثات السائقين، سجل المكالمات) / **حرج يومي** (primary من quickActions) / **عمليات** (secondary) / **أدوات** (utility + scroll-top)
- إضافة فئة **تواصل** منفصلة تحتوي:
  - محادثات السائقين → `/dashboard/chat?filter=drivers` (تظهر فقط للجهات التي لديها سائقين: ناقل، أدمن)
  - المحادثات العامة → `/dashboard/chat`
  - سجل المكالمات → يفتح `CallLogDialog`
  - المساعد الذكي / الدعم الفني / مساعد العمليات (يبقوا كما هم)
- عرض أول 6-8 إجراءات من primary مباشرة، والباقي يظهر بزر "المزيد"

## الخطوة 2: حذف UnifiedFloatingMenu من DashboardLayout
**ملف:** `src/components/dashboard/DashboardLayout.tsx`
- إزالة lazy import لـ `UnifiedFloatingMenu` (سطر 49)
- إزالة `<Suspense><UnifiedFloatingMenu /></Suspense>` (سطر 528)

## الخطوة 3: حذف جميع FABs من الداشبوردات (9 ملفات)

| الداشبورد | المكون المحذوف |
|-----------|---------------|
| `TransporterDashboard.tsx` | `TransporterQuickFAB` |
| `RecyclerDashboard.tsx` | `RecyclerQuickFAB` |
| `DisposalDashboard.tsx` | `DisposalQuickFAB` |
| `EmployeeDashboard.tsx` | `EmployeeQuickFAB` |
| `DriverDashboard.tsx` | `DriverQuickFAB` |
| `AdminDashboard.tsx` | `AdminMobileQuickBar` |
| `GeneratorDashboard.tsx` | `GeneratorQuickShipmentFAB` |
| `ConsultantDashboard.tsx` | `ConsultantQuickFAB` |
| `ConsultingOfficeDashboard.tsx` | `ConsultantQuickFAB` |
| `RegulatorDashboardNew.tsx` | `RegulatorQuickFAB` |

في كل ملف: إزالة الـ import وإزالة الـ JSX render فقط (الملفات الأصلية للـ FABs تبقى لكن لا تُستخدم).

---

## التفاصيل التقنية

```text
FloatingSidePanel (يسار، top-[30%])
├── 💬 تواصل
│   ├── المساعد الذكي (widget)
│   ├── الدعم الفني (widget)
│   ├── مساعد العمليات (widget)
│   ├── المحادثات → /dashboard/chat
│   ├── محادثات السائقين → /dashboard/chat?filter=drivers [ناقل/أدمن فقط]
│   └── سجل المكالمات (dialog)
├── 🔴 حرج يومي (primary actions من quickActions.ts)
│   └── [ديناميكي حسب نوع المستخدم - أول 6-8]
├── ⚙ عمليات (secondary actions)
│   └── [ديناميكي - مع زر "المزيد"]
└── 🔧 أدوات (utility + scroll-top)
    └── [ديناميكي]
```

- القائمة تتغير تلقائياً حسب `organization?.organization_type` و `roles`
- الإجراءات التي تحتاج `onClick` handler (مثل `openDepositDialog`) تُعرض كأزرار navigate لصفحاتها البديلة
- الشاشة تصبح نظيفة تماماً بدون أي زر عائم

