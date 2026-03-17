import React from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import TermsBackPage from '@/components/print/TermsBackPage';

interface DisposalCertificateData {
  certificate_number: string;
  verification_code?: string;
  issue_date: string;
  waste_type: string;
  waste_description?: string;
  disposal_method: string;
  quantity: number;
  unit?: string;
  environmental_compliance_score?: number;
  operation_number?: string;
  facility_name?: string;
  facility_address?: string;
  facility_license?: string;
  client_name?: string;
  client_address?: string;
  hazard_level?: string;
  incineration_temperature?: number;
  landfill_cell_id?: string;
  processing_started_at?: string;
  processing_completed_at?: string;
  receiving_officer?: string;
  weight_ticket_number?: string;
  stamp_url?: string | null;
  signature_url?: string | null;
}

interface DisposalCertificatePrintProps {
  data: DisposalCertificateData;
  includeStamp?: boolean;
  includeSignature?: boolean;
}

const methodLabels: Record<string, string> = {
  incineration: 'الحرق في محرقة مرخصة',
  landfill: 'الدفن الصحي في خلايا مبطنة',
  chemical_treatment: 'المعالجة الفيزيائية/الكيميائية (التحييد)',
};

const DisposalCertificatePrint = ({ data, includeStamp = true, includeSignature = true }: DisposalCertificatePrintProps) => {
  const qrValue = `${window.location.origin}/qr-verify?type=disposal&code=${encodeURIComponent(data.certificate_number)}`;
  const issueDate = format(new Date(data.issue_date), 'dd MMMM yyyy', { locale: ar });

  return (
    <div
      className="bg-white mx-auto print:p-0 print:shadow-none print-break-after"
      style={{
        maxWidth: '210mm',
        fontFamily: 'Cairo, sans-serif',
        direction: 'rtl',
        fontSize: '9pt',
        lineHeight: '1.5',
        padding: '15mm 15mm 20mm 15mm',
        pageBreakAfter: 'always',
      }}
    >
      {/* Top decorative border */}
      <div style={{ borderTop: '4px double #b91c1c', paddingTop: '12px' }}>
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div style={{ width: '25%' }}>
            <Barcode value={data.certificate_number} width={1} height={30} fontSize={7} displayValue />
          </div>
          <div className="text-center flex-1 px-4">
            <h1 style={{ fontSize: '18pt', fontWeight: 'bold', color: '#991b1b', marginBottom: '4px' }}>
              شهادة التخلص الآمن النهائي
            </h1>
            <p style={{ fontSize: '11pt', color: '#b91c1c', fontWeight: '600' }}>Certificate of Safe Final Disposal</p>
            <p style={{ fontSize: '8pt', color: '#666', marginTop: '6px' }}>
              رقم الشهادة: <span style={{ fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '1px' }}>{data.certificate_number}</span>
            </p>
          </div>
          <div style={{ width: '25%' }} className="flex justify-end">
            <QRCodeSVG value={qrValue} size={80} level="H" />
          </div>
        </div>

        {/* Official declaration */}
        <div className="mb-5 p-4 rounded-lg" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
          <p style={{ fontSize: '10pt', fontWeight: 'bold', color: '#991b1b', textAlign: 'center', marginBottom: '8px' }}>
            إقرار رسمي بالتخلص الآمن من النفايات
          </p>
          <p style={{ fontSize: '9pt', color: '#1f2937', textAlign: 'center', lineHeight: '1.8' }}>
            نشهد نحن <strong>{data.facility_name || 'منشأة التخلص الآمن'}</strong> بأنه قد تم التخلص
            النهائي والآمن من النفايات الموصوفة أدناه وفقاً للمعايير البيئية والقانونية المنظمة،
            طبقاً لقانون البيئة رقم 4 لسنة 1994 المعدل بالقانون 9 لسنة 2009 ولائحته التنفيذية.
          </p>
        </div>

        {/* Two-column info */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          {/* Facility info */}
          <div className="p-3 rounded-lg" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '10pt', fontWeight: 'bold', color: '#991b1b', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
              🏭 بيانات جهة التخلص
            </h3>
            <table style={{ width: '100%', fontSize: '8pt' }}>
              <tbody>
                <tr><td style={{ color: '#666', padding: '3px 0', width: '35%' }}>اسم المنشأة:</td><td style={{ fontWeight: 'bold' }}>{data.facility_name || '-'}</td></tr>
                <tr><td style={{ color: '#666', padding: '3px 0' }}>العنوان:</td><td>{data.facility_address || '-'}</td></tr>
                <tr><td style={{ color: '#666', padding: '3px 0' }}>رقم الترخيص:</td><td>{data.facility_license || '-'}</td></tr>
              </tbody>
            </table>
          </div>
          {/* Client info */}
          <div className="p-3 rounded-lg" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '10pt', fontWeight: 'bold', color: '#1e40af', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
              🏢 بيانات العميل (المولّد)
            </h3>
            <table style={{ width: '100%', fontSize: '8pt' }}>
              <tbody>
                <tr><td style={{ color: '#666', padding: '3px 0', width: '35%' }}>اسم الجهة:</td><td style={{ fontWeight: 'bold' }}>{data.client_name || '-'}</td></tr>
                <tr><td style={{ color: '#666', padding: '3px 0' }}>العنوان:</td><td>{data.client_address || '-'}</td></tr>
                <tr><td style={{ color: '#666', padding: '3px 0' }}>رقم العملية:</td><td style={{ fontFamily: 'monospace' }}>{data.operation_number || '-'}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Waste details */}
        <div className="mb-5">
          <h3 style={{ fontSize: '10pt', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
            📦 وصف النفايات وتفاصيل التخلص
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8pt' }}>
            <tbody>
              {[
                ['نوع النفايات', data.waste_type],
                ['الوصف التفصيلي', data.waste_description || '-'],
                ['مستوى الخطورة', data.hazard_level === 'hazardous' ? '⚠️ خطرة' : '✅ غير خطرة'],
                ['الكمية', `${data.quantity} ${data.unit || 'طن'}`],
                ['سند الوزن', data.weight_ticket_number || '-'],
                ['طريقة التخلص', methodLabels[data.disposal_method] || data.disposal_method],
                ...(data.disposal_method === 'incineration' && data.incineration_temperature ? [['درجة حرارة المحرقة', `${data.incineration_temperature}°C`]] : []),
                ...(data.disposal_method === 'landfill' && data.landfill_cell_id ? [['رقم خلية الدفن', data.landfill_cell_id]] : []),
                ['تاريخ بدء المعالجة', data.processing_started_at ? format(new Date(data.processing_started_at), 'dd/MM/yyyy hh:mm a', { locale: ar }) : '-'],
                ['تاريخ إتمام المعالجة', data.processing_completed_at ? format(new Date(data.processing_completed_at), 'dd/MM/yyyy hh:mm a', { locale: ar }) : '-'],
                ['المسؤول المستلم', data.receiving_officer || '-'],
              ].map(([label, value], i) => (
                <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#f9fafb' : '#ffffff' }}>
                  <td style={{ border: '1px solid #e5e7eb', padding: '6px 10px', fontWeight: '600', color: '#374151', width: '35%' }}>{label}</td>
                  <td style={{ border: '1px solid #e5e7eb', padding: '6px 10px' }}>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Compliance score */}
        {data.environmental_compliance_score != null && (
          <div className="mb-5 p-3 rounded-lg text-center" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <p style={{ fontSize: '8pt', color: '#666' }}>درجة الامتثال البيئي</p>
            <p style={{ fontSize: '24pt', fontWeight: 'bold', color: '#16a34a' }}>{data.environmental_compliance_score}%</p>
            <p style={{ fontSize: '7pt', color: '#666' }}>استوفت العملية كافة المتطلبات البيئية والرقابية</p>
          </div>
        )}

        {/* Legal notice */}
        <div className="mb-5 p-3 rounded" style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', fontSize: '7pt', color: '#92400e' }}>
          <p><strong>تنبيه قانوني:</strong> هذه الشهادة صادرة وفقاً لأحكام القانون رقم 4 لسنة 1994 بشأن حماية البيئة ولائحته التنفيذية، وقانون إدارة المخلفات رقم 202 لسنة 2020. أي تلاعب أو تزوير في هذه الشهادة يُعرض مرتكبه للمساءلة الجنائية.</p>
        </div>

        {/* Signature section with QR */}
        <div className="pt-4" style={{ borderTop: '2px solid #991b1b' }}>
          <div className="grid grid-cols-2 gap-8">
            <div className="text-center">
              <p style={{ fontWeight: 'bold', fontSize: '9pt', marginBottom: '8px' }}>مدير المنشأة / المشرف</p>
              <p style={{ fontSize: '8pt', color: '#666', marginBottom: '12px' }}>{data.facility_name}</p>
              <div className="flex items-center justify-center gap-4">
                {includeStamp && data.stamp_url && (
                  <div className="text-center">
                    <img src={data.stamp_url} alt="ختم" style={{ width: '70px', height: '70px', objectFit: 'contain', opacity: 0.9 }} crossOrigin="anonymous" />
                    <p style={{ fontSize: '6pt', color: '#9ca3af' }}>الختم</p>
                  </div>
                )}
                {includeSignature && data.signature_url && (
                  <div className="text-center">
                    <img src={data.signature_url} alt="توقيع" style={{ width: '80px', height: '40px', objectFit: 'contain' }} crossOrigin="anonymous" />
                    <p style={{ fontSize: '6pt', color: '#9ca3af' }}>التوقيع</p>
                  </div>
                )}
              </div>
              {/* Signer QR */}
              <div className="mt-2 flex justify-center">
                <QRCodeSVG 
                  value={`${window.location.origin}/qr-verify?type=signer&code=${encodeURIComponent(data.facility_license || data.certificate_number)}&doc=${encodeURIComponent(data.certificate_number)}`} 
                  size={30} 
                  level="L" 
                />
              </div>
              <p style={{ fontSize: '5pt', color: '#9ca3af', marginTop: '2px' }}>QR الموقع</p>
            </div>
            <div className="text-center">
              <p style={{ fontWeight: 'bold', fontSize: '9pt', marginBottom: '8px' }}>ممثل العميل (المولّد)</p>
              <p style={{ fontSize: '8pt', color: '#666', marginBottom: '12px' }}>{data.client_name}</p>
              <div style={{ borderBottom: '1px dotted #999', width: '150px', margin: '30px auto 0' }} />
              <p style={{ fontSize: '6pt', color: '#9ca3af', marginTop: '4px' }}>التوقيع</p>
              {/* Client QR placeholder */}
              <div className="mt-2 flex justify-center">
                <QRCodeSVG 
                  value={`${window.location.origin}/qr-verify?type=signer&code=${encodeURIComponent(data.client_name || 'client')}&doc=${encodeURIComponent(data.certificate_number)}`} 
                  size={30} 
                  level="L" 
                />
              </div>
              <p style={{ fontSize: '5pt', color: '#9ca3af', marginTop: '2px' }}>QR الموقع</p>
            </div>
          </div>
          <p className="text-center" style={{ fontSize: '7pt', color: '#9ca3af', marginTop: '16px' }}>
            تاريخ الإصدار: {issueDate} • رمز التحقق: {data.verification_code || '-'}
          </p>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-2 text-center" style={{ borderTop: '1px dashed #d1d5db', fontSize: '7pt', color: '#9ca3af' }}>
          <p>هذه الشهادة صادرة إلكترونياً — يمكن التحقق من صحتها بمسح رمز QR</p>
          {data.processing_completed_at && (
            <p style={{ margin: '4px 0 0 0', fontSize: '7pt', color: '#6b7280' }}>
              📅 تاريخ وصول الشحنة (أول تسجيل على المنظومة): {format(new Date(data.processing_completed_at), 'dd/MM/yyyy - hh:mm a', { locale: ar })}
            </p>
          )}
        </div>
      </div>
      <TermsBackPage />
    </div>
  );
};

export default DisposalCertificatePrint;
