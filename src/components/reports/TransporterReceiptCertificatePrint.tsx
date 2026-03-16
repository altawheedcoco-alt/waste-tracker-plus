import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import TermsBackPage from '@/components/print/TermsBackPage';
import {
  Building2,
  Truck,
  Recycle,
  CheckCircle2,
  FileText,
  Scale,
  MapPin,
  Hash,
  Package,
} from 'lucide-react';
import ReportCoverPage, { PartyInfo } from './ReportCoverPage';

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
    name_en?: string | null;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    region?: string | null;
    commercial_register?: string;
    environmental_license?: string;
    representative_name?: string | null;
    representative_position?: string | null;
    representative_phone?: string | null;
    representative_national_id?: string | null;
    logo_url?: string | null;
    stamp_url?: string | null;
    signature_url?: string | null;
    client_code?: string | null;
  } | null;
  transporter?: {
    name: string;
    name_en?: string | null;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    region?: string | null;
    commercial_register?: string;
    environmental_license?: string;
    representative_name?: string | null;
    representative_position?: string | null;
    representative_phone?: string | null;
    representative_national_id?: string | null;
    logo_url?: string | null;
    stamp_url?: string | null;
    signature_url?: string | null;
    client_code?: string | null;
  } | null;
  recycler?: {
    name: string;
    name_en?: string | null;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    region?: string | null;
    commercial_register?: string;
    environmental_license?: string;
    representative_name?: string | null;
    representative_position?: string | null;
    representative_phone?: string | null;
    representative_national_id?: string | null;
    stamp_url?: string | null;
    signature_url?: string | null;
    logo_url?: string | null;
    client_code?: string | null;
  } | null;
}

interface TransporterOrg {
  id?: string;
  name?: string;
  name_en?: string | null;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  region?: string | null;
  commercial_register?: string;
  environmental_license?: string;
  stamp_url?: string | null;
  signature_url?: string | null;
  logo_url?: string | null;
  representative_name?: string | null;
  representative_position?: string | null;
  representative_phone?: string | null;
  representative_national_id?: string | null;
  client_code?: string | null;
}

interface TransporterReceiptCertificatePrintProps {
  shipment: Shipment;
  template: string;
  customNotes: string;
  transportDetails: string;
  openingDeclaration?: string;
  closingDeclaration?: string;
  transporterOrg: TransporterOrg | null;
  includeCoverPage?: boolean;
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
  standard: 'شهادة استلام ونقل شحنة',
  detailed: 'تقرير نقل الشحنة التفصيلي',
  environmental: 'شهادة النقل البيئي المعتمد',
  custom: 'شهادة استلام ونقل شحنة',
};

const TransporterReceiptCertificatePrint = ({
  shipment,
  template,
  customNotes,
  transportDetails,
  openingDeclaration,
  closingDeclaration,
  transporterOrg,
  includeCoverPage = true,
}: TransporterReceiptCertificatePrintProps) => {
  const currentDate = format(new Date(), 'PP', { locale: ar });
  const pickupDate = shipment.pickup_date
    ? format(new Date(shipment.pickup_date), 'PP', { locale: ar })
    : '-';
  const deliveryDate = shipment.delivered_at
    ? format(new Date(shipment.delivered_at), 'PP', { locale: ar })
    : '-';

  // Prepare party info for cover page
  const generatorParty: PartyInfo | null = shipment.generator ? {
    name: shipment.generator.name,
    name_en: shipment.generator.name_en,
    email: shipment.generator.email,
    phone: shipment.generator.phone,
    address: shipment.generator.address,
    city: shipment.generator.city,
    region: shipment.generator.region,
    commercial_register: shipment.generator.commercial_register,
    environmental_license: shipment.generator.environmental_license,
    representative_name: shipment.generator.representative_name,
    representative_position: shipment.generator.representative_position,
    representative_phone: shipment.generator.representative_phone,
    representative_national_id: shipment.generator.representative_national_id,
    logo_url: shipment.generator.logo_url,
    stamp_url: shipment.generator.stamp_url,
    signature_url: shipment.generator.signature_url,
    client_code: shipment.generator.client_code,
  } : null;

  const transporterParty: PartyInfo | null = transporterOrg ? {
    id: transporterOrg.id,
    name: transporterOrg.name || shipment.transporter?.name || '',
    name_en: transporterOrg.name_en,
    email: transporterOrg.email,
    phone: transporterOrg.phone,
    address: transporterOrg.address,
    city: transporterOrg.city,
    region: transporterOrg.region,
    commercial_register: transporterOrg.commercial_register,
    environmental_license: transporterOrg.environmental_license,
    representative_name: transporterOrg.representative_name,
    representative_position: transporterOrg.representative_position,
    representative_phone: transporterOrg.representative_phone,
    representative_national_id: transporterOrg.representative_national_id,
    logo_url: transporterOrg.logo_url,
    stamp_url: transporterOrg.stamp_url,
    signature_url: transporterOrg.signature_url,
    client_code: transporterOrg.client_code,
  } : shipment.transporter ? {
    name: shipment.transporter.name,
    name_en: shipment.transporter.name_en,
    email: shipment.transporter.email,
    phone: shipment.transporter.phone,
    address: shipment.transporter.address,
    city: shipment.transporter.city,
    region: shipment.transporter.region,
    commercial_register: shipment.transporter.commercial_register,
    environmental_license: shipment.transporter.environmental_license,
    representative_name: shipment.transporter.representative_name,
    representative_position: shipment.transporter.representative_position,
    representative_phone: shipment.transporter.representative_phone,
    representative_national_id: shipment.transporter.representative_national_id,
    logo_url: shipment.transporter.logo_url,
    stamp_url: shipment.transporter.stamp_url,
    signature_url: shipment.transporter.signature_url,
    client_code: shipment.transporter.client_code,
  } : null;

  const recyclerParty: PartyInfo | null = shipment.recycler ? {
    name: shipment.recycler.name,
    name_en: shipment.recycler.name_en,
    email: shipment.recycler.email,
    phone: shipment.recycler.phone,
    address: shipment.recycler.address,
    city: shipment.recycler.city,
    region: shipment.recycler.region,
    commercial_register: shipment.recycler.commercial_register,
    environmental_license: shipment.recycler.environmental_license,
    representative_name: shipment.recycler.representative_name,
    representative_position: shipment.recycler.representative_position,
    representative_phone: shipment.recycler.representative_phone,
    representative_national_id: shipment.recycler.representative_national_id,
    logo_url: shipment.recycler.logo_url,
    stamp_url: shipment.recycler.stamp_url,
    signature_url: shipment.recycler.signature_url,
    client_code: shipment.recycler.client_code,
  } : null;

  return (
    <>
      {/* Cover Page with Full Legal Party Information */}
      {includeCoverPage && (
        <ReportCoverPage
          reportType="receipt"
          reportTitle={templateTitles[template]}
          reportNumber={shipment.shipment_number}
          reportDate={new Date()}
          generator={generatorParty}
          transporter={transporterParty}
          recycler={recyclerParty}
          issuingOrganization={transporterParty}
          summary={{
            shipmentsCount: 1,
            totalQuantity: shipment.quantity,
            unit: shipment.unit || 'كجم',
            wasteTypes: [wasteTypeLabels[shipment.waste_type] || shipment.waste_type],
          }}
          includeStamps={true}
          includeSignatures={true}
        />
      )}

      {/* Main Certificate Content */}
      <div 
        className="print-container bg-white text-black print:p-0 print-break-after" 
        dir="rtl" 
        style={{ 
          height: '297mm', 
          width: '210mm', 
          margin: '0 auto',
          padding: '15mm 15mm 20mm 15mm',
          fontFamily: 'Cairo, sans-serif',
          fontSize: '9pt',
          overflow: 'hidden',
          boxSizing: 'border-box',
          pageBreakAfter: 'always',
        }}
      >
      {/* Header with QR and Barcode */}
      <header className="print-header flex items-start justify-between mb-3 pb-2" style={{ borderBottom: '2px solid #2563eb' }}>
        {/* QR Code */}
        <div className="text-center print-qr">
          <QRCodeSVG
            value={`${window.location.origin}/qr-verify?type=transport-receipt&code=${encodeURIComponent(shipment.shipment_number)}`}
            size={50}
            level="M"
            includeMargin={false}
          />
          <p style={{ fontSize: '7pt', color: '#6b7280', marginTop: '2px' }}>امسح للتحقق</p>
        </div>

        {/* Title */}
        <div className="text-center flex-1 px-4">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Truck className="w-5 h-5" style={{ color: '#2563eb' }} />
            <h1 style={{ fontSize: '14pt', fontWeight: 'bold', color: '#1d4ed8', margin: 0 }}>
              {templateTitles[template]}
            </h1>
            <Package className="w-5 h-5" style={{ color: '#2563eb' }} />
          </div>
          <p style={{ fontSize: '8pt', color: '#4b5563', margin: 0 }}>إدارة نقل المخلفات - سلسلة الحيازة</p>
          <div 
            className="inline-block rounded px-2 py-1 mt-1" 
            style={{ backgroundColor: '#eff6ff', border: '1px solid #93c5fd' }}
          >
            <span style={{ fontSize: '8pt' }}>رقم الشهادة: </span>
            <span className="font-mono font-bold" style={{ color: '#1d4ed8', fontSize: '9pt' }}>
              {shipment.shipment_number}
            </span>
          </div>
        </div>

        {/* Barcode */}
        <div className="text-center print-barcode">
          <Barcode
            value={shipment.shipment_number}
            width={1}
            height={30}
            fontSize={7}
            displayValue={false}
          />
          <p className="font-mono" style={{ fontSize: '7pt', color: '#374151', marginTop: '2px' }}>
            {shipment.shipment_number}
          </p>
        </div>
      </header>

      {/* Opening Declaration */}
      <div 
        className="rounded p-2 mb-2 print-declaration" 
        style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}
      >
        <h2 className="font-bold mb-1 flex items-center gap-1" style={{ color: '#1e40af', fontSize: '9pt' }}>
          <FileText className="w-3 h-3" />
          إقرار استلام ونقل
        </h2>
        <div style={{ fontSize: '8pt', color: '#1e3a8a', lineHeight: '1.4' }}>
          <p style={{ margin: 0 }}>
            إلى السادة / <strong>{shipment.generator?.name || 'الجهة المولدة'}</strong> - الجهة المولدة | 
            وإلى السادة / <strong>{shipment.recycler?.name || 'جهة الاستلام'}</strong> - جهة التدوير / التخلص
          </p>
          <p style={{ margin: '3px 0 0 0' }}>
            {openingDeclaration || `نفيدكم بأن شركة ${transporterOrg?.name || shipment.transporter?.name || 'جهة النقل'} قد استلمت الشحنة من الجهة المولدة وتم نقلها بنجاح وفقاً للإجراءات والاشتراطات البيئية المعتمدة.`}
          </p>
        </div>
      </div>

      {/* Shipment Details Table */}
      <div className="mb-2 print-info-box">
        <h3 
          className="font-bold mb-1 flex items-center gap-1 p-1 rounded" 
          style={{ backgroundColor: '#f3f4f6', color: '#1f2937', fontSize: '9pt' }}
        >
          <Scale className="w-3 h-3" style={{ color: '#2563eb' }} />
          بيانات الشحنة
        </h3>
        <table className="w-full" style={{ borderCollapse: 'collapse', fontSize: '8pt' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td className="p-1 font-semibold" style={{ backgroundColor: '#f9fafb', width: '20%' }}>رقم الشحنة</td>
              <td className="p-1 font-mono">{shipment.shipment_number}</td>
              <td className="p-1 font-semibold" style={{ backgroundColor: '#f9fafb', width: '20%' }}>تاريخ الاستلام</td>
              <td className="p-1">{pickupDate}</td>
              <td className="p-1 font-semibold" style={{ backgroundColor: '#f9fafb', width: '15%' }}>الكمية</td>
              <td className="p-1 font-bold" style={{ color: '#2563eb' }}>{shipment.quantity} {shipment.unit || 'كجم'}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td className="p-1 font-semibold" style={{ backgroundColor: '#f9fafb' }}>نوع المخلفات</td>
              <td className="p-1">{wasteTypeLabels[shipment.waste_type] || shipment.waste_type}</td>
              <td className="p-1 font-semibold" style={{ backgroundColor: '#f9fafb' }}>تاريخ التسليم</td>
              <td className="p-1">{deliveryDate}</td>
              <td className="p-1 font-semibold" style={{ backgroundColor: '#f9fafb' }}>الوصف</td>
              <td className="p-1">{shipment.waste_description || '-'}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td className="p-1 font-semibold" style={{ backgroundColor: '#f9fafb' }}>موقع الاستلام</td>
              <td className="p-1" colSpan={2}>{shipment.pickup_address || '-'}</td>
              <td className="p-1 font-semibold" style={{ backgroundColor: '#f9fafb' }}>موقع التسليم</td>
              <td className="p-1" colSpan={2}>{shipment.delivery_address || '-'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Parties Section */}
      <div className="grid grid-cols-3 gap-2 mb-2 print-grid-3">
        {/* Generator */}
        <div className="rounded p-2" style={{ border: '1px solid #e5e7eb' }}>
          <h4 className="font-bold mb-1 flex items-center gap-1 pb-1" style={{ borderBottom: '1px solid #e5e7eb', color: '#2563eb', fontSize: '8pt' }}>
            <Building2 className="w-3 h-3" />
            الجهة المولدة (المُرسِل)
          </h4>
          <div style={{ fontSize: '7pt' }}>
            <p className="font-semibold" style={{ fontSize: '8pt', marginBottom: '2px' }}>{shipment.generator?.name || '-'}</p>
            <p style={{ color: '#6b7280', margin: 0 }}>{shipment.generator?.city || '-'}</p>
            {shipment.generator?.commercial_register && (
              <p style={{ color: '#6b7280', margin: 0 }}>س.ت: {shipment.generator.commercial_register}</p>
            )}
          </div>
        </div>

        {/* Transporter - highlighted */}
        <div className="rounded p-2" style={{ backgroundColor: '#eff6ff', border: '1px solid #93c5fd' }}>
          <h4 className="font-bold mb-1 flex items-center gap-1 pb-1" style={{ borderBottom: '1px solid #93c5fd', color: '#1d4ed8', fontSize: '8pt' }}>
            <Truck className="w-3 h-3" />
            جهة النقل (المُصدِر)
          </h4>
          <div style={{ fontSize: '7pt' }}>
            <p className="font-semibold" style={{ fontSize: '8pt', marginBottom: '2px' }}>{transporterOrg?.name || shipment.transporter?.name || '-'}</p>
            <p style={{ color: '#6b7280', margin: 0 }}>{transporterOrg?.city || shipment.transporter?.city || '-'}</p>
            {(transporterOrg?.commercial_register || shipment.transporter?.commercial_register) && (
              <p style={{ color: '#6b7280', margin: 0 }}>س.ت: {transporterOrg?.commercial_register || shipment.transporter?.commercial_register}</p>
            )}
          </div>
        </div>

        {/* Recycler / Destination */}
        <div className="rounded p-2" style={{ border: '1px solid #e5e7eb' }}>
          <h4 className="font-bold mb-1 flex items-center gap-1 pb-1" style={{ borderBottom: '1px solid #e5e7eb', color: '#15803d', fontSize: '8pt' }}>
            <Recycle className="w-3 h-3" />
            جهة الاستلام (الوجهة)
          </h4>
          <div style={{ fontSize: '7pt' }}>
            <p className="font-semibold" style={{ fontSize: '8pt', marginBottom: '2px' }}>{shipment.recycler?.name || '-'}</p>
            <p style={{ color: '#6b7280', margin: 0 }}>{shipment.recycler?.city || '-'}</p>
            {shipment.recycler?.commercial_register && (
              <p style={{ color: '#6b7280', margin: 0 }}>س.ت: {shipment.recycler.commercial_register}</p>
            )}
          </div>
        </div>
      </div>

      {/* Transport Details & Custom Notes */}
      {(transportDetails || customNotes) && (
        <div className="mb-2 grid grid-cols-2 gap-2">
          {transportDetails && (
            <div className="print-info-box">
              <h3 
                className="font-bold mb-1 flex items-center gap-1 p-1 rounded" 
                style={{ backgroundColor: '#f3f4f6', color: '#1f2937', fontSize: '8pt' }}
              >
                <Truck className="w-3 h-3" style={{ color: '#2563eb' }} />
                تفاصيل عملية النقل
              </h3>
              <div 
                className="rounded p-1" 
                style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', fontSize: '7pt', lineHeight: '1.3' }}
              >
                {transportDetails}
              </div>
            </div>
          )}
          {customNotes && (
            <div className="print-info-box">
              <h3 
                className="font-bold mb-1 flex items-center gap-1 p-1 rounded" 
                style={{ backgroundColor: '#f3f4f6', color: '#1f2937', fontSize: '8pt' }}
              >
                <FileText className="w-3 h-3" style={{ color: '#2563eb' }} />
                ملاحظات إضافية
              </h3>
              <div 
                className="rounded p-1" 
                style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', fontSize: '7pt', lineHeight: '1.3' }}
              >
                {customNotes}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Closing Declaration */}
      <div 
        className="rounded p-2 mb-2 print-declaration print-avoid-break" 
        style={{ backgroundColor: '#eff6ff', border: '1px solid #93c5fd' }}
      >
        <h2 className="font-bold mb-1 flex items-center gap-1" style={{ color: '#1d4ed8', fontSize: '9pt' }}>
          <CheckCircle2 className="w-4 h-4" />
          إقرار استلام ونقل وتسليم
        </h2>
        {closingDeclaration ? (
          <p style={{ fontSize: '8pt', color: '#1e3a8a', lineHeight: '1.4', margin: 0 }}>
            {closingDeclaration}
          </p>
        ) : (
          <div style={{ fontSize: '8pt', color: '#1e3a8a', lineHeight: '1.4' }}>
            <p style={{ margin: 0 }}>
              نقر نحن شركة <strong>{transporterOrg?.name || shipment.transporter?.name || 'جهة النقل'}</strong> بأنه تم استلام الشحنة رقم <strong className="font-mono">{shipment.shipment_number}</strong> 
              من الجهة المولدة <strong>{shipment.generator?.name || '-'}</strong> وتم نقلها وتسليمها بالكامل إلى <strong>{shipment.recycler?.name || 'جهة الاستلام'}</strong> بكامل محتوياتها ({shipment.quantity} {shipment.unit || 'كجم'} من {wasteTypeLabels[shipment.waste_type] || shipment.waste_type}) دون نقص أو تلاعب، وفقاً للاشتراطات البيئية والقانونية المعتمدة.
            </p>
            <p style={{ margin: '3px 0 0 0', fontSize: '7pt' }}>
              ✓ سلامة الشحنة | ✓ الالتزام بالمسار | ✓ التعبئة والتغليف | ✓ اشتراطات النقل البيئية
            </p>
          </div>
        )}
      </div>

      {/* Signature Section */}
      <div className="pt-2 mt-2 print-signatures print-avoid-break" style={{ borderTop: '1px solid #d1d5db' }}>
        <div className="flex justify-start" style={{ direction: 'ltr' }}>
          <div className="text-center" style={{ width: '50%' }}>
            <p className="font-bold mb-1" style={{ color: '#1f2937', fontSize: '8pt' }}>التوقيع والختم</p>
            <p style={{ fontSize: '7pt', color: '#6b7280', marginBottom: '4px' }}>
              {transporterOrg?.name || shipment.transporter?.name}
            </p>
            
            <div className="flex justify-center gap-4">
              {/* Signature */}
              <div className="text-center print-signature-box">
                {transporterOrg?.signature_url || shipment.transporter?.signature_url ? (
                  <img
                    src={transporterOrg?.signature_url || shipment.transporter?.signature_url || ''}
                    alt="التوقيع"
                    className="mx-auto mb-1 object-contain"
                    crossOrigin="anonymous"
                    style={{ maxWidth: '70px', height: '35px' }}
                  />
                ) : (
                  <div 
                    className="mx-auto mb-1" 
                    style={{ height: '30px', width: '70px', borderBottom: '1px solid #9ca3af' }} 
                  />
                )}
                <p style={{ fontSize: '6pt', color: '#6b7280' }}>التوقيع</p>
              </div>

              {/* Stamp */}
              <div className="text-center print-signature-box">
                {transporterOrg?.stamp_url || shipment.transporter?.stamp_url ? (
                  <img
                    src={transporterOrg?.stamp_url || shipment.transporter?.stamp_url || ''}
                    alt="الختم"
                    className="mx-auto mb-1 object-contain"
                    crossOrigin="anonymous"
                    style={{ maxWidth: '70px', height: '40px' }}
                  />
                ) : (
                  <div 
                    className="rounded-full mx-auto mb-1" 
                    style={{ height: '35px', width: '35px', border: '1px dashed #9ca3af' }} 
                  />
                )}
                <p style={{ fontSize: '6pt', color: '#6b7280' }}>الختم</p>
              </div>
            </div>

            {(transporterOrg?.representative_name || shipment.transporter?.representative_name) && (
              <p style={{ fontSize: '7pt', color: '#374151', marginTop: '3px' }}>
                المفوض: {transporterOrg?.representative_name || shipment.transporter?.representative_name}
              </p>
            )}
            <p style={{ fontSize: '7pt', color: '#6b7280', marginTop: '2px' }}>
              التاريخ: {currentDate}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-2 pt-2 text-center" style={{ borderTop: '1px solid #e5e7eb', fontSize: '7pt', color: '#9ca3af' }}>
        <p style={{ margin: 0 }}>تم إصدار هذه الشهادة إلكترونياً من نظام إدارة المخلفات ونقلها | تاريخ الإصدار: {currentDate} | رقم المرجع: {shipment.shipment_number}</p>
        <p style={{ margin: '2px 0 0 0', fontSize: '6pt' }}>
          هذا المستند صالح بدون توقيع خطي في حالة التحقق الإلكتروني عبر رمز QR
        </p>
        <p style={{ margin: '4px 0 0 0', fontSize: '7pt', color: '#6b7280' }}>
          📅 تاريخ وصول الشحنة (أول تسجيل على المنظومة): {shipment.confirmed_at ? format(new Date(shipment.confirmed_at), 'dd/MM/yyyy - hh:mm a', { locale: ar }) : shipment.delivered_at ? format(new Date(shipment.delivered_at), 'dd/MM/yyyy - hh:mm a', { locale: ar }) : deliveryDate}
        </p>
      </footer>
    </div>
    <TermsBackPage />
    </>
  );
};

export default TransporterReceiptCertificatePrint;
