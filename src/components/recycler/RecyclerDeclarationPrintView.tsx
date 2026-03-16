import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { format } from 'date-fns';

const WASTE_TYPE_LABELS: Record<string, string> = {
  plastic: 'بلاستيك', paper: 'ورق', metal: 'معادن', glass: 'زجاج',
  electronic: 'إلكترونيات', organic: 'عضوية', chemical: 'كيميائية',
  medical: 'طبية', construction: 'مخلفات بناء', other: 'أخرى',
};

const CATEGORY_LABELS: Record<string, string> = {
  hazardous: 'مخلفات خطرة',
  non_hazardous: 'مخلفات غير خطرة',
  medical: 'مخلفات طبية',
};

interface Props {
  declaration: any;
  organization: any;
}

export default function RecyclerDeclarationPrintView({ declaration, organization }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html dir="rtl"><head><title>إقرار استلام ${declaration.declaration_number}</title>
      <style>
        @media print { body { margin: 0; } @page { size: A4; margin: 15mm 15mm 20mm 15mm; } }
        body { font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif; direction: rtl; padding: 15mm 15mm 20mm 15mm; font-size: 11px; line-height: 1.6; color: #1a1a1a; }
        h1 { font-size: 18px; text-align: center; margin-bottom: 4px; }
        h2 { font-size: 14px; border-bottom: 2px solid #333; padding-bottom: 4px; margin-top: 16px; }
        h3 { font-size: 12px; background: #f0f0f0; padding: 4px 8px; margin-top: 12px; }
        table { width: 100%; border-collapse: collapse; margin: 8px 0; }
        th, td { border: 1px solid #999; padding: 4px 6px; text-align: right; font-size: 10px; }
        th { background: #e8e8e8; font-weight: bold; }
        .header { text-align: center; border-bottom: 3px double #333; padding-bottom: 12px; margin-bottom: 16px; }
        .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 12px 0; }
        .meta-item { background: #f8f8f8; padding: 6px 10px; border-radius: 4px; }
        .meta-label { font-weight: bold; color: #555; font-size: 10px; }
        .entity-info { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px; font-size: 10px; margin: 4px 0 8px; background: #fafafa; padding: 6px; border-radius: 4px; }
        .footer { margin-top: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .sig-box { border: 1px solid #ccc; padding: 12px; min-height: 80px; text-align: center; }
        .total-row { font-weight: bold; background: #f0f0f0; }
      </style></head><body>${content.innerHTML}</body></html>
    `);
    win.document.close();
    setTimeout(() => { win.print(); }, 500);
  };

  const data = declaration.declaration_data as any;
  const sources = (data?.sources || []).filter((s: any) => s.included !== false);

  const fmtDate = (d: string | null | undefined) => {
    if (!d) return '-';
    try { return format(new Date(d), 'yyyy/MM/dd'); } catch { return d; }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handlePrint} className="gap-2"><Printer className="h-4 w-4" /> طباعة</Button>
      </div>

      <div ref={printRef}>
        <div className="header">
          <h1>إقرار استلام مخلفات</h1>
          <p style={{ fontSize: '13px', fontWeight: 'bold' }}>{CATEGORY_LABELS[declaration.waste_category] || declaration.waste_category}</p>
          <p style={{ fontSize: '10px', color: '#666' }}>صادر من جهة التدوير / إعادة التصنيع</p>
        </div>

        <div className="meta-grid">
          <div className="meta-item"><span className="meta-label">رقم الإقرار: </span>{declaration.declaration_number}</div>
          <div className="meta-item"><span className="meta-label">نوع الإقرار: </span>{declaration.declaration_type === 'auto' ? 'تلقائي' : 'يدوي'}</div>
          <div className="meta-item"><span className="meta-label">الفترة من: </span>{fmtDate(declaration.period_from)}</div>
          <div className="meta-item"><span className="meta-label">الفترة إلى: </span>{fmtDate(declaration.period_to)}</div>
          <div className="meta-item"><span className="meta-label">اسم جهة التدوير: </span>{organization?.name || ''}</div>
          <div className="meta-item"><span className="meta-label">إجمالي الشحنات: </span>{declaration.total_shipments}</div>
        </div>

        <h2>بيانات جهة التدوير (المستلم)</h2>
        <div className="entity-info">
          <div><span className="meta-label">السجل التجاري: </span>{organization?.commercial_register || '-'}</div>
          <div><span className="meta-label">الترخيص البيئي: </span>{organization?.environmental_license || '-'}</div>
          <div><span className="meta-label">الممثل القانوني: </span>{organization?.representative_name || '-'}</div>
          <div><span className="meta-label">العنوان: </span>{organization?.address || '-'}</div>
          <div><span className="meta-label">المدينة: </span>{organization?.city || '-'}</div>
          <div><span className="meta-label">الهاتف: </span>{organization?.phone || '-'}</div>
        </div>

        <h2>الجهات المُسلِّمة والمخلفات المستلمة</h2>
        {sources.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#999', padding: '12px' }}>لا توجد بيانات</p>
        ) : sources.map((src: any, si: number) => (
          <div key={si}>
            <h3>{si + 1}. {src.name} ({src.type === 'generator' ? 'جهة مولدة' : 'ناقل'})</h3>
            <div className="entity-info">
              <div><span className="meta-label">سجل تجاري: </span>{src.commercial_register || '-'}</div>
              <div><span className="meta-label">ترخيص بيئي: </span>{src.environmental_license || '-'}</div>
              <div><span className="meta-label">الممثل القانوني: </span>{src.representative_name || '-'}</div>
              <div><span className="meta-label">العنوان: </span>{src.address || '-'} {src.city ? `- ${src.city}` : ''}</div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>رقم الشحنة</th>
                  <th>نوع المخلف</th>
                  <th>الكمية</th>
                  <th>الوحدة</th>
                  <th>تاريخ الاستلام</th>
                  <th>الناقل</th>
                  <th>اسم السائق</th>
                  <th>لوحة المركبة</th>
                </tr>
              </thead>
              <tbody>
                {(src.shipments || []).map((sh: any, shi: number) => (
                  <tr key={shi}>
                    <td>{sh.shipment_number}</td>
                    <td>{WASTE_TYPE_LABELS[sh.waste_type] || sh.waste_type}</td>
                    <td>{sh.quantity}</td>
                    <td>{sh.unit}</td>
                    <td>{fmtDate(sh.date)}</td>
                    <td>{sh.transporter_name || '-'}</td>
                    <td>{sh.driver_name || '-'}</td>
                    <td>{sh.vehicle_plate || '-'}</td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td colSpan={2}>الإجمالي</td>
                  <td>{(src.shipments || []).reduce((s: number, sh: any) => s + (sh.quantity || 0), 0).toFixed(2)}</td>
                  <td colSpan={5}>{(src.shipments || []).length} شحنة</td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}

        {declaration.notes && (
          <>
            <h2>ملاحظات</h2>
            <p style={{ padding: '8px', background: '#f8f8f8', borderRadius: '4px' }}>{declaration.notes}</p>
          </>
        )}

        <p style={{ textAlign: 'center', margin: '16px 0', fontSize: '11px', fontWeight: 'bold' }}>
          نقر نحن الموقعين أدناه باستلام المخلفات الموضحة أعلاه وسيتم التعامل معها وفقاً للأنظمة واللوائح البيئية المعمول بها
        </p>

        <div className="footer">
          <div className="sig-box">
            <p style={{ fontWeight: 'bold', marginBottom: '40px' }}>توقيع وختم جهة التدوير (المستلم)</p>
            <p>الاسم: {organization?.representative_name || '.........................'}</p>
            <p>التاريخ: {format(new Date(), 'yyyy/MM/dd')}</p>
          </div>
          <div className="sig-box">
            <p style={{ fontWeight: 'bold', marginBottom: '40px' }}>توقيع الجهة المُسلِّمة</p>
            <p>الاسم: .........................</p>
            <p>التاريخ: .........................</p>
          </div>
        </div>
      </div>
    </div>
  );
}
