

# خطة التطوير الشاملة للجهة الناقلة — ٨ ميزات تقنية متقدمة

## الرؤية
تحويل الجهة الناقلة من نظام تشغيلي إلى **منصة ذكاء لوجستي متكاملة** تواكب معايير 2026 العالمية.

---

## الوضع الحالي (ما هو موجود)

| الميزة | الحالة |
|--------|--------|
| Edge Functions (route-optimizer, demand-forecaster, capacity-planner, maintenance-predictor) | ✅ موجودة |
| Hooks (useRouteOptimizer, useDemandForecaster, useCapacityPlanner) | ✅ موجودة |
| لوحة الناقل (10 تبويبات: overview, operations, fleet, tracking, performance, ai, finance, compliance, sustainability, partners) | ✅ موجودة |
| TripCostManagement, FuelManagement, PreventiveMaintenance | ✅ موجودة (بيانات ثابتة) |
| TransporterAITools (3 تبويبات: analytics, detailed, advisor) | ✅ موجودة |

## ما ينقص (الفجوات)

الصفحات والـ Hooks موجودة لكن **غير مربوطة ببعضها** ولا تعمل ببيانات حية في كل الحالات. المطلوب هو **ربط وتعزيز وإضافة**.

---

## الميزات الـ ٨ المطلوبة

### ١. لوحة KPI مركزية ذكية (Smart KPI Command Center)
**المشكلة:** البيانات مبعثرة في عدة widgets بدون رؤية موحدة.
**الحل:** بناء مكون `TransporterSmartKPIs` يجمع:
- مؤشر الأداء الزمني (On-Time Rate) — حي من `shipments`
- معدل استغلال الأسطول — حي من `fleet_vehicles` + `shipments`
- تكلفة الكيلومتر — حي من `trip_costs` + `fuel_records`
- مؤشر رضا العملاء — من `partner_ratings`
- اتجاه الأداء (Sparkline charts) مع مقارنة بالأسبوع/الشهر السابق
- تنبيهات ذكية عند انحراف أي مؤشر عن المعدل

**الملفات:** مكون جديد `TransporterSmartKPIs.tsx` + إضافته في تبويب `overview`

### ٢. تحسين المسار الذكي بالـ AI (Smart Route Optimization UI)
**المشكلة:** Edge function `ai-route-optimizer` موجودة + Hook موجود لكن **لا يوجد واجهة مستخدم** تربطهم.
**الحل:** بناء مكون `SmartRouteOptimizer.tsx`:
- اختيار السائق + عرض شحناته المعلقة تلقائياً
- عرض المسار على خريطة Leaflet قبل وبعد التحسين
- عرض التوفير (مسافة، وقت، وقود، CO2)
- زر "تطبيق المسار" يحدّث ترتيب التسليم

**الملفات:** مكون جديد + إضافته في تبويب `tracking` أو `ai`

### ٣. تجميع الحمولات الذكي (Load Consolidation Engine)
**المشكلة:** لا يوجد نظام لدمج شحنات متعددة في رحلة واحدة.
**الحل:** Edge function جديدة `ai-load-consolidator` + مكون `LoadConsolidator.tsx`:
- يحلل الشحنات المعلقة (نفس المنطقة الجغرافية + نفس النوع)
- يقترح تجميعات مع حساب التوفير
- زر "تنفيذ التجميع" ينشئ رحلة موحدة

**الملفات:** Edge function جديدة + مكون UI + إضافة في تبويب `operations`

### ٤. التنبؤ بالطلب مع واجهة بصرية (Demand Forecasting Dashboard)
**المشكلة:** Hook `useDemandForecaster` + Edge function موجودان لكن **بدون واجهة**.
**الحل:** مكون `DemandForecastDashboard.tsx`:
- يسحب البيانات التاريخية من `shipments` تلقائياً
- يعرض الرسوم البيانية (Recharts) للتنبؤات
- يعرض أيام الذروة وتوصيات الموارد
- دعم الفترات (يومي/أسبوعي/شهري)

**الملفات:** مكون جديد + إضافته في تبويب `ai`

### ٥. الصيانة التنبؤية بالـ AI (Predictive Maintenance AI)
**المشكلة:** صفحة `PreventiveMaintenance` تستخدم **بيانات ثابتة مبرمجة**.
**الحل:** ربطها بـ Edge function `ai-maintenance-predictor` + بيانات حية:
- سحب بيانات المركبات من `fleet_vehicles`
- سحب سجلات الصيانة من `vehicle_maintenance_logs`
- سحب بيانات الوقود والمسافات من `trip_costs` + `fuel_records`
- تحليل AI لتوقع الأعطال القادمة

**الملفات:** تعديل `PreventiveMaintenance.tsx` أو بناء `PredictiveMaintenanceAI.tsx`

### ٦. تحليل تكلفة الرحلة الشامل (Trip Cost Analytics)
**المشكلة:** `TripCostManagement` موجود لكن بدون تحليلات عميقة.
**الحل:** مكون `TripCostAnalytics.tsx`:
- تكلفة الكيلومتر لكل سائق/مركبة
- مقارنة الربحية بين المسارات
- تحليل هدر الوقود (استهلاك فعلي vs متوقع)
- رسوم بيانية زمنية للاتجاهات

**الملفات:** مكون جديد + إضافته في تبويب `finance`

### ٧. تخطيط السعة الذكي (Capacity Planning UI)
**المشكلة:** Hook `useCapacityPlanner` + Edge function موجودان بدون واجهة.
**الحل:** مكون `CapacityPlanningDashboard.tsx`:
- يجمع بيانات الموارد تلقائياً (مركبات، سائقين، تخزين)
- يعرض تحليل السعة الحالية بمؤشر بصري
- يعرض متطلبات المستقبل وخطة العمل
- دعم أفق التخطيط (7 أيام / 30 يوم / 90 يوم / سنة)

**الملفات:** مكون جديد + إضافته في تبويب `ai`

### ٨. ETA الذكي الحي (Smart Live ETA)
**المشكلة:** يوجد `estimated_arrival` في الشحنات لكن لا يُحدَّث ديناميكياً.
**الحل:** مكون `SmartETAWidget.tsx` + تعزيز Edge function:
- حساب ETA بناءً على الموقع الحالي للسائق + حركة المرور
- تحديث تلقائي كل دقيقة للشحنات النشطة
- إشعار الأطراف المعنية عند تغير ETA بأكثر من 15 دقيقة
- عرض في بطاقة الشحنة وفي مركز التتبع

**الملفات:** مكون جديد + تعديل `TrackingCenter.tsx`

---

## التفاصيل التقنية

### Edge Functions الجديدة
- `ai-load-consolidator` — تحليل AI لتجميع الشحنات (يستخدم Lovable AI Gateway)

### المكونات الجديدة (8 ملفات)
```text
src/components/dashboard/transporter/
├── TransporterSmartKPIs.tsx          (١)
├── SmartRouteOptimizer.tsx           (٢)
├── LoadConsolidator.tsx              (٣)
├── DemandForecastDashboard.tsx       (٤)
├── PredictiveMaintenanceAI.tsx       (٥)
├── TripCostAnalytics.tsx             (٦)
├── CapacityPlanningDashboard.tsx     (٧)
└── SmartETAWidget.tsx                (٨)
```

### الملفات المعدّلة
- `TransporterDashboard.tsx` — إضافة lazy imports للمكونات الجديدة
- `TransporterOperationsTabs.tsx` — إدراج LoadConsolidator
- `TransporterIntelligenceTabs.tsx` — إدراج DemandForecast + CapacityPlanning + PredictiveMaintenance
- تبويب `overview` — إضافة SmartKPIs + SmartETA
- تبويب `tracking` — إضافة SmartRouteOptimizer
- تبويب `finance` — إضافة TripCostAnalytics

### مبدأ التنفيذ
كل مكون يعمل بالمبدأ المزدوج: **تلقائي أولاً + يدوي متاح دائماً**
- البيانات تُسحب حية من قاعدة البيانات
- تحليلات AI تعمل تلقائياً مع زر "تحديث" يدوي
- Recharts للرسوم البيانية البصرية

---

## ملخص التأثير

| البُعد | التأثير |
|--------|---------|
| **الكفاءة** | تقليل تكاليف النقل ٢٥-٤٠٪ عبر تحسين المسارات وتجميع الحمولات |
| **التنبؤ** | توقع الطلب والأعطال قبل حدوثها بأسابيع |
| **الرؤية** | لوحة KPI موحدة تعرض صحة العمليات لحظياً |
| **العملاء** | ETA دقيق وحي يعزز ثقة العملاء |
| **التكنولوجيا** | ٤ Edge Functions AI مفعّلة + واجهة لكل منها |

