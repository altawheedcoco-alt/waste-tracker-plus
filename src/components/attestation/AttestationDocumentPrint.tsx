import { forwardRef, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import logoImg from '@/assets/logo.png';
import { supabase } from '@/integrations/supabase/client';
import type { AttestationData } from '@/hooks/useOrganizationAttestation';

interface TermsSection {
  title: string;
  content: string[];
}

interface AttestationDocumentPrintProps {
  attestation: AttestationData;
}

const getOrgTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    generator: 'مولد مخلفات',
    transporter: 'ناقل مخلفات',
    recycler: 'مدوّر مخلفات',
    disposal: 'تخلص نهائي',
  };
  return labels[type] || type;
};

const getOrgTypePrefix = (type: string) => {
  const prefixes: Record<string, string> = {
    generator: 'GEN',
    transporter: 'TRN',
    recycler: 'RCY',
    disposal: 'DSP',
  };
  return prefixes[type] || 'ORG';
};

const AttestationDocumentPrint = forwardRef<HTMLDivElement, AttestationDocumentPrintProps>(
  ({ attestation }, ref) => {
    const [termsSections, setTermsSections] = useState<TermsSection[]>([]);

    useEffect(() => {
      const fetchTerms = async () => {
        try {
          const { data } = await supabase
            .from('terms_content')
            .select('sections')
            .eq('organization_type', attestation.organization_type)
            .eq('is_active', true)
            .maybeSingle();

          if (data?.sections && Array.isArray(data.sections)) {
            setTermsSections(data.sections as unknown as TermsSection[]);
          }
        } catch (e) {
          console.error('Error fetching terms for attestation:', e);
        }
      };
      fetchTerms();
    }, [attestation.organization_type]);

    const verificationUrl = `${window.location.origin}/qr-verify?type=attestation&code=${attestation.verification_code}`;
    const qrData = attestation.signer_qr_data || verificationUrl;
    const issuedDate = format(new Date(attestation.issued_at), 'dd MMMM yyyy', { locale: ar });
    const issuedTime = format(new Date(attestation.issued_at), 'hh:mm a', { locale: ar });

    const pageStyle: React.CSSProperties = {
      fontFamily: 'Cairo, sans-serif',
      width: '210mm',
      minHeight: '297mm',
      padding: '12mm 15mm',
      boxSizing: 'border-box',
      backgroundColor: '#ffffff',
      color: '#1a1a1a',
      position: 'relative',
    };

    const watermarkStyle: React.CSSProperties = {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%) rotate(-30deg)',
      fontSize: '80px',
      fontWeight: 'bold',
      color: 'rgba(22, 163, 74, 0.04)',
      pointerEvents: 'none',
      zIndex: 1,
      whiteSpace: 'nowrap',
    };

    return (
      <div ref={ref} dir="rtl">
        {/* ===== PAGE 1: الإفادة ===== */}
        <div style={pageStyle} className="print:m-0 relative">
          <div style={watermarkStyle}>iRecycle</div>

          {/* Header with Logo */}
          <div className="flex items-center justify-between border-b-2 pb-4 mb-6" style={{ borderColor: '#16a34a' }}>
            <div className="flex items-center gap-3">
              <img src={logoImg} alt="iRecycle" className="h-14 w-14 object-contain" crossOrigin="anonymous" />
              <div>
                <h1 className="text-xl font-bold" style={{ color: '#166534' }}>منصة iRecycle</h1>
                <p className="text-xs" style={{ color: '#6b7280' }}>لإدارة المخلفات الصناعية والخطرة</p>
              </div>
            </div>
            <div className="text-left">
              <div className="text-xs font-mono" style={{ color: '#6b7280' }}>
                رقم الإفادة: <span className="font-bold" style={{ color: '#166534' }}>{attestation.attestation_number}</span>
              </div>
              <div className="text-xs" style={{ color: '#6b7280' }}>
                تاريخ الإصدار: {issuedDate}
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-6">
            <div className="inline-block px-8 py-3 rounded-lg" style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '2px solid #86efac' }}>
              <h2 className="text-2xl font-bold" style={{ color: '#166534' }}>إفادة تسجيل واعتماد رقمي</h2>
              <p className="text-sm mt-1" style={{ color: '#4ade80' }}>Digital Registration & Compliance Attestation</p>
            </div>
          </div>

          {/* Body Text */}
          <div className="mb-5 leading-relaxed text-sm" style={{ color: '#374151' }}>
            <p className="mb-3">
              تُفيد منصة <strong style={{ color: '#166534' }}>iRecycle لإدارة المخلفات الصناعية والخطرة</strong> بأن الجهة المذكورة أدناه مسجلة لدى النظام ومتحقق من بياناتها، وأنها وافقت على الشروط والأحكام والسياسات الخاصة بالمنصة، وتزاول أعمالها إلكترونياً عبر المنصة من توقيعات وأختام رقمية وتتبع ومانيفست إلكتروني وفقاً لأحدث النظم الرقمية.
            </p>
          </div>

          {/* Organization Details Card */}
          <div className="rounded-lg p-5 mb-5" style={{ border: '1px solid #d1d5db', background: '#fafafa' }}>
            <div className="flex items-start gap-4 mb-4">
              {attestation.organization_logo_url && (
                <img
                  src={attestation.organization_logo_url}
                  alt="شعار المنظمة"
                  className="h-16 w-16 rounded-lg object-contain border"
                  crossOrigin="anonymous"
                />
              )}
              <div className="flex-1">
                <h3 className="text-lg font-bold" style={{ color: '#111827' }}>{attestation.organization_name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>
                    {getOrgTypePrefix(attestation.organization_type)} - {getOrgTypeLabel(attestation.organization_type)}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              {attestation.digital_declaration_number && (
                <div className="flex gap-2">
                  <span style={{ color: '#6b7280' }}>رقم الإقرار الرقمي:</span>
                  <span className="font-mono font-bold" style={{ color: '#166534' }}>{attestation.digital_declaration_number}</span>
                </div>
              )}
              {attestation.commercial_register && (
                <div className="flex gap-2">
                  <span style={{ color: '#6b7280' }}>السجل التجاري:</span>
                  <span className="font-medium">{attestation.commercial_register}</span>
                </div>
              )}
              {attestation.tax_number && (
                <div className="flex gap-2">
                  <span style={{ color: '#6b7280' }}>الرقم الضريبي:</span>
                  <span className="font-medium">{attestation.tax_number}</span>
                </div>
              )}
              {attestation.organization_address && (
                <div className="flex gap-2 col-span-2">
                  <span style={{ color: '#6b7280' }}>العنوان:</span>
                  <span className="font-medium">{attestation.organization_address}</span>
                </div>
              )}
              {attestation.organization_phone && (
                <div className="flex gap-2">
                  <span style={{ color: '#6b7280' }}>الهاتف:</span>
                  <span className="font-medium">{attestation.organization_phone}</span>
                </div>
              )}
              {attestation.organization_email && (
                <div className="flex gap-2">
                  <span style={{ color: '#6b7280' }}>البريد الإلكتروني:</span>
                  <span className="font-medium">{attestation.organization_email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Delegate / Representative */}
          {attestation.delegate_name && (
            <div className="rounded-lg p-4 mb-5" style={{ border: '1px solid #bfdbfe', background: '#eff6ff' }}>
              <h4 className="font-bold text-sm mb-2" style={{ color: '#1e40af' }}>المفوض / الممثل القانوني</h4>
              <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
                <div className="flex gap-2">
                  <span style={{ color: '#6b7280' }}>الاسم:</span>
                  <span className="font-bold">{attestation.delegate_name}</span>
                </div>
                {attestation.delegate_position && (
                  <div className="flex gap-2">
                    <span style={{ color: '#6b7280' }}>المسمى الوظيفي:</span>
                    <span>{attestation.delegate_position}</span>
                  </div>
                )}
                {attestation.delegate_national_id && (
                  <div className="flex gap-2">
                    <span style={{ color: '#6b7280' }}>الرقم القومي:</span>
                    <span className="font-mono">{attestation.delegate_national_id}</span>
                  </div>
                )}
                {attestation.delegate_phone && (
                  <div className="flex gap-2">
                    <span style={{ color: '#6b7280' }}>الهاتف:</span>
                    <span>{attestation.delegate_phone}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Verification Status Grid */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              { label: 'الموافقة على الشروط والأحكام', ok: attestation.terms_accepted },
              { label: 'التحقق من الهوية (KYC)', ok: attestation.kyc_complete },
              { label: 'صلاحية التراخيص البيئية', ok: attestation.licenses_valid },
              { label: 'التحقق البيومتري', ok: attestation.identity_verified },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-lg p-3 text-sm"
                style={{
                  border: `1px solid ${item.ok ? '#86efac' : '#fed7aa'}`,
                  backgroundColor: item.ok ? '#f0fdf4' : '#fff7ed',
                }}
              >
                <span className="text-lg">{item.ok ? '✅' : '⚠️'}</span>
                <span className="font-medium" style={{ color: item.ok ? '#166534' : '#9a3412' }}>{item.label}</span>
              </div>
            ))}
          </div>

          {/* Digital Compliance Statement */}
          <div className="rounded-lg p-4 mb-5" style={{ background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)', border: '1px solid #86efac' }}>
            <h4 className="font-bold text-sm mb-2" style={{ color: '#166534' }}>📋 إقرار الالتزام الرقمي والبيئي</h4>
            <p className="text-xs leading-relaxed" style={{ color: '#374151' }}>
              بموجب طلب هذه الإفادة، تُقر الجهة المذكورة بالتزامها الكامل بالقوانين البيئية المصرية السارية، بما في ذلك القانون رقم 202 لسنة 2020 بشأن تنظيم إدارة المخلفات، والقانون رقم 4 لسنة 1994 بشأن حماية البيئة وتعديلاته، واللائحة التنفيذية لقانون 151 لسنة 2020، وكذلك الاتفاقيات الدولية ذات الصلة بما فيها اتفاقية بازل. كما تُقر بأن جميع البيانات المسجلة على المنصة صحيحة ودقيقة وتتحمل المسؤولية القانونية والجنائية الكاملة عن أي مخالفة.
            </p>
          </div>

          {/* Signatures & Stamps Row */}
          <div className="grid grid-cols-3 gap-4 mb-5">
            {/* Org Signature */}
            <div className="text-center border rounded-lg p-3" style={{ borderColor: '#d1d5db' }}>
              <p className="text-xs mb-2" style={{ color: '#6b7280' }}>توقيع الجهة</p>
              <div className="h-16 flex items-center justify-center bg-gray-50 rounded mb-1">
                {attestation.signer_signature_url ? (
                  <img src={attestation.signer_signature_url} alt="التوقيع" className="max-h-14 object-contain" crossOrigin="anonymous" />
                ) : (
                  <span className="text-xs" style={{ color: '#9ca3af' }}>—</span>
                )}
              </div>
              <p className="text-xs font-medium">{attestation.delegate_name || attestation.organization_name}</p>
            </div>

            {/* Org Stamp */}
            <div className="text-center border rounded-lg p-3" style={{ borderColor: '#d1d5db' }}>
              <p className="text-xs mb-2" style={{ color: '#6b7280' }}>ختم الجهة</p>
              <div className="h-16 flex items-center justify-center bg-gray-50 rounded mb-1">
                {attestation.signer_stamp_url ? (
                  <img src={attestation.signer_stamp_url} alt="الختم" className="max-h-14 object-contain" crossOrigin="anonymous" />
                ) : (
                  <span className="text-xs" style={{ color: '#9ca3af' }}>—</span>
                )}
              </div>
              <p className="text-xs font-medium">{attestation.organization_name}</p>
            </div>

            {/* Platform Seal */}
            <div className="text-center border-2 rounded-lg p-3" style={{ borderColor: '#86efac', background: '#f0fdf4' }}>
              <p className="text-xs mb-2" style={{ color: '#166534' }}>ختم المنصة الرقمي</p>
              <div className="h-16 flex items-center justify-center mb-1">
                <div className="text-center">
                  <div className="text-2xl">🛡️</div>
                  <p className="text-[9px] font-bold" style={{ color: '#166534' }}>معتمد من iRecycle</p>
                </div>
              </div>
              <p className="text-xs font-mono font-bold" style={{ color: '#166534' }}>{attestation.system_seal_number}</p>
            </div>
          </div>

          {/* QR + Barcode Row */}
          <div className="flex items-center justify-between rounded-lg p-4" style={{ border: '1px solid #e5e7eb', background: '#f9fafb' }}>
            <div className="flex items-center gap-4">
              <div className="bg-white p-2 rounded-lg shadow-sm border">
                <QRCodeSVG value={qrData} size={70} level="M" bgColor="#ffffff" fgColor="#166534" />
              </div>
              <div className="text-xs space-y-1">
                <div>
                  <span style={{ color: '#6b7280' }}>كود التحقق: </span>
                  <span className="font-mono font-bold" style={{ color: '#166534' }}>{attestation.verification_code}</span>
                </div>
                <div>
                  <span style={{ color: '#6b7280' }}>رقم الختم: </span>
                  <span className="font-mono font-bold" style={{ color: '#166534' }}>{attestation.system_seal_number}</span>
                </div>
                <div style={{ color: '#9ca3af', fontSize: '9px' }}>
                  للتحقق: {verificationUrl}
                </div>
              </div>
            </div>
            <div>
              <Barcode
                value={attestation.attestation_number}
                width={1.2}
                height={35}
                fontSize={8}
                margin={0}
                displayValue={true}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 pt-3 text-center text-xs" style={{ borderTop: '1px solid #e5e7eb', color: '#9ca3af' }}>
            <p>هذه الإفادة صادرة إلكترونياً من منصة iRecycle لإدارة المخلفات الصناعية والخطرة</p>
            <p className="mt-1">تاريخ ووقت الإصدار: {issuedDate} - {issuedTime}</p>
            <p className="mt-1" style={{ color: '#d1d5db' }}>الصفحة 1 من 2</p>
          </div>
        </div>

        {/* PAGE BREAK */}
        <div style={{ pageBreakBefore: 'always' }} />

        {/* ===== PAGE 2: الشروط والأحكام ===== */}
        <div style={pageStyle} className="print:m-0 relative">
          <div style={watermarkStyle}>iRecycle</div>

          {/* Page 2 Header */}
          <div className="flex items-center justify-between border-b-2 pb-3 mb-4" style={{ borderColor: '#16a34a' }}>
            <div className="flex items-center gap-2">
              <img src={logoImg} alt="iRecycle" className="h-10 w-10 object-contain" crossOrigin="anonymous" />
              <div>
                <h3 className="text-base font-bold" style={{ color: '#166534' }}>الشروط والأحكام والسياسات</h3>
                <p className="text-[10px]" style={{ color: '#6b7280' }}>Terms, Conditions & Policies</p>
              </div>
            </div>
            <div className="text-xs font-mono" style={{ color: '#6b7280' }}>
              إفادة رقم: {attestation.attestation_number}
            </div>
          </div>

          {/* Terms Content */}
          <div className="space-y-3 mb-6">
            {termsSections.length > 0 ? (
              termsSections.map((section, i) => (
                <div key={i} className="print:break-inside-avoid">
                  <h4 className="font-bold text-xs px-2 py-1 rounded mb-1" style={{ backgroundColor: '#f3f4f6', color: '#374151' }}>
                    {i + 1}. {section.title}
                  </h4>
                  <div className="pr-3 space-y-1">
                    {Array.isArray(section.content) ? section.content.map((c, j) => (
                      <p key={j} className="text-[10px] leading-relaxed" style={{ color: '#4b5563' }}>{c}</p>
                    )) : (
                      <p className="text-[10px] leading-relaxed" style={{ color: '#4b5563' }}>{String(section.content)}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8" style={{ color: '#9ca3af' }}>
                <p className="text-sm">الشروط والأحكام التفصيلية متاحة عبر المنصة</p>
              </div>
            )}
          </div>

          {/* Legal Footer on Page 2 */}
          <div className="rounded-lg p-3 mb-4" style={{ border: '1px solid #fecaca', background: '#fef2f2' }}>
            <p className="text-[9px] font-bold text-center mb-1" style={{ color: '#991b1b' }}>⚖️ إخلاء مسؤولية قانوني</p>
            <p className="text-[8px] text-center leading-relaxed" style={{ color: '#7f1d1d' }}>
              هذه الإفادة صادرة إلكترونياً استناداً للبيانات المسجلة على المنصة بواسطة الجهة المذكورة. المنصة غير مسؤولة عن صحة البيانات المدخلة من قبل المستخدمين وتقع المسؤولية القانونية والجنائية الكاملة على عاتقهم وفقاً لأحكام القانون المصري. هذه الوثيقة لا تُعد ترخيصاً حكومياً ولا تحل محل أي تراخيص رسمية صادرة من الجهات الحكومية المختصة.
            </p>
          </div>

          {/* Page 2 Platform Seal */}
          <div className="flex items-center justify-between rounded-lg p-3" style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '2px solid #86efac' }}>
            <div className="flex items-center gap-3">
              <div className="bg-white p-1.5 rounded-lg shadow-sm border">
                <QRCodeSVG value={qrData} size={50} level="M" bgColor="#ffffff" fgColor="#166534" />
              </div>
              <div className="text-xs">
                <p className="font-bold" style={{ color: '#166534' }}>مختوم رقمياً بختم منصة iRecycle</p>
                <p className="font-mono text-[9px]" style={{ color: '#4ade80' }}>{attestation.system_seal_number}</p>
              </div>
            </div>
            <Barcode
              value={attestation.attestation_number}
              width={1}
              height={28}
              fontSize={7}
              margin={0}
              displayValue={true}
            />
          </div>

          {/* Page 2 Footer */}
          <div className="mt-4 pt-3 text-center text-xs" style={{ borderTop: '1px solid #e5e7eb', color: '#9ca3af' }}>
            <p>كلتا صفحتي هذه الوثيقة مختومتان رقمياً ولا تصح إحداهما دون الأخرى</p>
            <p className="mt-1" style={{ color: '#d1d5db' }}>الصفحة 2 من 2</p>
          </div>
        </div>
      </div>
    );
  }
);

AttestationDocumentPrint.displayName = 'AttestationDocumentPrint';

export default AttestationDocumentPrint;
