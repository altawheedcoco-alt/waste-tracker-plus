/**
 * RecyclerDeclarationPrintView — A4 Secured Print for Recycler Declarations
 * Applies unified security system: Guilloche, Watermark, MICR, QR/Barcode
 */
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import { generateMICRLineHTML, generateVerticalStampHTML } from '@/lib/printSecurityUtils';
import { useDocumentService } from '@/hooks/useDocumentService';

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

const FS = '6.5pt';
const HP = '2px 4px';

export default function RecyclerDeclarationPrintView({ declaration, organization }: Props) {
  const printRef = useRef<HTMLDivElement>(null);
  const { printWithTheme, downloadPDF, isProcessing } = useDocumentService({
    filename: `إقرار-استلام-${declaration.declaration_number || 'draft'}`,
  });

  const data = declaration.declaration_data as any;
  const sources = (data?.sources || []).filter((s: any) => s.included !== false);
  const verificationCode = declaration.declaration_number || 'DRAFT';
  const qrValue = `${window.location.origin}/qr-verify?type=declaration&code=${encodeURIComponent(verificationCode)}`;

  const fmtDate = (d: string | null | undefined) => {
    if (!d) return '-';
    try { return format(new Date(d), 'yyyy/MM/dd'); } catch { return d; }
  };

  const cellStyle = (isLabel = false): React.CSSProperties => ({
    border: '1px solid #d1d5db',
    padding: HP,
    fontSize: FS,
    lineHeight: '1.25',
    textAlign: 'right',
    color: '#000',
    ...(isLabel ? { background: '#f3f4f6', fontWeight: '700' } : {}),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => downloadPDF(printRef.current)} disabled={isProcessing} className="gap-2">
          <Download className="h-4 w-4" /> حفظ PDF
        </Button>
        <Button onClick={() => printWithTheme(printRef.current, 'classic')} disabled={isProcessing} className="gap-2">
          <Printer className="h-4 w-4" /> طباعة
        </Button>
      </div>

      <div
        ref={printRef}
        dir="rtl"
        style={{
          width: '210mm',
          minHeight: '297mm',
          maxHeight: '297mm',
          margin: '0 auto',
          padding: '15mm',
          fontFamily: 'Cairo, sans-serif',
          fontSize: FS,
          color: '#000',
          background: '#fff',
          position: 'relative',
          overflow: 'hidden',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* ═══ HEADER ═══ */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #16a34a', paddingBottom: '4px', marginBottom: '6px' }}>
          <div style={{ textAlign: 'center' }}>
            <QRCodeSVG value={qrValue} size={45} level="M" />
            <div style={{ fontSize: '5pt', color: '#6b7280', marginTop: '1px' }}>امسح للتحقق</div>
          </div>

          <div style={{ textAlign: 'center', flex: 1, padding: '0 8px' }}>
            <div style={{ fontSize: '13pt', fontWeight: 'bold', color: '#15803d', margin: 0 }}>
              إقرار استلام مخلفات
            </div>
            <div style={{ fontSize: '8pt', fontWeight: 'bold', color: '#374151' }}>
              {CATEGORY_LABELS[declaration.waste_category] || declaration.waste_category}
            </div>
            <div style={{ fontSize: '6pt', color: '#6b7280' }}>صادر من جهة التدوير / إعادة التصنيع</div>
            <div style={{ display: 'inline-block', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '3px', padding: '1px 6px', marginTop: '2px' }}>
              <span style={{ fontSize: FS }}>رقم الإقرار: </span>
              <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#15803d', fontSize: '8pt' }}>{verificationCode}</span>
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <Barcode value={verificationCode} width={1} height={28} fontSize={0} displayValue={false} />
            <div style={{ fontFamily: 'monospace', fontSize: '5.5pt', color: '#374151', marginTop: '1px' }}>{verificationCode}</div>
          </div>
        </div>

        {/* ═══ META GRID ═══ */}
        <table style={{ borderCollapse: 'collapse', marginBottom: '4px', width: '100%' }}>
          <tbody>
            <tr>
              <td style={cellStyle(true)}>رقم الإقرار</td>
              <td style={cellStyle()}>{declaration.declaration_number}</td>
              <td style={cellStyle(true)}>نوع الإقرار</td>
              <td style={cellStyle()}>{declaration.declaration_type === 'auto' ? 'تلقائي' : 'يدوي'}</td>
              <td style={cellStyle(true)}>إجمالي الشحنات</td>
              <td style={cellStyle()}>{declaration.total_shipments}</td>
            </tr>
            <tr>
              <td style={cellStyle(true)}>الفترة من</td>
              <td style={cellStyle()}>{fmtDate(declaration.period_from)}</td>
              <td style={cellStyle(true)}>الفترة إلى</td>
              <td style={cellStyle()}>{fmtDate(declaration.period_to)}</td>
              <td style={cellStyle(true)}>اسم جهة التدوير</td>
              <td style={cellStyle()}>{organization?.name || '-'}</td>
            </tr>
          </tbody>
        </table>

        {/* ═══ RECYCLER INFO ═══ */}
        <table style={{ borderCollapse: 'collapse', marginBottom: '4px', width: '100%' }}>
          <tbody>
            <tr><td colSpan={6} style={{ ...cellStyle(true), background: '#d1fae5', textAlign: 'center', color: '#065f46', fontSize: '7pt' }}>بيانات جهة التدوير (المستلم)</td></tr>
            <tr>
              <td style={cellStyle(true)}>السجل التجاري</td>
              <td style={cellStyle()}>{organization?.commercial_register || '-'}</td>
              <td style={cellStyle(true)}>الترخيص البيئي</td>
              <td style={cellStyle()}>{organization?.environmental_license || '-'}</td>
              <td style={cellStyle(true)}>الممثل القانوني</td>
              <td style={cellStyle()}>{organization?.representative_name || '-'}</td>
            </tr>
            <tr>
              <td style={cellStyle(true)}>العنوان</td>
              <td style={cellStyle()}>{organization?.address || '-'}</td>
              <td style={cellStyle(true)}>المدينة</td>
              <td style={cellStyle()}>{organization?.city || '-'}</td>
              <td style={cellStyle(true)}>الهاتف</td>
              <td style={cellStyle()}>{organization?.phone || '-'}</td>
            </tr>
          </tbody>
        </table>

        {/* ═══ SOURCES ═══ */}
        <table style={{ borderCollapse: 'collapse', marginBottom: '4px', width: '100%' }}>
          <tbody>
            <tr><td colSpan={8} style={{ ...cellStyle(true), background: '#fef3c7', textAlign: 'center', color: '#92400e', fontSize: '7pt' }}>الجهات المُسلِّمة والمخلفات المستلمة</td></tr>
          </tbody>
        </table>
        {sources.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#9ca3af', padding: '6px', fontSize: FS }}>لا توجد بيانات</div>
        ) : sources.map((src: any, si: number) => (
          <div key={si} style={{ marginBottom: '4px' }}>
            <div style={{ background: '#f8fafc', padding: '2px 4px', fontSize: FS, fontWeight: 'bold', borderBottom: '1px solid #e2e8f0' }}>
              {si + 1}. {src.name} ({src.type === 'generator' ? 'جهة مولدة' : 'ناقل'})
            </div>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr>
                  {['رقم الشحنة', 'نوع المخلف', 'الكمية', 'الوحدة', 'تاريخ الاستلام', 'الناقل', 'اسم السائق', 'لوحة المركبة'].map(h => (
                    <td key={h} style={cellStyle(true)}>{h}</td>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(src.shipments || []).map((sh: any, shi: number) => (
                  <tr key={shi}>
                    <td style={{ ...cellStyle(), fontFamily: 'monospace' }}>{sh.shipment_number}</td>
                    <td style={cellStyle()}>{WASTE_TYPE_LABELS[sh.waste_type] || sh.waste_type}</td>
                    <td style={cellStyle()}>{sh.quantity}</td>
                    <td style={cellStyle()}>{sh.unit}</td>
                    <td style={cellStyle()}>{fmtDate(sh.date)}</td>
                    <td style={cellStyle()}>{sh.transporter_name || '-'}</td>
                    <td style={cellStyle()}>{sh.driver_name || '-'}</td>
                    <td style={cellStyle()}>{sh.vehicle_plate || '-'}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={2} style={{ ...cellStyle(true), background: '#d1fae5' }}>الإجمالي</td>
                  <td style={{ ...cellStyle(), fontWeight: 'bold' }}>{(src.shipments || []).reduce((s: number, sh: any) => s + (sh.quantity || 0), 0).toFixed(2)}</td>
                  <td colSpan={5} style={cellStyle()}>{(src.shipments || []).length} شحنة</td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}

        {/* ═══ NOTES ═══ */}
        {declaration.notes && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '3px', padding: '3px 6px', marginBottom: '4px', fontSize: FS }}>
            <strong>ملاحظات:</strong> {declaration.notes}
          </div>
        )}

        {/* ═══ LEGAL DECLARATION ═══ */}
        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '3px', padding: '3px 6px', marginBottom: '4px', fontSize: FS, textAlign: 'center', fontWeight: 'bold' }}>
          نقر نحن الموقعين أدناه باستلام المخلفات الموضحة أعلاه وسيتم التعامل معها وفقاً للأنظمة واللوائح البيئية المعمول بها
        </div>

        {/* ═══ SIGNATURES ═══ */}
        <table style={{ borderCollapse: 'collapse', marginBottom: '0', width: '100%', marginTop: 'auto' }}>
          <tbody>
            <tr><td colSpan={2} style={{ ...cellStyle(true), background: '#e0e7ff', textAlign: 'center', color: '#312e81', fontSize: '7pt' }}>التوقيعات والأختام</td></tr>
            <tr>
              <td style={{ width: '50%', textAlign: 'center', padding: '6px', border: '1px solid #d1d5db', verticalAlign: 'top' }}>
                <div style={{ fontWeight: 'bold', fontSize: FS, marginBottom: '20px' }}>توقيع وختم جهة التدوير (المستلم)</div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', minHeight: '25px', alignItems: 'flex-end' }}>
                  {organization?.stamp_url && <img src={organization.stamp_url} alt="ختم" style={{ maxHeight: '25px', maxWidth: '25px', objectFit: 'contain' }} crossOrigin="anonymous" />}
                  {organization?.signature_url && <img src={organization.signature_url} alt="توقيع" style={{ maxHeight: '20px', maxWidth: '40px', objectFit: 'contain' }} crossOrigin="anonymous" />}
                </div>
                <div style={{ borderTop: '1px dashed #9ca3af', marginTop: '4px', paddingTop: '2px', fontSize: '5pt', color: '#6b7280' }}>
                  {organization?.representative_name || '..........................'}
                </div>
                <div style={{ fontSize: '5pt', color: '#6b7280' }}>التاريخ: {format(new Date(), 'yyyy/MM/dd')}</div>
              </td>
              <td style={{ width: '50%', textAlign: 'center', padding: '6px', border: '1px solid #d1d5db', verticalAlign: 'top' }}>
                <div style={{ fontWeight: 'bold', fontSize: FS, marginBottom: '20px' }}>توقيع الجهة المُسلِّمة</div>
                <div style={{ minHeight: '25px' }} />
                <div style={{ borderTop: '1px dashed #9ca3af', marginTop: '4px', paddingTop: '2px', fontSize: '5pt', color: '#6b7280' }}>
                  .........................
                </div>
                <div style={{ fontSize: '5pt', color: '#6b7280' }}>التاريخ: .........................</div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ═══ SECURITY FOOTER ═══ */}
        <div style={{ marginTop: '4px', textAlign: 'center', fontSize: FS, color: '#000', paddingTop: '2px', borderTop: '1px solid #e5e7eb', background: 'rgba(241,245,249,0.5)', borderRadius: '0 0 3px 3px' }}>
          <div style={{ fontWeight: '600' }}>تم إنشاء هذا النموذج بواسطة نظام إدارة المخلفات الذكي</div>
          <div style={{ fontFamily: 'monospace', fontSize: '5.5pt' }}>
            رقم التتبع: {verificationCode} | {format(new Date(), 'dd/MM/yyyy hh:mm a', { locale: ar })}
          </div>
          <div style={{ marginTop: '2px' }} dangerouslySetInnerHTML={{ __html: generateVerticalStampHTML() }} />
          <div style={{ marginTop: '1px' }} dangerouslySetInnerHTML={{ __html: generateMICRLineHTML(organization?.client_code, verificationCode) }} />
        </div>
      </div>
    </div>
  );
}
