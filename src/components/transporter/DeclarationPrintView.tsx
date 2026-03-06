import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

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

export default function DeclarationPrintView({ declaration, organization }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html dir="rtl"><head><title>إقرار ${declaration.declaration_number}</title>
      <style>
        @media print { body { margin: 0; } }
        body { font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif; direction: rtl; padding: 20px; font-size: 11px; line-height: 1.6; color: #1a1a1a; }
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
  const generators = data?.generators || [];
  const recyclers = data?.recyclers || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handlePrint} className="gap-2">
          <Printer className="h-4 w-4" />
          طباعة
        </Button>
      </div>

      <div ref={printRef}>
        {/* Header */}
        <div className="header">
          <h1>إقرار ناقل المخلفات</h1>
          <p style={{ fontSize: '13px', fontWeight: 'bold' }}>{CATEGORY_LABELS[declaration.waste_category] || declaration.waste_category}</p>
          <p style={{ fontSize: '10px', color: '#666' }}>
            مقدم إلى: جهاز تنظيم إدارة المخلفات (WMRA)
          </p>
        </div>

        {/* Meta */}
        <div className="meta-grid">
          <div className="meta-item">
            <span className="meta-label">رقم الإقرار: </span>
            {declaration.declaration_number}
          </div>
          <div className="meta-item">
            <span className="meta-label">نوع الإقرار: </span>
            {declaration.declaration_type === 'auto' ? 'تلقائي' : 'يدوي'}
          </div>
          <div className="meta-item">
            <span className="meta-label">الفترة من: </span>
            {format(new Date(declaration.period_from), 'yyyy/MM/dd')}
          </div>
          <div className="meta-item">
            <span className="meta-label">الفترة إلى: </span>
            {format(new Date(declaration.period_to), 'yyyy/MM/dd')}
          </div>
          <div className="meta-item">
            <span className="meta-label">اسم الناقل: </span>
            {organization?.name || ''}
          </div>
          <div className="meta-item">
            <span className="meta-label">إجمالي الشحنات: </span>
            {declaration.total_shipments}
          </div>
        </div>

        {/* Transporter Legal Info */}
        <h2>بيانات الناقل</h2>
        <div className="entity-info">
          <div><span className="meta-label">السجل التجاري: </span>{organization?.commercial_register || '-'}</div>
          <div><span className="meta-label">الترخيص البيئي: </span>{organization?.environmental_license || '-'}</div>
          <div><span className="meta-label">الممثل القانوني: </span>{organization?.representative_name || '-'}</div>
          <div><span className="meta-label">العنوان: </span>{organization?.address || '-'}</div>
          <div><span className="meta-label">المدينة: </span>{organization?.city || '-'}</div>
          <div><span className="meta-label">الهاتف: </span>{organization?.phone || '-'}</div>
        </div>

        {/* Generators Section */}
        <h2>أولاً: الجهات المولدة والمخلفات المستلمة</h2>
        {generators.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#999', padding: '12px' }}>لا توجد بيانات</p>
        ) : (
          generators.map((gen: any, gi: number) => (
            <div key={gi}>
              <h3>{gi + 1}. {gen.name}</h3>
              <div className="entity-info">
                <div><span className="meta-label">سجل تجاري: </span>{gen.commercial_register || '-'}</div>
                <div><span className="meta-label">ترخيص بيئي: </span>{gen.environmental_license || '-'}</div>
                <div><span className="meta-label">الممثل القانوني: </span>{gen.representative_name || '-'}</div>
                <div><span className="meta-label">العنوان: </span>{gen.address || '-'} {gen.city ? `- ${gen.city}` : ''}</div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>رقم الشحنة</th>
                    <th>نوع المخلف</th>
                    <th>الكمية</th>
                    <th>الوحدة</th>
                    <th>تاريخ الاستلام</th>
                    <th>تاريخ التسليم</th>
                    <th>اسم السائق</th>
                    <th>لوحة المركبة</th>
                    <th>رقم الرخصة</th>
                  </tr>
                </thead>
                <tbody>
                  {gen.shipments.map((sh: any, si: number) => (
                    <tr key={si}>
                      <td>{sh.shipment_number}</td>
                      <td>{WASTE_TYPE_LABELS[sh.waste_type] || sh.waste_type}</td>
                      <td>{sh.quantity}</td>
                      <td>{sh.unit}</td>
                      <td>{sh.pickup_date ? format(new Date(sh.pickup_date), 'MM/dd') : '-'}</td>
                      <td>{sh.delivery_date ? format(new Date(sh.delivery_date), 'MM/dd') : '-'}</td>
                      <td>{sh.driver_name || '-'}</td>
                      <td>{sh.vehicle_plate || '-'}</td>
                      <td>{sh.license_number || '-'}</td>
                    </tr>
                  ))}
                  <tr className="total-row">
                    <td colSpan={2}>الإجمالي</td>
                    <td>{gen.shipments.reduce((s: number, sh: any) => s + sh.quantity, 0).toFixed(2)}</td>
                    <td colSpan={6}>{gen.shipments.length} شحنة</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ))
        )}

        {/* Recyclers Section */}
        <h2>ثانياً: جهات التدوير / التخلص والمخلفات المسلمة</h2>
        {recyclers.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#999', padding: '12px' }}>لا توجد بيانات</p>
        ) : (
          recyclers.map((rec: any, ri: number) => (
            <div key={ri}>
              <h3>{ri + 1}. {rec.name}</h3>
              <div className="entity-info">
                <div><span className="meta-label">سجل تجاري: </span>{rec.commercial_register || '-'}</div>
                <div><span className="meta-label">ترخيص بيئي: </span>{rec.environmental_license || '-'}</div>
                <div><span className="meta-label">الممثل القانوني: </span>{rec.representative_name || '-'}</div>
                <div><span className="meta-label">العنوان: </span>{rec.address || '-'} {rec.city ? `- ${rec.city}` : ''}</div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>رقم الشحنة</th>
                    <th>نوع المخلف</th>
                    <th>الكمية</th>
                    <th>الوحدة</th>
                    <th>تاريخ التسليم</th>
                    <th>اسم السائق</th>
                    <th>لوحة المركبة</th>
                  </tr>
                </thead>
                <tbody>
                  {rec.shipments.map((sh: any, si: number) => (
                    <tr key={si}>
                      <td>{sh.shipment_number}</td>
                      <td>{WASTE_TYPE_LABELS[sh.waste_type] || sh.waste_type}</td>
                      <td>{sh.quantity}</td>
                      <td>{sh.unit}</td>
                      <td>{sh.delivery_date ? format(new Date(sh.delivery_date), 'MM/dd') : '-'}</td>
                      <td>{sh.driver_name || '-'}</td>
                      <td>{sh.vehicle_plate || '-'}</td>
                    </tr>
                  ))}
                  <tr className="total-row">
                    <td colSpan={2}>الإجمالي</td>
                    <td>{rec.shipments.reduce((s: number, sh: any) => s + sh.quantity, 0).toFixed(2)}</td>
                    <td colSpan={4}>{rec.shipments.length} شحنة</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ))
        )}

        {/* Notes */}
        {declaration.notes && (
          <>
            <h2>ملاحظات</h2>
            <p style={{ padding: '8px', background: '#f8f8f8', borderRadius: '4px' }}>{declaration.notes}</p>
          </>
        )}

        {/* Footer signatures */}
        <div className="footer">
          <div className="sig-box">
            <p style={{ fontWeight: 'bold', marginBottom: '40px' }}>توقيع وختم الناقل</p>
            <p>الاسم: {organization?.representative_name || '.........................'}</p>
            <p>التاريخ: {format(new Date(), 'yyyy/MM/dd')}</p>
          </div>
          <div className="sig-box">
            <p style={{ fontWeight: 'bold', marginBottom: '40px' }}>توقيع وختم جهاز WMRA</p>
            <p>الاسم: .........................</p>
            <p>التاريخ: .........................</p>
          </div>
        </div>
      </div>
    </div>
  );
}
