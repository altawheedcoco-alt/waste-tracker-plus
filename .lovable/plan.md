# خطة تنفيذ الموسم الثالث — رندر + تكبير الخطوط + نشر مع دمج الموسيقي 

## الوضع الحالي

- الموسم الثالث مكتوب بالكامل (5 حلقات: Ep11-Ep15) في مجلد `remotion/src/videos/season3/`
- **غير منشور** على المنصة — صفحة VideoSeries.tsx تعرض الموسم 1 و 2 فقط
- أحجام الخطوط الحالية في S3Common: العنوان 56px، الإنجليزي 24px، الوصف 18px، النصوص الداخلية 15-16px

## الخطة

### 1. تكبير الخطوط في S3Common.tsx

تحديث أحجام الخطوط في المكونات المشتركة للموسم الثالث:


| المكون                   | الحالي        | الجديد |
| ------------------------ | ------------- | ------ |
| S3Header عنوان عربي      | 56px          | 64px   |
| S3Header إنجليزي         | 24px          | 30px   |
| S3Header وصف             | 18px          | 22px   |
| S3Feature عنوان عربي     | 22px          | 28px   |
| S3Feature إنجليزي        | 12px          | 16px   |
| S3Feature وصف            | 15px          | 19px   |
| S3Stat قيمة              | 30px          | 38px   |
| S3Stat عنوان             | 15px          | 19px   |
| GlassCard محتوى          | حسب الاستخدام | +4px   |
| النصوص الداخلية بالحلقات | 16px          | 20px   |


وكذلك تكبير الخطوط داخل كل حلقة (Ep11-Ep15) بنفس النسبة.

### 2. اختيار الوضع: الليلي (Dark)

الوضع الليلي هو الأنسب لأسلوب "Clean Futuristic" — التدرجات اللونية والتوهجات تبرز بشكل أفضل على الخلفية الداكنة.

### 3. رندر 5 فيديوهات (Dark فقط)

رندر كل حلقة باستخدام Remotion CLI:

- `ep11-dark` → `/videos/ep11-dark.mp4`
- `ep12-dark` → `/videos/ep12-dark.mp4`
- `ep13-dark` → `/videos/ep13-dark.mp4`
- `ep14-dark` → `/videos/ep14-dark.mp4`
- `ep15-dark` → `/videos/ep15-dark.mp4`

ثم نسخها إلى `public/videos/`

### 4. إنشاء أغلفة بالذكاء الاصطناعي

توليد 5 أغلفة بالذكاء الاصطناعي (بدون نصوص عربية — إنجليزي فقط):

- Ep11: Smart Notifications
- Ep12: Financial Management
- Ep13: Workforce Management
- Ep14: Call Center
- Ep15: Compliance & Regulations

### 5. نشر على المنصة

تحديث `src/pages/dashboard/VideoSeries.tsx`:

- إضافة الموسم الثالث في مصفوفة `seasons`
- إضافة 5 حلقات جديدة في مصفوفة `videos` (dark فقط بدون light)
- ربط الأغلفة والفيديوهات

### الملفات المتأثرة

1. `remotion/src/videos/season3/S3Common.tsx` — تكبير الخطوط
2. `remotion/src/videos/season3/Ep11Notifications.tsx` — تكبير خطوط داخلية
3. `remotion/src/videos/season3/Ep12Finance.tsx` — تكبير خطوط داخلية
4. `remotion/src/videos/season3/Ep13Workforce.tsx` — تكبير خطوط داخلية
5. `remotion/src/videos/season3/Ep14CallCenter.tsx` — تكبير خطوط داخلية
6. `remotion/src/videos/season3/Ep15Compliance.tsx` — تكبير خطوط داخلية
7. `src/pages/dashboard/VideoSeries.tsx` — إضافة الموسم الثالث
8. `public/thumbnails/ep11-15-cover.jpg` — أغلفة جديدة
9. `public/videos/ep11-15-dark.mp4` — فيديوهات مرندرة