import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import {
  Building2,
  Truck,
  Recycle,
  FileText,
  Shield,
  Phone,
  Mail,
  MapPin,
  Hash,
  Leaf,
  Stamp,
  PenTool,
  Calendar,
  ClipboardCheck,
  BadgeCheck,
} from 'lucide-react';

export interface PartyInfo {
  id?: string;
  name: string;
  name_en?: string | null;
  email?: string | null;
  phone?: string | null;
  secondary_phone?: string | null;
  address?: string | null;
  city?: string | null;
  region?: string | null;
  commercial_register?: string | null;
  environmental_license?: string | null;
  activity_type?: string | null;
  representative_name?: string | null;
  representative_phone?: string | null;
  representative_email?: string | null;
  representative_position?: string | null;
  representative_national_id?: string | null;
  logo_url?: string | null;
  stamp_url?: string | null;
  signature_url?: string | null;
  client_code?: string | null;
}

export interface ReportCoverPageProps {
  reportType: 'aggregate' | 'certificate' | 'register' | 'receipt' | 'contract';
  reportTitle: string;
  reportNumber: string;
  reportDate: Date;
  generator?: PartyInfo | null;
  transporter?: PartyInfo | null;
  recycler?: PartyInfo | null;
  issuingOrganization?: PartyInfo | null;
  summary?: {
    shipmentsCount?: number;
    totalQuantity?: number;
    unit?: string;
    dateRange?: { start?: string; end?: string };
    wasteTypes?: string[];
  };
  includeSignatures?: boolean;
  includeStamps?: boolean;
  verificationUrl?: string;
}

const reportTypeLabels: Record<string, string> = {
  aggregate: 'تقرير مجمع للشحنات',
  certificate: 'شهادة إعادة التدوير',
  register: 'سجل المخلفات',
  receipt: 'إيصال استلام',
  contract: 'عقد خدمات',
};

const orgTypeLabels: Record<string, { label: string; color: string; bgColor: string; Icon: any }> = {
  generator: {
    label: 'الجهة المولدة',
    color: '#1e40af',
    bgColor: '#eff6ff',
    Icon: Building2,
  },
  transporter: {
    label: 'جهة الجمع والنقل',
    color: '#92400e',
    bgColor: '#fffbeb',
    Icon: Truck,
  },
  recycler: {
    label: 'جهة التدوير / المعالجة',
    color: '#166534',
    bgColor: '#ecfdf5',
    Icon: Recycle,
  },
};

const ReportCoverPage = ({
  reportType,
  reportTitle,
  reportNumber,
  reportDate,
  generator,
  transporter,
  recycler,
  issuingOrganization,
  summary,
  includeSignatures = true,
  includeStamps = true,
  verificationUrl,
}: ReportCoverPageProps) => {
  const currentDate = format(reportDate, 'PP', { locale: ar });
  const currentDateTime = format(reportDate, 'PPpp', { locale: ar });
  
  const formatDateRange = (dateStr: string | undefined) => {
    if (!dateStr) return '-';
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ar });
    } catch {
      return '-';
    }
  };

  const renderPartyCard = (party: PartyInfo | null | undefined, type: 'generator' | 'transporter' | 'recycler') => {
    const config = orgTypeLabels[type];
    const Icon = config.Icon;
    
    if (!party) {
      return (
        <div 
          className="rounded-lg p-4" 
          style={{ backgroundColor: config.bgColor, border: `1px solid ${config.color}30` }}
        >
          <div className="flex items-center gap-2 mb-3 pb-2" style={{ borderBottom: `1px solid ${config.color}30` }}>
            <Icon className="w-5 h-5" style={{ color: config.color }} />
            <h3 className="font-bold" style={{ color: config.color, fontSize: '11pt' }}>
              {config.label}
            </h3>
          </div>
          <p className="text-center text-gray-400 py-4" style={{ fontSize: '9pt' }}>
            لا توجد بيانات متاحة
          </p>
        </div>
      );
    }

    return (
      <div 
        className="rounded-lg p-4" 
        style={{ backgroundColor: config.bgColor, border: `1px solid ${config.color}30` }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-3 pb-2" style={{ borderBottom: `1px solid ${config.color}30` }}>
          <Icon className="w-5 h-5" style={{ color: config.color }} />
          <h3 className="font-bold" style={{ color: config.color, fontSize: '11pt' }}>
            {config.label}
          </h3>
          {party.client_code && (
            <span 
              className="mr-auto text-xs px-2 py-0.5 rounded" 
              style={{ backgroundColor: `${config.color}20`, color: config.color }}
            >
              كود: {party.client_code}
            </span>
          )}
        </div>

        {/* Logo and Name */}
        <div className="flex items-start gap-3 mb-3">
          {party.logo_url && (
            <img 
              src={party.logo_url} 
              alt={party.name} 
              className="w-12 h-12 object-contain rounded border bg-white"
              crossOrigin="anonymous"
            />
          )}
          <div className="flex-1">
            <p className="font-bold text-gray-900" style={{ fontSize: '12pt' }}>{party.name}</p>
            {party.name_en && (
              <p className="text-gray-500" style={{ fontSize: '8pt', direction: 'ltr', textAlign: 'left' }}>
                {party.name_en}
              </p>
            )}
          </div>
        </div>

        {/* Legal Information */}
        <div className="grid grid-cols-2 gap-2 mb-3" style={{ fontSize: '8pt' }}>
          {party.commercial_register && (
            <div className="flex items-center gap-1">
              <Hash className="w-3 h-3 text-gray-400" />
              <span className="text-gray-500">س.ت:</span>
              <span className="font-semibold text-gray-700">{party.commercial_register}</span>
            </div>
          )}
          {party.environmental_license && (
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-gray-400" />
              <span className="text-gray-500">ترخيص بيئي:</span>
              <span className="font-semibold text-gray-700">{party.environmental_license}</span>
            </div>
          )}
        </div>

        {/* Contact Information */}
        <div className="space-y-1 mb-3" style={{ fontSize: '8pt' }}>
          {(party.address || party.city) && (
            <div className="flex items-start gap-1">
              <MapPin className="w-3 h-3 text-gray-400 mt-0.5" />
              <span className="text-gray-600">
                {[party.address, party.city, party.region].filter(Boolean).join('، ')}
              </span>
            </div>
          )}
          {party.phone && (
            <div className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-gray-400" />
              <span className="text-gray-600 font-mono">{party.phone}</span>
              {party.secondary_phone && (
                <span className="text-gray-400 font-mono"> / {party.secondary_phone}</span>
              )}
            </div>
          )}
          {party.email && (
            <div className="flex items-center gap-1">
              <Mail className="w-3 h-3 text-gray-400" />
              <span className="text-gray-600" style={{ direction: 'ltr' }}>{party.email}</span>
            </div>
          )}
        </div>

        {/* Representative */}
        {party.representative_name && (
          <div 
            className="rounded p-2 mb-3" 
            style={{ backgroundColor: 'rgba(255,255,255,0.7)', border: '1px dashed #d1d5db', fontSize: '8pt' }}
          >
            <p className="font-semibold text-gray-700 mb-1">
              <ClipboardCheck className="w-3 h-3 inline ml-1" />
              المفوض بالتوقيع:
            </p>
            <div className="grid grid-cols-2 gap-1 text-gray-600">
              <div><span className="text-gray-400">الاسم:</span> {party.representative_name}</div>
              {party.representative_position && (
                <div><span className="text-gray-400">المنصب:</span> {party.representative_position}</div>
              )}
              {party.representative_national_id && (
                <div><span className="text-gray-400">رقم الهوية:</span> {party.representative_national_id}</div>
              )}
              {party.representative_phone && (
                <div><span className="text-gray-400">الهاتف:</span> {party.representative_phone}</div>
              )}
            </div>
          </div>
        )}

        {/* Stamp and Signature */}
        {(includeStamps || includeSignatures) && (
          <div className="flex justify-center gap-4 pt-2" style={{ borderTop: '1px dashed #d1d5db' }}>
            {includeStamps && (
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">الختم</p>
                {party.stamp_url ? (
                  <img 
                    src={party.stamp_url} 
                    alt="ختم" 
                    className="w-16 h-16 object-contain mx-auto"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="w-16 h-16 border-2 border-dashed rounded-full flex items-center justify-center bg-white/50 mx-auto">
                    <Stamp className="w-6 h-6 text-gray-300" />
                  </div>
                )}
              </div>
            )}
            {includeSignatures && (
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">التوقيع</p>
                {party.signature_url ? (
                  <img 
                    src={party.signature_url} 
                    alt="توقيع" 
                    className="w-20 h-12 object-contain mx-auto"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="w-20 h-12 border-2 border-dashed rounded flex items-center justify-center bg-white/50 mx-auto">
                    <PenTool className="w-5 h-5 text-gray-300" />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      className="print-cover-page bg-white text-black" 
      dir="rtl" 
      style={{ 
        height: '297mm', 
        width: '210mm', 
        margin: '0 auto',
        padding: '15mm 15mm 20mm 15mm',
        fontFamily: 'Cairo, sans-serif',
        fontSize: '10pt',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        pageBreakAfter: 'always'
      }}
    >
      {/* Header with Decorative Border */}
      <header className="text-center mb-6 pb-4" style={{ borderBottom: '3px double #16a34a' }}>
        <div className="flex items-center justify-between mb-4">
          {/* QR Code */}
          <div className="text-center">
            <QRCodeSVG
              value={verificationUrl || `${window.location.origin}/qr-verify?type=${reportType}&code=${encodeURIComponent(reportNumber)}`}
              size={70}
              level="M"
              includeMargin={false}
            />
            <p style={{ fontSize: '7pt', color: '#6b7280', marginTop: '4px' }}>امسح للتحقق</p>
          </div>

          {/* Title */}
          <div className="text-center flex-1 px-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Leaf className="w-8 h-8" style={{ color: '#16a34a' }} />
              <div>
                <h1 style={{ fontSize: '20pt', fontWeight: 'bold', color: '#15803d', margin: 0 }}>
                  {reportTitle}
                </h1>
                <p style={{ fontSize: '10pt', color: '#4b5563', margin: '4px 0 0 0' }}>
                  {reportTypeLabels[reportType]}
                </p>
              </div>
              <Leaf className="w-8 h-8" style={{ color: '#16a34a' }} />
            </div>
            
            {/* Report Number Badge */}
            <div 
              className="inline-block rounded-lg px-4 py-2 mt-2" 
              style={{ backgroundColor: '#f0fdf4', border: '2px solid #86efac' }}
            >
              <span style={{ fontSize: '9pt', color: '#374151' }}>رقم المستند: </span>
              <span className="font-mono font-bold" style={{ color: '#15803d', fontSize: '12pt' }}>
                {reportNumber}
              </span>
            </div>
          </div>

          {/* Barcode */}
          <div className="text-center">
            <Barcode
              value={reportNumber}
              width={1.2}
              height={40}
              fontSize={8}
              displayValue={false}
            />
            <p className="font-mono" style={{ fontSize: '7pt', color: '#374151', marginTop: '4px' }}>
              {reportNumber}
            </p>
          </div>
        </div>

        {/* Issue Date */}
        <div className="flex items-center justify-center gap-2 text-gray-600" style={{ fontSize: '9pt' }}>
          <Calendar className="w-4 h-4" />
          <span>تاريخ الإصدار: {currentDateTime}</span>
        </div>
      </header>

      {/* Summary Section */}
      {summary && (
        <div 
          className="rounded-lg p-4 mb-4" 
          style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}
        >
          <h2 className="font-bold text-gray-700 mb-3 flex items-center gap-2" style={{ fontSize: '11pt' }}>
            <FileText className="w-5 h-5 text-primary" />
            ملخص المستند
          </h2>
          <div className="grid grid-cols-4 gap-4 text-center">
            {summary.shipmentsCount !== undefined && (
              <div className="p-3 rounded-lg" style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
                <p className="text-2xl font-bold text-blue-600">{summary.shipmentsCount}</p>
                <p className="text-xs text-gray-600">عدد الشحنات</p>
              </div>
            )}
            {summary.totalQuantity !== undefined && (
              <div className="p-3 rounded-lg" style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                <p className="text-2xl font-bold text-emerald-600">
                  {summary.totalQuantity.toLocaleString()}
                </p>
                <p className="text-xs text-gray-600">{summary.unit || 'كجم'}</p>
              </div>
            )}
            {summary.dateRange?.start && (
              <div className="p-3 rounded-lg" style={{ backgroundColor: '#fefce8', border: '1px solid #fde047' }}>
                <p className="text-sm font-bold text-amber-600">
                  {formatDateRange(summary.dateRange.start)}
                </p>
                <p className="text-xs text-gray-600">من تاريخ</p>
              </div>
            )}
            {summary.dateRange?.end && (
              <div className="p-3 rounded-lg" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
                <p className="text-sm font-bold text-red-600">
                  {formatDateRange(summary.dateRange.end)}
                </p>
                <p className="text-xs text-gray-600">إلى تاريخ</p>
              </div>
            )}
          </div>
          {summary.wasteTypes && summary.wasteTypes.length > 0 && (
            <div className="mt-3 pt-3" style={{ borderTop: '1px dashed #d1d5db' }}>
              <p className="text-xs text-gray-500 mb-2">أنواع المخلفات:</p>
              <div className="flex flex-wrap gap-2">
                {summary.wasteTypes.map((type, i) => (
                  <span 
                    key={i} 
                    className="px-2 py-1 rounded text-xs"
                    style={{ backgroundColor: '#e5e7eb', color: '#374151' }}
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Parties Section Title */}
      <div className="flex items-center gap-2 mb-4">
        <BadgeCheck className="w-5 h-5 text-primary" />
        <h2 className="font-bold text-gray-700" style={{ fontSize: '12pt' }}>
          بيانات الجهات المشاركة
        </h2>
        <div className="flex-1 h-px bg-gray-200 mr-2" />
      </div>

      {/* Parties Cards */}
      <div className="flex-1 grid grid-cols-1 gap-3">
        {generator && renderPartyCard(generator, 'generator')}
        {transporter && renderPartyCard(transporter, 'transporter')}
        {recycler && renderPartyCard(recycler, 'recycler')}
      </div>

      {/* Footer */}
      <footer 
        className="text-center pt-4 mt-4" 
        style={{ borderTop: '2px solid #e5e7eb', fontSize: '8pt', color: '#6b7280' }}
      >
        <p className="mb-1">
          صفحة بيانات الجهات المشاركة | {reportTypeLabels[reportType]} | رقم المرجع: {reportNumber}
        </p>
        <p style={{ fontSize: '7pt', color: '#9ca3af' }}>
          تم إصدار هذا المستند إلكترونياً من نظام إدارة المخلفات وإعادة التدوير - آي ريسايكل
        </p>
        <p style={{ fontSize: '6pt', color: '#d1d5db' }}>
          يمكن التحقق من صحة المستند عبر مسح رمز QR أو زيارة صفحة التحقق
        </p>
      </footer>
    </div>
  );
};

export default ReportCoverPage;
