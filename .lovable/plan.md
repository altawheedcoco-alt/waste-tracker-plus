

# خطة تفعيل تجربة السائق المستقل (نموذج Didi/Uber)

## الوضع الحالي

البنية التحتية موجودة بالفعل:
- جداول قاعدة البيانات: `driver_shipment_offers`, `driver_mission_offers`, `driver_financial_wallet` -- كلها موجودة
- المكونات: `DriverOfferPopup`, `IndependentOffersPanel`, `ShipmentMarketplace`, `DriverFinancialWallet`, `DriverSelfTracker` -- موجودة
- التبويبات: العروض، السوق، الشحنات، المحفظة، التحليلات -- موجودة في `DriverDashboard`
- المسارات: `/dashboard/driver-offers`, `/dashboard/shipment-market`, `/dashboard/driver-wallet` -- مسجلة

**المشكلة**: التجربة ناقصة وغير متكاملة مثل Didi -- تحتاج:

---

## التحسينات المطلوبة (7 خطوات)

### 1. شاشة الرئيسية "Go Online" -- حالة التوفر الذكية
**الملف**: `src/components/dashboard/DriverDashboard.tsx`
- إضافة زر كبير دائري "أنا متاح" / "غير متاح" بأنيميشن (مثل زر Didi Go)
- عند الضغط يبدل `is_available` في جدول `drivers` مباشرة
- يفعّل تلقائياً GPS tracking عند الاتصال
- عداد حي يوضح "متاح منذ X دقيقة"

### 2. تفعيل Geolocation المستمر عند الاتصال
**الملف الجديد**: `src/hooks/useDriverLiveLocation.ts`
- Hook يعمل فقط عندما `is_available = true`
- يرسل الموقع كل 15 ثانية إلى `driver_location_logs`
- يعرض مؤشر GPS في الهيدر (أخضر/أحمر/رمادي)
- يتكامل مع `DriverSelfTracker` الموجود

### 3. Popup العروض المحسّن (Didi-style)
**الملف**: `src/components/driver/DriverOfferPopup.tsx`
- إضافة عرض المسافة بالكيلومتر وزمن الوصول المتوقع (ETA)
- عرض سعر/كم (مثلاً: "٥ ج.م/كم")
- إضافة خريطة مصغرة للمسار (pickup → delivery)
- اهتزاز + صوت عند وصول عرض جديد
- عرض نوع المركبة المطلوبة + نوع المخلفات بأيقونات واضحة

### 4. آلية التسعير الديناميكي
**الملف**: `src/components/driver/PricingBreakdown.tsx` (جديد)
- عرض تفصيل السعر:
  - رسم بدء الرحلة (Flag-drop): ٢٥ ج.م
  - سعر الكيلومتر: ٥ ج.م × المسافة
  - رسوم انتظار: ١٠٠ ج.م/ساعة
  - مضاعف المخلفات الخطرة: ×١.٥
- مكون يُعرض داخل `DriverOfferPopup` و `ShipmentMarketplace`

### 5. شاشة تحميل الشحنة (Loading Mode)
**الملف**: `src/components/driver/ShipmentLoadingMode.tsx` (جديد)
- واجهة مخصصة تظهر بعد قبول العرض بمراحل:
  1. **متجه للاستلام**: خريطة + ملاحة + ETA
  2. **في موقع الاستلام**: زر "بدء التحميل" + كاميرا توثيق
  3. **في الطريق**: تتبع مباشر + عداد المسافة
  4. **في موقع التسليم**: زر "تم التسليم" + توقيع إلكتروني
- كل مرحلة تحدث `shipments.status` عبر Repository

### 6. محفظة مالية حقيقية (ربط البيانات)
**الملف**: `src/components/driver/DriverFinancialWallet.tsx`
- ربط المحفظة بجدول `driver_financial_wallet` الموجود فعلاً
- إضافة: أرباح اليوم، أرباح الأسبوع، رصيد معلق (Escrow)
- سجل المعاملات من `driver_wallet_transactions`
- عرض تفاصيل كل معاملة (رقم الشحنة، المبلغ، التاريخ)

### 7. التكامل الشامل في الداشبورد
**الملف**: `src/components/dashboard/DriverDashboard.tsx`
- التبويب الافتراضي للمستقل = شاشة "Go Online" بدلاً من "العروض"
- إضافة `useDriverLiveLocation` عند فتح الداشبورد
- عرض إحصائيات سريعة: (رحلات اليوم، أرباح اليوم، التقييم، معدل القبول)
- Floating Action Button للوصول السريع (SOS، موقعي، كاميرا)

---

## التفاصيل التقنية

### الملفات المعدلة
1. `src/components/dashboard/DriverDashboard.tsx` -- إعادة هيكلة التبويب الأول + زر Go Online
2. `src/components/driver/DriverOfferPopup.tsx` -- تحسين العرض بتفاصيل السعر والمسافة
3. `src/components/driver/DriverFinancialWallet.tsx` -- ربط بيانات حقيقية
4. `src/components/driver/IndependentOffersPanel.tsx` -- إضافة تفاصيل أكثر

### الملفات الجديدة
1. `src/hooks/useDriverLiveLocation.ts` -- تتبع الموقع المستمر
2. `src/components/driver/PricingBreakdown.tsx` -- تفصيل التسعير
3. `src/components/driver/ShipmentLoadingMode.tsx` -- مراحل تحميل الشحنة
4. `src/components/driver/GoOnlineButton.tsx` -- زر التوفر الرئيسي

### لا حاجة لتعديل قاعدة البيانات
كل الجداول المطلوبة موجودة: `drivers`, `driver_location_logs`, `driver_shipment_offers`, `driver_mission_offers`, `driver_financial_wallet`, `driver_wallet_transactions`, `shipments`

