import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { format } from 'date-fns';

const WASTE_CAT_LABELS: Record<string, string> = {
  municipal_solid: 'مخلفات بلدية صلبة',
  hazardous: 'مخلفات خطرة',
  construction: 'مخلفات هدم وبناء',
  medical: 'مخلفات طبية',
  electronic: 'مخلفات إلكترونية',
  organic: 'مخلفات عضوية',
};

interface Props {
  plan: any;
  organization: any;
}

export default function AnnualPlanPrintView({ plan, organization }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html dir="rtl"><head><title>خطة العمل السنوية ${plan.plan_number}</title>
      <style>
        @media print { body { margin: 0; } @page { size: A4; margin: 15mm 15mm 20mm 15mm; } }
        body { font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif; direction: rtl; padding: 15mm 15mm 20mm 15mm; font-size: 11px; line-height: 1.7; color: #1a1a1a; }
        h1 { font-size: 20px; text-align: center; margin-bottom: 4px; color: #1a5632; }
        h2 { font-size: 14px; border-bottom: 2px solid #1a5632; padding-bottom: 4px; margin-top: 20px; color: #1a5632; }
        table { width: 100%; border-collapse: collapse; margin: 8px 0; }
        th, td { border: 1px solid #999; padding: 5px 8px; text-align: right; font-size: 10px; }
        th { background: #e8f5e9; font-weight: bold; }
        .header { text-align: center; border-bottom: 3px double #1a5632; padding-bottom: 14px; margin-bottom: 20px; }
        .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 12px 0; }
        .meta-item { background: #f8faf8; padding: 6px 10px; border-radius: 4px; border-right: 3px solid #1a5632; }
        .meta-label { font-weight: bold; color: #555; font-size: 10px; }
        .badge { display: inline-block; background: #e8f5e9; color: #1a5632; padding: 2px 8px; border-radius: 12px; font-size: 10px; margin: 2px; }
        .section-text { background: #fafafa; padding: 8px 12px; border-radius: 4px; margin: 4px 0; white-space: pre-wrap; }
        .footer { margin-top: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .sig-box { border: 1px solid #ccc; padding: 12px; min-height: 80px; text-align: center; }
        .legal-note { background: #fff8e1; border: 1px solid #f9a825; padding: 8px 12px; border-radius: 4px; margin-top: 16px; font-size: 10px; }
      </style></head><body>${content.innerHTML}</body></html>
    `);
    win.document.close();
    setTimeout(() => { win.print(); }, 500);
  };

  const cd = plan.company_data || {};
  const vehicles = plan.vehicles_data || [];
  const od = plan.operations_data || {};
  const routes = (od as any)?.routes || [];
  const orgStructure = (od as any)?.org_structure || [];
  const dp = plan.disposal_plan || {};
  const sp = plan.safety_procedures || {};
  const workforce = (plan.workforce_data as any)?.workforce || [];
  const subs = plan.subcontractors || [];
  const cats = plan.waste_categories || [];
  const entityType = plan.entity_type || 'transporter';
  const entityLabel = entityType === 'disposal' ? 'جهة التخلص النهائي' : 'الجهة الناقلة';

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handlePrint} className="gap-2"><Printer className="h-4 w-4" /> طباعة</Button>
      </div>

      <div ref={printRef}>
        <div className="header">
          <p style={{ fontSize: '12px', color: '#666' }}>جمهورية مصر العربية - جهاز تنظيم إدارة المخلفات (WMRA)</p>
          <h1>خطة العمل السنوية - {entityLabel}</h1>
          <p style={{ fontSize: '13px', fontWeight: 'bold' }}>وفقاً لقانون تنظيم إدارة المخلفات رقم 202 لسنة 2020</p>
          <p style={{ fontSize: '11px', color: '#666' }}>رقم الخطة: {plan.plan_number} | السنة: {plan.plan_year}</p>
        </div>

        {/* Section 1: Company Data */}
        <h2>أولاً: بيانات {entityLabel}</h2>
        <div className="meta-grid">
          <div className="meta-item"><span className="meta-label">اسم الشركة: </span>{cd.name || organization?.name || '-'}</div>
          <div className="meta-item"><span className="meta-label">السجل التجاري: </span>{cd.commercial_register || '-'}</div>
          <div className="meta-item"><span className="meta-label">البطاقة الضريبية: </span>{cd.tax_card || '-'}</div>
          <div className="meta-item"><span className="meta-label">الترخيص السابق: </span>{cd.previous_license || '-'}</div>
          <div className="meta-item"><span className="meta-label">العنوان: </span>{cd.address || '-'}</div>
          <div className="meta-item"><span className="meta-label">الممثل القانوني: </span>{cd.representative || '-'}</div>
          <div className="meta-item"><span className="meta-label">الهاتف: </span>{cd.phone || '-'}</div>
          <div className="meta-item"><span className="meta-label">البريد الإلكتروني: </span>{cd.email || '-'}</div>
        </div>

        {/* Section 2: Org Structure */}
        <h2>ثانياً: الهيكل التنظيمي</h2>
        {orgStructure.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#999', padding: '8px' }}>لم يتم تحديد الهيكل التنظيمي</p>
        ) : (
          <table>
            <thead>
              <tr><th>الإدارة</th><th>المنصب</th><th>الاسم</th><th>الهاتف</th><th>المسؤوليات</th></tr>
            </thead>
            <tbody>
              {orgStructure.map((o: any, i: number) => (
                <tr key={i}><td>{o.department}</td><td>{o.position}</td><td>{o.person_name || '-'}</td><td>{o.phone || '-'}</td><td>{o.responsibilities}</td></tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Section 3: Waste Types */}
        <h2>ثالثاً: أنواع المخلفات {entityType === 'disposal' ? 'المستقبَلة' : 'المنقولة'}</h2>
        <div style={{ padding: '8px' }}>
          {cats.length === 0 ? <p>غير محدد</p> : cats.map((c: string) => (
            <span key={c} className="badge">{WASTE_CAT_LABELS[c] || c}</span>
          ))}
        </div>

        {/* Section 4: Vehicles */}
        <h2>رابعاً: بيان المعدات والمركبات</h2>
        {vehicles.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#999', padding: '8px' }}>لا توجد بيانات</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>م</th>
                <th>رقم اللوحة</th>
                <th>نوع المركبة</th>
                <th>السعة</th>
                <th>الحالة الفنية</th>
                <th>مغطاة</th>
                <th>انتهاء الرخصة</th>
                <th>انتهاء التأمين</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v: any, i: number) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{v.plate_number}</td>
                  <td>{v.vehicle_type}</td>
                  <td>{v.capacity}</td>
                  <td>{v.condition}</td>
                  <td>{v.covered ? 'نعم' : 'لا'}</td>
                  <td>{v.license_expiry || '-'}</td>
                  <td>{v.insurance_expiry || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p style={{ fontSize: '10px', color: '#666' }}>إجمالي المركبات: {vehicles.length}</p>

        {/* Section 5: Routes */}
        <h2>خامساً: منظومة التشغيل والمسارات</h2>
        {routes.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#999', padding: '8px' }}>لا توجد مسارات</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>م</th>
                <th>اسم المسار</th>
                <th>نقطة التجميع</th>
                <th>الوجهة (الترحيل/المعالجة)</th>
                <th>نوع المخلف</th>
                <th>التكرار</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((r: any, i: number) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{r.route_name}</td>
                  <td>{r.collection_point}</td>
                  <td>{r.destination}</td>
                  <td>{r.waste_type}</td>
                  <td>{r.frequency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Section 6: Subcontractors */}
        {subs.length > 0 && (
          <>
            <h2>سادساً: المقاولون من الباطن</h2>
            <table>
              <thead>
                <tr><th>م</th><th>اسم المقاول</th><th>السجل التجاري</th><th>رقم الترخيص</th><th>نطاق العمل</th></tr>
              </thead>
              <tbody>
                {subs.map((s: any, i: number) => (
                  <tr key={i}><td>{i + 1}</td><td>{s.name}</td><td>{s.commercial_register}</td><td>{s.license_number}</td><td>{s.scope}</td></tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* Section 6: Disposal */}
        <h2>{subs.length > 0 ? 'سابعاً' : 'سادساً'}: خطة التخلص الآمن</h2>
        <div className="meta-grid">
          <div className="meta-item"><span className="meta-label">موقع التخلص النهائي: </span>{dp.disposal_site || '-'}</div>
          <div className="meta-item"><span className="meta-label">نوع التخلص: </span>{dp.disposal_type || '-'}</div>
          <div className="meta-item"><span className="meta-label">مرجع العقد: </span>{dp.contract_reference || '-'}</div>
        </div>

        <h2>{subs.length > 0 ? 'ثامناً' : 'سابعاً'}: إجراءات السلامة البيئية</h2>
        {sp.spill_response && <><p style={{ fontWeight: 'bold', fontSize: '10px' }}>إجراءات التعامل مع الانسكابات والحوادث:</p><div className="section-text">{sp.spill_response}</div></>}
        {sp.odor_control && <><p style={{ fontWeight: 'bold', fontSize: '10px' }}>تدابير الحد من الروائح وتناثر المخلفات:</p><div className="section-text">{sp.odor_control}</div></>}
        {sp.ppe_policy && <><p style={{ fontWeight: 'bold', fontSize: '10px' }}>سياسة معدات الحماية الشخصية:</p><div className="section-text">{sp.ppe_policy}</div></>}
        {sp.emergency_contacts && <><p style={{ fontWeight: 'bold', fontSize: '10px' }}>جهات اتصال الطوارئ:</p><div className="section-text">{sp.emergency_contacts}</div></>}

        <h2>{subs.length > 0 ? 'تاسعاً' : 'ثامناً'}: العمالة والتدريب</h2>
        {workforce.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#999', padding: '8px' }}>لا توجد بيانات</p>
        ) : (
          <table>
            <thead>
              <tr><th>الدور الوظيفي</th><th>العدد</th><th>حالة التدريب</th></tr>
            </thead>
            <tbody>
              {workforce.map((w: any, i: number) => (
                <tr key={i}><td>{w.role}</td><td>{w.count}</td><td>{w.training_status}</td></tr>
              ))}
              <tr style={{ fontWeight: 'bold', background: '#f0f0f0' }}>
                <td>الإجمالي</td>
                <td>{workforce.reduce((s: number, w: any) => s + (w.count || 0), 0)}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        )}

        {plan.notes && (
          <><h2>ملاحظات</h2><div className="section-text">{plan.notes}</div></>
        )}

        <div className="legal-note">
          <strong>تنويه قانوني:</strong> وفقاً للمادة (29) من قانون تنظيم إدارة المخلفات رقم 202 لسنة 2020، يُعد الالتزام بهذه الخطة شرطاً أساسياً لاستمرار الترخيص. يحق لجهاز تنظيم إدارة المخلفات (WMRA) إلغاء الترخيص أو وقف النشاط في حال مخالفة الخطة التشغيلية.
        </div>

        <div className="footer" style={{ marginTop: '30px' }}>
          <div className="sig-box">
            <p style={{ fontWeight: 'bold', marginBottom: '40px' }}>توقيع وختم {entityLabel}</p>
            <p>الاسم: {cd.representative || '.........................'}</p>
            <p>التاريخ: {format(new Date(), 'yyyy/MM/dd')}</p>
          </div>
          <div className="sig-box">
            <p style={{ fontWeight: 'bold', marginBottom: '40px' }}>اعتماد جهاز تنظيم إدارة المخلفات (WMRA)</p>
            <p>الاسم: .........................</p>
            <p>التاريخ: .........................</p>
          </div>
        </div>
      </div>
    </div>
  );
}
