import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import {
  Building2,
  Truck,
  Recycle,
  CheckCircle2,
  FileText,
  Scale,
  MapPin,
  Hash,
  Leaf,
} from 'lucide-react';

interface Shipment {
  id: string;
  shipment_number: string;
  waste_type: string;
  quantity: number;
  unit?: string;
  waste_description?: string;
  disposal_method?: string;
  pickup_address?: string;
  delivery_address?: string;
  pickup_date?: string | null;
  expected_delivery_date?: string | null;
  delivered_at?: string | null;
  confirmed_at?: string | null;
  generator?: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    commercial_register?: string;
    environmental_license?: string;
    representative_name?: string | null;
  } | null;
  transporter?: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    commercial_register?: string;
    environmental_license?: string;
    representative_name?: string | null;
  } | null;
  recycler?: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    commercial_register?: string;
    environmental_license?: string;
    representative_name?: string | null;
    stamp_url?: string | null;
    signature_url?: string | null;
  } | null;
}

interface RecyclerOrg {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  commercial_register?: string;
  environmental_license?: string;
  stamp_url?: string | null;
  signature_url?: string | null;
  logo_url?: string | null;
  representative_name?: string | null;
}

interface RecyclingCertificatePrintProps {
  shipment: Shipment;
  template: string;
  customNotes: string;
  processingDetails: string;
  openingDeclaration?: string;
  closingDeclaration?: string;
  recyclerOrg: RecyclerOrg | null;
}

const wasteTypeLabels: Record<string, string> = {
  plastic: 'بلاستيك',
  paper: 'ورق',
  metal: 'معادن',
  glass: 'زجاج',
  electronic: 'إلكترونيات',
  organic: 'عضوية',
  chemical: 'كيميائية',
  medical: 'طبية',
  construction: 'مخلفات بناء',
  other: 'أخرى',
};

const templateTitles: Record<string, string> = {
  standard: 'شهادة إعادة التدوير',
  detailed: 'تقرير إعادة التدوير التفصيلي',
  environmental: 'تقرير الامتثال البيئي',
  custom: 'شهادة إعادة التدوير',
};

const RecyclingCertificatePrint = ({
  shipment,
  template,
  customNotes,
  processingDetails,
  openingDeclaration,
  closingDeclaration,
  recyclerOrg,
}: RecyclingCertificatePrintProps) => {
  const currentDate = format(new Date(), 'PP', { locale: ar });
  const deliveryDate = shipment.delivered_at
    ? format(new Date(shipment.delivered_at), 'PP', { locale: ar })
    : '-';

  return (
    <div 
      className="print-container bg-white text-black print:p-0" 
      dir="rtl" 
      style={{ 
        minHeight: '297mm', 
        width: '210mm', 
        margin: '0 auto',
        padding: '25px',
        fontFamily: 'Cairo, sans-serif'
      }}
    >
      {/* Header with QR and Barcode */}
      <header className="print-header flex items-start justify-between mb-6 pb-4" style={{ borderBottom: '3px solid #16a34a' }}>
        {/* QR Code */}
        <div className="text-center print-qr">
          <QRCodeSVG
            value={`RECYCLING-CERT-${shipment.shipment_number}`}
            size={75}
            level="M"
            includeMargin={false}
          />
          <p className="text-xs mt-1" style={{ color: '#6b7280' }}>رمز التحقق</p>
        </div>

        {/* Title */}
        <div className="text-center flex-1 px-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Leaf className="w-8 h-8" style={{ color: '#16a34a' }} />
            <h1 className="text-2xl font-bold" style={{ color: '#15803d' }}>
              {templateTitles[template]}
            </h1>
            <Leaf className="w-8 h-8" style={{ color: '#16a34a' }} />
          </div>
          <p className="text-sm" style={{ color: '#4b5563' }}>إدارة المخلفات وإعادة التدوير</p>
          <div 
            className="mt-3 inline-block rounded px-4 py-2" 
            style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac' }}
          >
            <span className="text-sm">رقم الشهادة: </span>
            <span className="font-mono font-bold" style={{ color: '#15803d', fontSize: '14px' }}>
              {shipment.shipment_number}
            </span>
          </div>
        </div>

        {/* Barcode */}
        <div className="text-center print-barcode">
          <Barcode
            value={shipment.shipment_number}
            width={1.3}
            height={45}
            fontSize={9}
            displayValue={false}
          />
          <p className="text-xs font-mono mt-1" style={{ color: '#374151' }}>
            {shipment.shipment_number}
          </p>
        </div>
      </header>

      {/* Opening Declaration */}
      <div 
        className="rounded-lg p-5 mb-6 print-declaration" 
        style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}
      >
        <h2 className="font-bold mb-3 flex items-center gap-2" style={{ color: '#1e40af', fontSize: '14px' }}>
          <FileText className="w-5 h-5" />
          إقرار رسمي
        </h2>
        <div className="text-sm leading-loose" style={{ color: '#1e3a8a' }}>
          <p>
            إلى السادة / <strong>{shipment.generator?.name || 'الجهة المولدة'}</strong> - الجهة المولدة للمخلفات
          </p>
          <p>
            وإلى السادة / <strong>{shipment.transporter?.name || 'جهة النقل'}</strong> - جهة الجمع والنقل
          </p>
          <p className="mt-3">تحية طيبة وبعد،</p>
          <p className="mt-2">
            {openingDeclaration || `نفيدكم علماً بأن شركة ${recyclerOrg?.name || shipment.recycler?.name || 'جهة التدوير'} المرخصة في مجال إعادة تدوير المخلفات قد تسلمت الشحنة المشار إليها أعلاه وتم معالجتها وفقاً للإجراءات المعتمدة.`}
          </p>
        </div>
      </div>

      {/* Shipment Details Table */}
      <div className="mb-6 print-info-box">
        <h3 
          className="font-bold mb-3 flex items-center gap-2 p-2 rounded" 
          style={{ backgroundColor: '#f3f4f6', color: '#1f2937' }}
        >
          <Scale className="w-5 h-5" style={{ color: '#16a34a' }} />
          بيانات الشحنة
        </h3>
        <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td className="p-3 font-semibold" style={{ backgroundColor: '#f9fafb', width: '25%' }}>رقم الشحنة</td>
              <td className="p-3 font-mono">{shipment.shipment_number}</td>
              <td className="p-3 font-semibold" style={{ backgroundColor: '#f9fafb', width: '25%' }}>تاريخ الاستلام</td>
              <td className="p-3">{deliveryDate}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td className="p-3 font-semibold" style={{ backgroundColor: '#f9fafb' }}>نوع المخلفات</td>
              <td className="p-3">{wasteTypeLabels[shipment.waste_type] || shipment.waste_type}</td>
              <td className="p-3 font-semibold" style={{ backgroundColor: '#f9fafb' }}>الكمية</td>
              <td className="p-3 font-bold" style={{ color: '#16a34a' }}>{shipment.quantity} {shipment.unit || 'كجم'}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td className="p-3 font-semibold" style={{ backgroundColor: '#f9fafb' }}>طريقة التخلص</td>
              <td className="p-3">{shipment.disposal_method || 'إعادة التدوير'}</td>
              <td className="p-3 font-semibold" style={{ backgroundColor: '#f9fafb' }}>وصف المخلفات</td>
              <td className="p-3">{shipment.waste_description || '-'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Parties Section */}
      <div className="grid grid-cols-3 gap-4 mb-6 print-grid-3">
        {/* Generator */}
        <div className="rounded-lg p-4" style={{ border: '1px solid #e5e7eb' }}>
          <h4 className="font-bold mb-3 flex items-center gap-2 text-sm pb-2" style={{ borderBottom: '1px solid #e5e7eb', color: '#2563eb' }}>
            <Building2 className="w-4 h-4" />
            الجهة المولدة
          </h4>
          <div className="text-xs space-y-2">
            <p className="font-semibold text-sm">{shipment.generator?.name || '-'}</p>
            <p className="flex items-center gap-1" style={{ color: '#6b7280' }}>
              <MapPin className="w-3 h-3" />
              {shipment.generator?.city || '-'}
            </p>
            {shipment.generator?.commercial_register && (
              <p className="flex items-center gap-1" style={{ color: '#6b7280' }}>
                <Hash className="w-3 h-3" />
                س.ت: {shipment.generator.commercial_register}
              </p>
            )}
            {shipment.generator?.environmental_license && (
              <p className="flex items-center gap-1" style={{ color: '#6b7280' }}>
                <FileText className="w-3 h-3" />
                ترخيص: {shipment.generator.environmental_license}
              </p>
            )}
          </div>
        </div>

        {/* Transporter */}
        <div className="rounded-lg p-4" style={{ border: '1px solid #e5e7eb' }}>
          <h4 className="font-bold mb-3 flex items-center gap-2 text-sm pb-2" style={{ borderBottom: '1px solid #e5e7eb', color: '#d97706' }}>
            <Truck className="w-4 h-4" />
            جهة النقل
          </h4>
          <div className="text-xs space-y-2">
            <p className="font-semibold text-sm">{shipment.transporter?.name || '-'}</p>
            <p className="flex items-center gap-1" style={{ color: '#6b7280' }}>
              <MapPin className="w-3 h-3" />
              {shipment.transporter?.city || '-'}
            </p>
            {shipment.transporter?.commercial_register && (
              <p className="flex items-center gap-1" style={{ color: '#6b7280' }}>
                <Hash className="w-3 h-3" />
                س.ت: {shipment.transporter.commercial_register}
              </p>
            )}
            {shipment.transporter?.environmental_license && (
              <p className="flex items-center gap-1" style={{ color: '#6b7280' }}>
                <FileText className="w-3 h-3" />
                ترخيص: {shipment.transporter.environmental_license}
              </p>
            )}
          </div>
        </div>

        {/* Recycler */}
        <div className="rounded-lg p-4" style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac' }}>
          <h4 className="font-bold mb-3 flex items-center gap-2 text-sm pb-2" style={{ borderBottom: '1px solid #86efac', color: '#15803d' }}>
            <Recycle className="w-4 h-4" />
            جهة التدوير
          </h4>
          <div className="text-xs space-y-2">
            <p className="font-semibold text-sm">{recyclerOrg?.name || shipment.recycler?.name || '-'}</p>
            <p className="flex items-center gap-1" style={{ color: '#6b7280' }}>
              <MapPin className="w-3 h-3" />
              {recyclerOrg?.city || shipment.recycler?.city || '-'}
            </p>
            {(recyclerOrg?.commercial_register || shipment.recycler?.commercial_register) && (
              <p className="flex items-center gap-1" style={{ color: '#6b7280' }}>
                <Hash className="w-3 h-3" />
                س.ت: {recyclerOrg?.commercial_register || shipment.recycler?.commercial_register}
              </p>
            )}
            {(recyclerOrg?.environmental_license || shipment.recycler?.environmental_license) && (
              <p className="flex items-center gap-1" style={{ color: '#6b7280' }}>
                <FileText className="w-3 h-3" />
                ترخيص: {recyclerOrg?.environmental_license || shipment.recycler?.environmental_license}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Processing Details */}
      {processingDetails && (
        <div className="mb-6 print-info-box">
          <h3 
            className="font-bold mb-3 flex items-center gap-2 p-2 rounded" 
            style={{ backgroundColor: '#f3f4f6', color: '#1f2937' }}
          >
            <Recycle className="w-5 h-5" style={{ color: '#16a34a' }} />
            تفاصيل عملية المعالجة والتدوير
          </h3>
          <div 
            className="rounded p-4 text-sm leading-relaxed" 
            style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}
          >
            {processingDetails}
          </div>
        </div>
      )}

      {/* Custom Notes */}
      {customNotes && (
        <div className="mb-6 print-info-box">
          <h3 
            className="font-bold mb-3 flex items-center gap-2 p-2 rounded" 
            style={{ backgroundColor: '#f3f4f6', color: '#1f2937' }}
          >
            <FileText className="w-5 h-5" style={{ color: '#16a34a' }} />
            ملاحظات إضافية
          </h3>
          <div 
            className="rounded p-4 text-sm leading-relaxed" 
            style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}
          >
            {customNotes}
          </div>
        </div>
      )}

      {/* Closing Declaration */}
      <div 
        className="rounded-lg p-5 mb-6 print-declaration print-avoid-break" 
        style={{ backgroundColor: '#f0fdf4', border: '2px solid #86efac' }}
      >
        <h2 className="font-bold mb-3 flex items-center gap-2" style={{ color: '#15803d', fontSize: '14px' }}>
          <CheckCircle2 className="w-6 h-6" />
          إقرار استلام ومعالجة
        </h2>
        {closingDeclaration ? (
          <p className="text-sm leading-loose whitespace-pre-wrap" style={{ color: '#14532d' }}>
            {closingDeclaration}
          </p>
        ) : (
          <>
            <p className="text-sm leading-loose" style={{ color: '#14532d' }}>
              نقر نحن شركة <strong>{recyclerOrg?.name || shipment.recycler?.name || 'جهة التدوير'}</strong> بأنه قد تم استلام الشحنة رقم <strong className="font-mono">{shipment.shipment_number}</strong> 
              بتاريخ <strong>{deliveryDate}</strong> بكامل محتوياتها المكونة من <strong>{shipment.quantity} {shipment.unit || 'كجم'}</strong> من مخلفات <strong>{wasteTypeLabels[shipment.waste_type] || shipment.waste_type}</strong> وبحالة سليمة.
            </p>
            <p className="text-sm leading-loose mt-3" style={{ color: '#14532d' }}>
              كما نقر بأنه تمت إعادة تدوير ومعالجة هذه المخلفات بالكامل وفقاً للمعايير والمتطلبات التالية:
            </p>
            <ul className="text-sm mt-2 mr-4 space-y-1" style={{ color: '#166534' }}>
              <li>✓ المتطلبات البيئية المنظمة لنشاط إدارة المخلفات وإعادة التدوير</li>
              <li>✓ المتطلبات القانونية والتشريعية السارية</li>
              <li>✓ المعايير الصناعية والفنية المعتمدة</li>
              <li>✓ اشتراطات الصحة والسلامة المهنية</li>
            </ul>
          </>
        )}
      </div>

      {/* Signature Section */}
      <div className="pt-6 mt-8 print-signatures print-avoid-break" style={{ borderTop: '2px solid #d1d5db' }}>
        <div className="grid grid-cols-2 gap-10">
          {/* Empty space for balance */}
          <div />

          {/* Recycler Signature */}
          <div className="text-center">
            <p className="font-bold mb-2" style={{ color: '#1f2937' }}>التوقيع والختم</p>
            <p className="text-sm mb-4" style={{ color: '#6b7280' }}>
              {recyclerOrg?.name || shipment.recycler?.name}
            </p>
            
            <div className="flex justify-center gap-8 mt-4">
              {/* Signature */}
              <div className="text-center print-signature-box">
                {recyclerOrg?.signature_url || shipment.recycler?.signature_url ? (
                  <img
                    src={recyclerOrg?.signature_url || shipment.recycler?.signature_url || ''}
                    alt="التوقيع"
                    className="h-16 mx-auto mb-2 object-contain"
                    crossOrigin="anonymous"
                    style={{ maxWidth: '120px' }}
                  />
                ) : (
                  <div 
                    className="mx-auto mb-2" 
                    style={{ height: '50px', width: '100px', borderBottom: '2px solid #9ca3af' }} 
                  />
                )}
                <p className="text-xs" style={{ color: '#6b7280' }}>التوقيع</p>
              </div>

              {/* Stamp */}
              <div className="text-center print-signature-box">
                {recyclerOrg?.stamp_url || shipment.recycler?.stamp_url ? (
                  <img
                    src={recyclerOrg?.stamp_url || shipment.recycler?.stamp_url || ''}
                    alt="الختم"
                    className="h-16 mx-auto mb-2 object-contain"
                    crossOrigin="anonymous"
                    style={{ maxWidth: '80px' }}
                  />
                ) : (
                  <div 
                    className="mx-auto mb-2 rounded-full flex items-center justify-center" 
                    style={{ 
                      height: '60px', 
                      width: '60px', 
                      border: '2px dashed #d1d5db' 
                    }}
                  >
                    <span className="text-xs" style={{ color: '#9ca3af' }}>الختم</span>
                  </div>
                )}
                <p className="text-xs" style={{ color: '#6b7280' }}>الختم</p>
              </div>
            </div>

            <p className="text-sm mt-4">
              الممثل القانوني: {recyclerOrg?.representative_name || shipment.recycler?.representative_name || '________________'}
            </p>
            <p className="text-sm mt-2">
              التاريخ: {currentDate}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-10 pt-4 text-center text-xs print-footer" style={{ borderTop: '1px solid #e5e7eb', color: '#6b7280' }}>
        <p>هذه الشهادة صادرة إلكترونياً من نظام إدارة المخلفات وإعادة التدوير - آي ريسايكل</p>
        <p className="mt-1">تاريخ الإصدار: {currentDate} | رقم المرجع: {shipment.shipment_number}</p>
        <p className="mt-2" style={{ color: '#9ca3af', fontSize: '8pt' }}>
          هذه الوثيقة تم إنشاؤها آلياً طبقاً للبيانات المدخلة والواردة إلينا على النظام - دون أدنى مسؤولية على النظام
        </p>
      </footer>
    </div>
  );
};

export default RecyclingCertificatePrint;
