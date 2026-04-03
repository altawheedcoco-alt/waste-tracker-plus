

# تدقيق شامل لمنظومة الإشعارات — النتائج والخطة

## الوضع الحالي

### الأرقام الفعلية

```text
┌─────────────────────────────────────┬───────┐
│ المصدر                              │ العدد │
├─────────────────────────────────────┼───────┤
│ سجل الأنواع (notificationTypes.ts) │  196  │
│ أنواع إضافية في SQL Triggers فقط   │  108  │
│ إجمالي أنواع الإشعارات الفريدة     │  304  │
│ مشغلات SQL (INSERT INTO notif.)    │  196  │
│ استدعاءات Frontend (notifyAction)  │   39  │
└─────────────────────────────────────┴───────┘
```

### المشكلة
108 نوع إشعار موجودين في SQL Triggers لكن **غير مسجلين** في السجل المركزي `notificationTypes.ts`. هذا يعني:
- لا يوجد لهم توجيه ذكي (Deep Linking)
- لا يوجد لهم صوت مخصص
- لا يوجد لهم أولوية محددة
- لا يظهرون بشكل صحيح في فلاتر الإشعارات

### أمثلة على الأنواع المفقودة (108 نوع)

```text
الفئة                  │ أنواع مفقودة
───────────────────────┼──────────────────────────────────────────
الشحنات والعمليات     │ new_shipment, shipment_offer, delivery_confirmed,
                       │ collection_request, collection_trip_assigned,
                       │ collection_trip_status, scheduled_collection,
                       │ proof_of_service, loading_worker
السائقين               │ driver_emergency, driver_emergency_admin,
                       │ driver_alert_admin, driver_online, driver_rating,
                       │ driver_financial, earning
المالية                │ wallet, wallet_transaction, counter_offer,
                       │ contract_penalty, carbon_credit
الامتثال               │ sla_violation, corrective_action, audit_session,
                       │ compliance_doc_admin, consultant_review
السوق                  │ auction_bid, auction_status, marketplace_bid,
                       │ waste_auction
الأعضاء والموارد      │ daily_attendance, hr_request, job_title_updated,
                       │ employee_document_uploaded, permissions_updated,
                       │ member_invitation_sent/accepted, member_status_admin
التدوير والتخلص       │ disposal_byproduct, disposal_certificate,
                       │ recycler_timeslot, production_batch_new,
                       │ recycling_report_generator
البلديات               │ municipal_contract, citizen_complaint,
                       │ complaint_status, wmis_event, operational_plan
الأمن والاحتيال       │ fraud_alert, transport_incident, crisis_incident
التوثيق                │ document_signature, signature_rejected, signing_rejected
IoT والسلامة          │ (iot_alert, safety_inspection — via triggers)
الدعم                  │ support_ticket, support_ticket_status,
                       │ copilot_task, customer_conversation
```

---

## خطة التنفيذ

### المرحلة 1: تسجيل الـ 108 نوع المفقودة
- إضافتهم إلى `src/lib/notificationTypes.ts` بالفئة والمسار والصوت والأولوية المناسبة
- إضافتهم إلى `src/lib/notificationRouting.ts` للتوجيه الذكي

### المرحلة 2: توحيد الأسماء
- بعض الأنواع مكررة بأسماء مختلفة (مثلاً `partner_link` vs `partner_linked`، `new_shipment` vs `shipment_created`)
- توحيد عبر alias map بدلاً من تغيير SQL لتجنب كسر البيانات القديمة

### المرحلة 3: ضمان التغطية الثلاثية
- الـ Database Trigger (`trg_auto_notify_channels`) الذي تم تنفيذه سابقاً يضمن أن **كل** INSERT في جدول notifications يُرسل تلقائياً عبر FCM + WhatsApp
- لذلك التغطية الثلاثية مضمونة بالفعل لجميع الـ 304 نوع

### التفاصيل التقنية
- **الملفات المتأثرة**: `notificationTypes.ts` (إضافة ~108 نوع)، `notificationRouting.ts` (إضافة routes)
- **لا يوجد تعديل على قاعدة البيانات**: الأنواع موجودة فعلاً في SQL، المطلوب فقط تسجيلها في الـ Frontend
- **لا يوجد خطر على البيانات القائمة**: إضافة فقط بدون حذف أو تعديل

