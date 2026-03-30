

# خطة: خريطة القرب الذكية للناقل والسائق المستقل (Proximity Radar)

## الفكرة المُنقّحة

### من جهة الناقل:
عند فتح لوحة الإرسال، تظهر **خريطة تفاعلية** بنطاق 50 كم تعرض:
1. **السائقين المتاحين** (أخضر) — جاهزون لتلقي شحنات فوراً (أولوية أولى)
2. **السائقين المقتربين من إنهاء رحلة** (برتقالي) — في مرحلة `in_transit` ووجهتهم داخل النطاق (أولوية ثانية)
3. عدد المركبات المتاحة في دائرة الـ 50 كم مع badge ديناميكي
4. تحديث لحظي كل 15 ثانية

### من جهة السائق المستقل:
تظهر له **خريطة الطلب الساخن** (Demand Heatmap) توضح:
1. مناطق الطلب المرتفع القريبة منه (تجمع الشحنات غير المُسندة)
2. عروض المهام المتاحة كدبابيس على الخريطة
3. badge يوضح عدد الطلبات في نطاق خدمته

---

## التنفيذ البرمجي

### 1. مكون خريطة القرب للناقل `NearbyDriversRadar.tsx`
- **بيانات**: جلب السائقين المستقلين المتاحين (`is_available=true, driver_type='independent'`) مع آخر موقع من `driver_location_logs`
- **حساب المسافة**: Haversine formula لتصفية من هم داخل 50 كم من موقع الشحنة
- **السائقين المقتربين**: جلب شحنات بحالة `in_transit` مع `delivery_address` geocoded داخل النطاق
- **العرض**: Leaflet map مع:
  - دائرة شفافة 50 كم حول موقع الاستلام
  - Markers خضراء للمتاحين + برتقالية للمقتربين
  - Popup لكل سائق (اسم، تقييم، لوحة، مسافة)
  - Badge أعلى الخريطة: "X سائق متاح في نطاق 50 كم"
- **Realtime**: اشتراك على `driver_location_logs` للتحديث اللحظي

### 2. مكون خريطة الطلب للسائق `DemandHeatmapDriver.tsx`
- **بيانات**: جلب الشحنات غير المُسندة (`driver_id IS NULL, status IN ['approved','new']`) مع إحداثيات
- **تجميع**: تجميع الشحنات بالقرب الجغرافي لإنشاء "مناطق ساخنة"
- **العرض**: Leaflet map مع:
  - CircleMarkers بأحجام متفاوتة حسب تركز الطلب
  - تدرج لوني (أصفر → أحمر) حسب عدد الشحنات
  - Popup بتفاصيل الطلبات في كل منطقة
  - دائرة نطاق الخدمة (service_area_km) حول موقع السائق
- **عروض المهام**: دبابيس للعروض الموجهة للسائق من `driver_mission_offers`

### 3. Hook مشترك `useProximityData.ts`
- جلب وتصفية السائقين/الشحنات حسب المسافة
- حساب Haversine مركزي
- تصنيف: `available` vs `arriving_soon` (شحنة بحالة in_transit ووجهتها قريبة)
- Cache ذكي مع `react-query` + refetch كل 15 ثانية

### 4. دمج في الواجهات
- **DispatchToDriverPanel**: إضافة `NearbyDriversRadar` فوق قائمة الشحنات
- **DriverDashboard**: إضافة `DemandHeatmapDriver` في تبويب "فرص قريبة"

### الملفات المطلوبة:
| ملف | الإجراء |
|---|---|
| `src/hooks/useProximityData.ts` | إنشاء |
| `src/components/transporter/NearbyDriversRadar.tsx` | إنشاء |
| `src/components/driver/DemandHeatmapDriver.tsx` | إنشاء |
| `src/components/transporter/DispatchToDriverPanel.tsx` | تعديل — إضافة الخريطة |
| `src/components/dashboard/DriverDashboard.tsx` | تعديل — إضافة تبويب الفرص |

