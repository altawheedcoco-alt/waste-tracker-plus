

# خطة دمج نظام إدارة الوقود الذكي (Fuel Intelligence System)

## الوضع الحالي

الصفحة الحالية (`FuelManagement.tsx` - 212 سطر) بسيطة: إضافة/حذف سجلات وقود مع عرض إجمالي اللترات والتكلفة. لا توجد أي تحليلات أو كشف تلاعب أو ربط بالصيانة.

**البيانات المتاحة فعلاً في قاعدة البيانات:**
- `fuel_records`: 16 عمود (لتر، تكلفة، عداد، محطة، vehicle_id, shipment_id)
- `fleet_vehicles`: بيانات المركبات (نوع، سعة، حالة)
- `vehicle_telemetry`: أداء المركبة (إجمالي كم، متوسط استهلاك، health_score)
- `vehicle_maintenance`: سجل الصيانة مع عداد الكيلومترات
- `gps_location_logs`: إحداثيات السائقين اللحظية
- `geofence_alerts`: تنبيهات النطاق الجغرافي

---

## هيكل النظام الجديد

```text
Fuel Intelligence System
├── 1. useFuelCalculations Hook (محرك الحسابات)
│   ├── L/100km لكل مركبة
│   ├── كشف الانحرافات (vs متوسط النوع)
│   └── توقعات الميزانية
│
├── 2. FuelManagement.tsx (الصفحة الرئيسية - مُعاد بناؤها)
│   ├── FuelDashboardCards (6 بطاقات ملخص)
│   ├── FuelFraudDetector (كشف التلاعب)
│   ├── FuelConsumptionChart (شارت المقارنة)
│   ├── FuelBudgetForecaster (تنبؤ الميزانية)
│   ├── FuelRecordForm (نموذج محسّن + GPS + صورة بون)
│   └── FuelRecordsList (قائمة السجلات)
│
├── 3. Internal Tank Module (التانكات الداخلية)
│   └── مخزون الوقود الداخلي + تنبيهات إعادة التعبئة
│
└── 4. Maintenance Auto-Trigger
    └── ربط الاستهلاك الزائد → أمر صيانة تلقائي
```

---

## التفاصيل

### 1. Hook حسابات الوقود (`useFuelCalculations`)
- حساب **L/100km** لكل مركبة من فارق عداد الكيلومترات بين تعبئتين متتاليتين
- مقارنة الاستهلاك الفعلي بـ **المعيار المتوقع** حسب نوع المركبة (جدول مرجعي)
- حساب **درجة كفاءة الوقود** لكل سائق (Fuel Efficiency Score)
- توقع **ميزانية الشهر القادم** بناءً على متوسط آخر 3 أشهر

### 2. كشف التلاعب (Fraud Detection)
- **Geofence Validation**: مقارنة إحداثيات GPS للسائق وقت التعبئة بموقع المحطة المسجلة
- **KM vs Liters**: لو الاستهلاك > 150% من المتوقع → Red Flag فوري
- **تكرار التعبئة**: لو نفس السائق عبّأ مرتين في يوم واحد → Yellow Flag
- **عرض مرئي**: بطاقات التنبيهات بألوان (أحمر/أصفر/أخضر) مع تفاصيل كل حالة مشبوهة

### 3. نموذج التسجيل المحسّن
- إضافة حقل **المركبة** (ربط بـ `fleet_vehicles`)
- إضافة **رفع صورة البون** (receipt_url موجود فعلاً في الجدول)
- التقاط **إحداثيات GPS تلقائياً** عند التسجيل (للتحقق لاحقاً)
- حساب **الإجمالي تلقائياً** + عرض **المسافة منذ آخر تعبئة**

### 4. لوحة التحليلات
- **6 بطاقات ملخص**: إجمالي لترات، إجمالي تكلفة، متوسط L/100km، أكفأ سائق، أكثر سائق استهلاكاً، عدد التنبيهات
- **شارت مقارنة**: Recharts bar chart يقارن استهلاك المركبات من نفس النوع
- **توقع الميزانية**: عرض التكلفة المتوقعة للشهر القادم مع نسبة الثقة

### 5. التانكات الداخلية
- قسم جديد لإدارة **مخزون الوقود الداخلي** (لو المصنع عنده تانك)
- تتبع الرصيد الحالي + تنبيه عند وصول المستوى لـ 20%
- سجل السحب من التانك مربوط بالسائق والمركبة

### 6. الربط مع الصيانة
- لو استهلاك مركبة زاد > 30% فجأة عن متوسطها → إنشاء تنبيه صيانة تلقائي
- عرض رابط مباشر لصفحة الصيانة الوقائية من بطاقة التنبيه

---

## تغييرات قاعدة البيانات

إضافة أعمدة لجدول `fuel_records`:
- `latitude` / `longitude` (إحداثيات وقت التعبئة)
- `vehicle_plate` (لوحة المركبة)
- `km_since_last_fill` (محسوبة)
- `l_per_100km` (محسوبة)
- `fraud_flags` (JSONB للتنبيهات)

جدول جديد `fuel_tanks`:
- `id`, `organization_id`, `tank_name`, `fuel_type`, `capacity_liters`, `current_level`, `location`, `last_refill_date`

جدول جديد `fuel_tank_transactions`:
- `id`, `tank_id`, `transaction_type` (fill/withdraw), `liters`, `driver_id`, `vehicle_plate`, `recorded_at`

---

## الملفات

| الملف | الإجراء |
|-------|---------|
| `src/hooks/useFuelCalculations.ts` | إنشاء - محرك الحسابات |
| `src/components/fuel/FuelDashboardCards.tsx` | إنشاء - 6 بطاقات ملخص |
| `src/components/fuel/FuelFraudDetector.tsx` | إنشاء - كشف التلاعب |
| `src/components/fuel/FuelConsumptionChart.tsx` | إنشاء - شارت المقارنة |
| `src/components/fuel/FuelBudgetForecaster.tsx` | إنشاء - تنبؤ الميزانية |
| `src/components/fuel/FuelRecordForm.tsx` | إنشاء - نموذج محسّن |
| `src/components/fuel/FuelTankManager.tsx` | إنشاء - التانكات الداخلية |
| `src/components/fuel/FuelMaintenanceLink.tsx` | إنشاء - ربط الصيانة |
| `src/pages/dashboard/FuelManagement.tsx` | إعادة بناء كاملة (موديولي) |
| Migration SQL | إضافة أعمدة + جدولين جديدين |

---

## النتيجة المتوقعة

صفحة وقود ذكية متكاملة بـ 8 مكونات موديولية تغطي:
- تسجيل محسّن مع GPS وصور
- كشف تلاعب تلقائي (Geofence + KM/L)
- تحليلات بصرية ومقارنات بين المركبات
- تنبؤ ميزانية شهرية
- إدارة تانكات داخلية
- ربط تلقائي مع نظام الصيانة

