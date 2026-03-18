import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import TermsBackPage from '@/components/print/TermsBackPage';
import { generateMICRLineHTML, generateVerticalStampHTML } from '@/lib/printSecurityUtils';
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

interface RecyclerOrg {
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

interface CarbonData {
  transportEmissions: number;
  processingEmissions: number;
  totalEmissions: number;
  co2Saved: number;
  netImpact: number;
  distanceKm: number;
  treesEquivalent: number;
  carsEquivalent: number;
  homesEquivalent: number;
  recyclingRate: number;
}

interface RecyclingCertificatePrintProps {
  shipment: Shipment;
  template: string;
  customNotes: string;
  processingDetails: string;
  openingDeclaration?: string;
  closingDeclaration?: string;
  recyclerOrg: RecyclerOrg | null;
  includeCoverPage?: boolean;
  carbonData?: CarbonData | null;
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
  includeCoverPage = true,
  carbonData,
}: RecyclingCertificatePrintProps) => {
  const currentDate = format(new Date(), 'PP', { locale: ar });
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

  const transporterParty: PartyInfo | null = shipment.transporter ? {
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

  const recyclerParty: PartyInfo | null = recyclerOrg ? {
    id: recyclerOrg.id,
    name: recyclerOrg.name || shipment.recycler?.name || '',
    name_en: recyclerOrg.name_en,
    email: recyclerOrg.email,
    phone: recyclerOrg.phone,
    address: recyclerOrg.address,
    city: recyclerOrg.city,
    region: recyclerOrg.region,
    commercial_register: recyclerOrg.commercial_register,
    environmental_license: recyclerOrg.environmental_license,
    representative_name: recyclerOrg.representative_name,
    representative_position: recyclerOrg.representative_position,
    representative_phone: recyclerOrg.representative_phone,
    representative_national_id: recyclerOrg.representative_national_id,
    logo_url: recyclerOrg.logo_url,
    stamp_url: recyclerOrg.stamp_url,
    signature_url: recyclerOrg.signature_url,
    client_code: recyclerOrg.client_code,
  } : shipment.recycler ? {
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
          reportType="certificate"
          reportTitle={templateTitles[template]}
          reportNumber={shipment.shipment_number}
          reportDate={new Date()}
          generator={generatorParty}
          transporter={transporterParty}
          recycler={recyclerParty}
          issuingOrganization={recyclerParty}
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
          minHeight: '297mm', 
          maxWidth: '210mm', 
          width: '100%',
          margin: '0 auto',
          padding: '15mm 15mm 20mm 15mm',
          fontFamily: 'Cairo, sans-serif',
          fontSize: '9pt',
          overflow: 'hidden',
          boxSizing: 'border-box',
          pageBreakAfter: 'always',
          wordBreak: 'break-word' as const,
        }}
      >
      {/* Header with QR and Barcode */}
      <header className="print-header flex items-start justify-between mb-3 pb-2" style={{ borderBottom: '2px solid #16a34a' }}>
        {/* QR Code */}
        <div className="text-center print-qr">
          <QRCodeSVG
            value={`${window.location.origin}/qr-verify?type=certificate&code=${encodeURIComponent(shipment.shipment_number)}`}
            size={50}
            level="M"
            includeMargin={false}
          />
          <p style={{ fontSize: '7pt', color: '#6b7280', marginTop: '2px' }}>امسح للتحقق</p>
        </div>

        {/* Title */}
        <div className="text-center flex-1 px-4">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Leaf className="w-5 h-5" style={{ color: '#16a34a' }} />
            <h1 style={{ fontSize: '14pt', fontWeight: 'bold', color: '#15803d', margin: 0 }}>
              {templateTitles[template]}
            </h1>
            <Leaf className="w-5 h-5" style={{ color: '#16a34a' }} />
          </div>
          <p style={{ fontSize: '8pt', color: '#4b5563', margin: 0 }}>إدارة المخلفات وإعادة التدوير</p>
          <div 
            className="inline-block rounded px-2 py-1 mt-1" 
            style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac' }}
          >
            <span style={{ fontSize: '8pt' }}>رقم الشهادة: </span>
            <span className="font-mono font-bold" style={{ color: '#15803d', fontSize: '9pt' }}>
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
          إقرار رسمي
        </h2>
        <div style={{ fontSize: '8pt', color: '#1e3a8a', lineHeight: '1.4' }}>
          <p style={{ margin: 0 }}>
            إلى السادة / <strong>{shipment.generator?.name || 'الجهة المولدة'}</strong> - الجهة المولدة | 
            وإلى السادة / <strong>{shipment.transporter?.name || 'جهة النقل'}</strong> - جهة الجمع والنقل
          </p>
          <p style={{ margin: '3px 0 0 0' }}>
            {openingDeclaration || `نفيدكم بأن شركة ${recyclerOrg?.name || shipment.recycler?.name || 'جهة التدوير'} تسلمت الشحنة وتم معالجتها وفقاً للإجراءات المعتمدة.`}
          </p>
        </div>
      </div>

      {/* Shipment Details Table */}
      <div className="mb-2 print-info-box">
        <h3 
          className="font-bold mb-1 flex items-center gap-1 p-1 rounded" 
          style={{ backgroundColor: '#f3f4f6', color: '#1f2937', fontSize: '9pt' }}
        >
          <Scale className="w-3 h-3" style={{ color: '#16a34a' }} />
          بيانات الشحنة
        </h3>
        <table className="w-full" style={{ borderCollapse: 'collapse', fontSize: '8pt' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td className="p-1 font-semibold" style={{ backgroundColor: '#f9fafb', width: '20%' }}>رقم الشحنة</td>
              <td className="p-1 font-mono">{shipment.shipment_number}</td>
              <td className="p-1 font-semibold" style={{ backgroundColor: '#f9fafb', width: '20%' }}>تاريخ الاستلام</td>
              <td className="p-1">{deliveryDate}</td>
              <td className="p-1 font-semibold" style={{ backgroundColor: '#f9fafb', width: '15%' }}>الكمية</td>
              <td className="p-1 font-bold" style={{ color: '#16a34a' }}>{shipment.quantity} {shipment.unit || 'كجم'}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td className="p-1 font-semibold" style={{ backgroundColor: '#f9fafb' }}>نوع المخلفات</td>
              <td className="p-1">{wasteTypeLabels[shipment.waste_type] || shipment.waste_type}</td>
              <td className="p-1 font-semibold" style={{ backgroundColor: '#f9fafb' }}>طريقة التخلص</td>
              <td className="p-1">{shipment.disposal_method || 'إعادة التدوير'}</td>
              <td className="p-1 font-semibold" style={{ backgroundColor: '#f9fafb' }}>الوصف</td>
              <td className="p-1">{shipment.waste_description || '-'}</td>
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
            الجهة المولدة
          </h4>
          <div style={{ fontSize: '7pt' }}>
            <p className="font-semibold" style={{ fontSize: '8pt', marginBottom: '2px' }}>{shipment.generator?.name || '-'}</p>
            <p style={{ color: '#6b7280', margin: 0 }}>{shipment.generator?.city || '-'}</p>
            {shipment.generator?.commercial_register && (
              <p style={{ color: '#6b7280', margin: 0 }}>س.ت: {shipment.generator.commercial_register}</p>
            )}
          </div>
        </div>

        {/* Transporter */}
        <div className="rounded p-2" style={{ border: '1px solid #e5e7eb' }}>
          <h4 className="font-bold mb-1 flex items-center gap-1 pb-1" style={{ borderBottom: '1px solid #e5e7eb', color: '#d97706', fontSize: '8pt' }}>
            <Truck className="w-3 h-3" />
            جهة النقل
          </h4>
          <div style={{ fontSize: '7pt' }}>
            <p className="font-semibold" style={{ fontSize: '8pt', marginBottom: '2px' }}>{shipment.transporter?.name || '-'}</p>
            <p style={{ color: '#6b7280', margin: 0 }}>{shipment.transporter?.city || '-'}</p>
            {shipment.transporter?.commercial_register && (
              <p style={{ color: '#6b7280', margin: 0 }}>س.ت: {shipment.transporter.commercial_register}</p>
            )}
          </div>
        </div>

        {/* Recycler */}
        <div className="rounded p-2" style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac' }}>
          <h4 className="font-bold mb-1 flex items-center gap-1 pb-1" style={{ borderBottom: '1px solid #86efac', color: '#15803d', fontSize: '8pt' }}>
            <Recycle className="w-3 h-3" />
            جهة التدوير
          </h4>
          <div style={{ fontSize: '7pt' }}>
            <p className="font-semibold" style={{ fontSize: '8pt', marginBottom: '2px' }}>{recyclerOrg?.name || shipment.recycler?.name || '-'}</p>
            <p style={{ color: '#6b7280', margin: 0 }}>{recyclerOrg?.city || shipment.recycler?.city || '-'}</p>
            {(recyclerOrg?.commercial_register || shipment.recycler?.commercial_register) && (
              <p style={{ color: '#6b7280', margin: 0 }}>س.ت: {recyclerOrg?.commercial_register || shipment.recycler?.commercial_register}</p>
            )}
          </div>
        </div>
      </div>

      {/* Processing Details & Custom Notes - Combined */}
      {(processingDetails || customNotes) && (
        <div className="mb-2 grid grid-cols-2 gap-2">
          {processingDetails && (
            <div className="print-info-box">
              <h3 
                className="font-bold mb-1 flex items-center gap-1 p-1 rounded" 
                style={{ backgroundColor: '#f3f4f6', color: '#1f2937', fontSize: '8pt' }}
              >
                <Recycle className="w-3 h-3" style={{ color: '#16a34a' }} />
                تفاصيل المعالجة
              </h3>
              <div 
                className="rounded p-1" 
                style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', fontSize: '7pt', lineHeight: '1.3' }}
              >
                {processingDetails}
              </div>
            </div>
          )}
          {customNotes && (
            <div className="print-info-box">
              <h3 
                className="font-bold mb-1 flex items-center gap-1 p-1 rounded" 
                style={{ backgroundColor: '#f3f4f6', color: '#1f2937', fontSize: '8pt' }}
              >
                <FileText className="w-3 h-3" style={{ color: '#16a34a' }} />
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

      {/* Environmental Impact / Carbon Footprint Section */}
      {carbonData && (
        <div className="mb-2 print-info-box print-avoid-break">
          <h3 
            className="font-bold mb-1 flex items-center gap-1 p-1 rounded" 
            style={{ backgroundColor: '#ecfdf5', color: '#065f46', fontSize: '9pt' }}
          >
            <Leaf className="w-3 h-3" style={{ color: '#059669' }} />
            البصمة الكربونية والأثر البيئي
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {/* Emissions Table */}
            <table className="w-full" style={{ borderCollapse: 'collapse', fontSize: '7.5pt' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #d1fae5' }}>
                  <td className="p-1 font-semibold" style={{ backgroundColor: '#f0fdf4', width: '55%' }}>انبعاثات النقل (CO₂)</td>
                  <td className="p-1 font-mono" style={{ color: '#dc2626' }}>{carbonData.transportEmissions.toFixed(3)} طن</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #d1fae5' }}>
                  <td className="p-1 font-semibold" style={{ backgroundColor: '#f0fdf4' }}>انبعاثات المعالجة (CO₂)</td>
                  <td className="p-1 font-mono" style={{ color: '#dc2626' }}>{carbonData.processingEmissions.toFixed(3)} طن</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #d1fae5' }}>
                  <td className="p-1 font-semibold" style={{ backgroundColor: '#f0fdf4' }}>إجمالي الانبعاثات</td>
                  <td className="p-1 font-mono font-bold" style={{ color: '#dc2626' }}>{carbonData.totalEmissions.toFixed(3)} طن</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #d1fae5', backgroundColor: '#f0fdf4' }}>
                  <td className="p-1 font-semibold" style={{ color: '#059669' }}>CO₂ تم توفيره (التدوير)</td>
                  <td className="p-1 font-mono font-bold" style={{ color: '#059669' }}>{carbonData.co2Saved.toFixed(3)} طن</td>
                </tr>
                <tr>
                  <td className="p-1 font-semibold" style={{ backgroundColor: '#ecfdf5' }}>صافي الأثر الكربوني</td>
                  <td className="p-1 font-mono font-bold" style={{ color: carbonData.netImpact <= 0 ? '#059669' : '#dc2626' }}>
                    {carbonData.netImpact <= 0 ? '✅ ' : ''}{carbonData.netImpact.toFixed(3)} طن
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Environmental Equivalents */}
            <div className="rounded p-2" style={{ backgroundColor: '#f0fdf4', border: '1px solid #a7f3d0' }}>
              <p className="font-bold mb-1" style={{ fontSize: '7.5pt', color: '#065f46' }}>المكافئات البيئية</p>
              <div style={{ fontSize: '7pt', lineHeight: '1.6' }}>
                <p style={{ margin: 0 }}>🌳 يعادل زراعة <strong style={{ color: '#059669' }}>{carbonData.treesEquivalent}</strong> شجرة/سنة</p>
                <p style={{ margin: 0 }}>🚗 يعادل إخراج <strong style={{ color: '#059669' }}>{carbonData.carsEquivalent}</strong> سيارة من الطريق</p>
                <p style={{ margin: 0 }}>🏠 يعادل طاقة <strong style={{ color: '#059669' }}>{carbonData.homesEquivalent}</strong> منزل/سنة</p>
                <p style={{ margin: '4px 0 0 0' }}>📏 مسافة النقل: <strong>{carbonData.distanceKm} كم</strong></p>
              </div>

              {/* Simple visual bar */}
              <div className="mt-1">
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '6.5pt' }}>
                  <span>الانبعاثات</span>
                  <div style={{ flex: 1, height: '8px', backgroundColor: '#fecaca', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${Math.min(100, carbonData.totalEmissions > 0 ? (carbonData.co2Saved / carbonData.totalEmissions) * 100 : 0)}%`,
                      height: '100%', backgroundColor: '#10b981', borderRadius: '4px',
                    }} />
                  </div>
                  <span>التوفير</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Closing Declaration */}
      <div 
        className="rounded p-2 mb-2 print-declaration print-avoid-break" 
        style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac' }}
      >
        <h2 className="font-bold mb-1 flex items-center gap-1" style={{ color: '#15803d', fontSize: '9pt' }}>
          <CheckCircle2 className="w-4 h-4" />
          إقرار استلام ومعالجة
        </h2>
        {closingDeclaration ? (
          <p style={{ fontSize: '8pt', color: '#14532d', lineHeight: '1.4', margin: 0 }}>
            {closingDeclaration}
          </p>
        ) : (
          <div style={{ fontSize: '8pt', color: '#14532d', lineHeight: '1.4' }}>
            <p style={{ margin: 0 }}>
              نقر نحن شركة <strong>{recyclerOrg?.name || shipment.recycler?.name || 'جهة التدوير'}</strong> بأنه تم استلام الشحنة رقم <strong className="font-mono">{shipment.shipment_number}</strong> 
              بتاريخ <strong>{deliveryDate}</strong> بكامل محتوياتها ({shipment.quantity} {shipment.unit || 'كجم'} من {wasteTypeLabels[shipment.waste_type] || shipment.waste_type}) وتمت معالجتها وفقاً للمعايير البيئية والقانونية المعتمدة.
            </p>
            <p style={{ margin: '3px 0 0 0', fontSize: '7pt' }}>
              ✓ المتطلبات البيئية | ✓ المتطلبات القانونية | ✓ المعايير الصناعية | ✓ اشتراطات السلامة
            </p>
          </div>
        )}
      </div>

      {/* Signature Section - Right Aligned */}
      <div className="pt-2 mt-2 print-signatures print-avoid-break" style={{ borderTop: '1px solid #d1d5db' }}>
        <div className="flex justify-start" style={{ direction: 'ltr' }}>
          {/* Recycler Signature */}
          <div className="text-center" style={{ width: '50%' }}>
            <p className="font-bold mb-1" style={{ color: '#1f2937', fontSize: '8pt' }}>التوقيع والختم</p>
            <p style={{ fontSize: '7pt', color: '#6b7280', marginBottom: '4px' }}>
              {recyclerOrg?.name || shipment.recycler?.name}
            </p>
            
            <div className="flex justify-center gap-4">
              {/* Signature */}
              <div className="text-center print-signature-box">
                {recyclerOrg?.signature_url || shipment.recycler?.signature_url ? (
                  <img
                    src={recyclerOrg?.signature_url || shipment.recycler?.signature_url || ''}
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
                {recyclerOrg?.stamp_url || shipment.recycler?.stamp_url ? (
                  <img
                    src={recyclerOrg?.stamp_url || shipment.recycler?.stamp_url || ''}
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

            {(recyclerOrg?.representative_name || shipment.recycler?.representative_name) && (
              <p style={{ fontSize: '7pt', color: '#374151', marginTop: '3px' }}>
                المفوض: {recyclerOrg?.representative_name || shipment.recycler?.representative_name}
              </p>
            )}
            <p style={{ fontSize: '7pt', color: '#6b7280', marginTop: '2px' }}>
              التاريخ: {currentDate}
            </p>
          </div>
        </div>
      </div>

      {/* Footer with Security Elements */}
      <div style={{ marginTop: 'auto', textAlign: 'center', fontSize: '6.5pt', color: '#000', paddingTop: '2px', borderTop: '1px solid #e5e7eb', background: 'rgba(241,245,249,0.5)', borderRadius: '0 0 3px 3px' }}>
        <div style={{ fontWeight: '600' }}>تم إصدار هذه الشهادة إلكترونياً من نظام إدارة المخلفات وإعادة التدوير</div>
        <div style={{ fontSize: '6pt', color: '#6b7280', margin: '1px 0' }}>
          تاريخ الإصدار: {currentDate} | رقم المرجع: {shipment.shipment_number} | هذه الوثيقة صالحة بدون توقيع خطي في حالة التحقق الإلكتروني عبر رمز QR
        </div>
        <div style={{ fontSize: '6pt', color: '#6b7280' }}>
          📅 تاريخ وصول الشحنة: {shipment.confirmed_at ? format(new Date(shipment.confirmed_at), 'dd/MM/yyyy - hh:mm a', { locale: ar }) : shipment.delivered_at ? format(new Date(shipment.delivered_at), 'dd/MM/yyyy - hh:mm a', { locale: ar }) : deliveryDate}
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: '5.5pt', margin: '1px 0' }}>
          رقم التتبع: {shipment.shipment_number} | {format(new Date(), 'dd/MM/yyyy hh:mm a', { locale: ar })}
        </div>
        <div style={{ marginTop: '2px' }} dangerouslySetInnerHTML={{ __html: generateVerticalStampHTML() }} />
        <div style={{ marginTop: '1px' }} dangerouslySetInnerHTML={{ __html: generateMICRLineHTML(
          recyclerOrg?.client_code || shipment.recycler?.client_code,
          shipment.shipment_number
        ) }} />
      </div>
    </div>
    <TermsBackPage />
    </>
  );
};

export default RecyclingCertificatePrint;
