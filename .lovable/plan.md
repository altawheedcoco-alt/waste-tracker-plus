

# البند ١: تدقيق وإصلاح أمان RLS الشامل

## ما تم اكتشافه

الفحص الأمني كشف **15 مشكلة**، منها **8 حرجة (error)** و **7 تحذيرات (warn)**:

### المشاكل الحرجة (يجب إصلاحها فوراً)

| # | الجدول | المشكلة |
|---|--------|---------|
| 1 | `shipment_movement_supervisors` | خطأ في سياسة RLS: `p.organization_id = p.organization_id` (مقارنة ذاتية - دائماً true) — أي مستخدم يمكنه التعديل |
| 2 | `tracking_tokens` | جميع رموز التتبع مكشوفة للعامة بدون مصادقة |
| 3 | `audit_sessions` | رموز وصول المدققين مكشوفة للعامة |
| 4 | `driver_quick_links` | أسماء وأرقام هواتف ورخص السائقين مكشوفة بدون تحقق من الرمز |
| 5 | `organization_shipment_links` | روابط الشحنات مع إحداثيات وعناوين مكشوفة |
| 6 | `organization_deposit_links` | بيانات حسابات بنكية مكشوفة |
| 7 | `compliance_certificates` | شهادات الامتثال لكل المنظمات مقروءة للعامة |
| 8 | `shared_documents` | المستندات المشاركة قابلة للاستعراض بدون تحقق من الرمز |
| 9 | `worker_profiles` | الرقم القومي والهاتف والعنوان مكشوف لكل المستخدمين |

### التحذيرات

| # | المشكلة |
|---|---------|
| 1 | Extensions في schema العام |
| 2-3 | سياسات RLS بقيمة `true` دائماً (INSERT/UPDATE/DELETE) |
| 4 | `security_check_settings` مقروءة لكل المستخدمين |
| 5 | `waste_flow_analytics` مقروءة لكل المستخدمين |
| 6 | `cyber_defense_rules` و `threat_patterns` مكشوفة |

---

## خطة الإصلاح

### المرحلة ١: إصلاح الثغرات الحرجة (Migration واحدة)

**1. `shipment_movement_supervisors`** — إصلاح المقارنة الذاتية:
- استبدال `p.organization_id = p.organization_id` بمقارنة مع organization_id الفعلي للشحنة عبر JOIN مع جدول shipments

**2. الجداول ذات الوصول العام بدون تحقق من الرمز** (`tracking_tokens`, `audit_sessions`, `driver_quick_links`, `organization_shipment_links`, `organization_deposit_links`, `shared_documents`):
- حذف سياسات SELECT العامة (public/anon) الحالية
- إنشاء سياسات جديدة تتطلب مطابقة الرمز (token) المرسل من المستخدم
- مثال: `USING (token = current_setting('request.headers')::json->>'x-access-token')`

**3. `compliance_certificates`** — تقييد الوصول:
- استبدال `USING (true)` بسياسة تسمح فقط بالتحقق عبر verification_code محدد أو للمستخدمين المصادق عليهم

**4. `worker_profiles`** — حماية البيانات الشخصية:
- تقييد SELECT ليشمل العامل نفسه + المنظمات التي تقدم لها بطلب عمل
- إخفاء الأعمدة الحساسة (national_id, phone, email, date_of_birth, address) من العرض العام

### المرحلة ٢: إصلاح التحذيرات

**5. `security_check_settings`, `waste_flow_analytics`, `cyber_defense_rules`, `threat_patterns`**:
- تقييد القراءة للمديرين فقط عبر دالة `has_role(auth.uid(), 'admin')`
- `waste_flow_analytics` تُقيد بالمنظمة المالكة

### المرحلة ٣: تحديث الكود

- تعديل المكونات التي تقرأ من الجداول المحمية لتمرير الرمز (token) في الطلب
- التأكد من أن صفحات التتبع العامة والروابط المشاركة تعمل بعد التعديل

---

## الملفات المتأثرة

- **Migration SQL جديدة**: لتحديث كل سياسات RLS أعلاه
- **مكونات تحتاج تعديل**: صفحات التتبع العامة، صفحات الروابط المشاركة، وأي مكون يستخدم الجداول المتأثرة

