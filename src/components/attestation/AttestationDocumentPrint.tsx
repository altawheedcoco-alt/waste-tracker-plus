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
      height: '297mm',
      padding: '8mm 10mm',
      boxSizing: 'border-box',
      backgroundColor: '#ffffff',
      color: '#1a1a1a',
      position: 'relative',
      overflow: 'hidden',
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
          <div className="flex items-center justify-between pb-2 mb-3" style={{ borderBottom: '2px solid #16a34a' }}>
            <div className="flex items-center gap-2">
              <img src={logoImg} alt="iRecycle" className="h-10 w-10 object-contain" crossOrigin="anonymous" />
              <div>
                <h1 className="text-base font-bold" style={{ color: '#166534' }}>منصة iRecycle</h1>
                <p style={{ fontSize: '9px', color: '#6b7280' }}>لإدارة المخلفات الصناعية والخطرة</p>
              </div>
            </div>
            <div className="text-left">
              <div className="font-mono" style={{ fontSize: '10px', color: '#6b7280' }}>
                رقم الإفادة: <span className="font-bold" style={{ color: '#166534' }}>{attestation.attestation_number}</span>
              </div>
              <div style={{ fontSize: '10px', color: '#6b7280' }}>
                تاريخ الإصدار: {issuedDate}
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-3">
            <div className="inline-block px-6 py-2 rounded-lg" style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '2px solid #86efac' }}>
              <h2 className="text-lg font-bold" style={{ color: '#166534' }}>إفادة تسجيل واعتماد رقمي</h2>
              <p style={{ fontSize: '10px', marginTop: '2px', color: '#4ade80' }}>Digital Registration & Compliance Attestation</p>
            </div>
          </div>

          {/* Body Text */}
          <div className="mb-3 leading-relaxed" style={{ fontSize: '11px', color: '#374151' }}>
            <p>
              تُفيد منصة <strong style={{ color: '#166534' }}>iRecycle لإدارة المخلفات الصناعية والخطرة</strong> بأن الجهة المذكورة أدناه مسجلة لدى النظام ومتحقق من بياناتها، وأنها وافقت على الشروط والأحكام والسياسات الخاصة بالمنصة، وتزاول أعمالها إلكترونياً عبر المنصة من توقيعات وأختام رقمية وتتبع ومانيفست إلكتروني وفقاً لأحدث النظم الرقمية.
            </p>
          </div>

          {/* Organization Details Card */}
          <div className="rounded-lg p-3 mb-3" style={{ border: '1px solid #d1d5db', background: '#fafafa' }}>
            <div className="flex items-start gap-3 mb-2">
              {attestation.organization_logo_url && (
                <img
                  src={attestation.organization_logo_url}
                  alt="شعار المنظمة"
                  className="h-12 w-12 rounded-lg object-contain border"
                  crossOrigin="anonymous"
                />
              )}
              <div className="flex-1">
                <h3 className="text-sm font-bold" style={{ color: '#111827' }}>{attestation.organization_name}</h3>
                <span style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '9999px', backgroundColor: '#dcfce7', color: '#166534', fontWeight: 500 }}>
                  {getOrgTypePrefix(attestation.organization_type)} - {getOrgTypeLabel(attestation.organization_type)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-1" style={{ fontSize: '10px' }}>
              {attestation.digital_declaration_number && (
                <div className="flex gap-1">
                  <span style={{ color: '#6b7280' }}>رقم الإقرار الرقمي:</span>
                  <span className="font-mono font-bold" style={{ color: '#166534' }}>{attestation.digital_declaration_number}</span>
                </div>
              )}
              {attestation.commercial_register && (
                <div className="flex gap-1">
                  <span style={{ color: '#6b7280' }}>السجل التجاري:</span>
                  <span className="font-medium">{attestation.commercial_register}</span>
                </div>
              )}
              {attestation.tax_number && (
                <div className="flex gap-1">
                  <span style={{ color: '#6b7280' }}>الرقم الضريبي:</span>
                  <span className="font-medium">{attestation.tax_number}</span>
                </div>
              )}
              {attestation.organization_address && (
                <div className="flex gap-1 col-span-2">
                  <span style={{ color: '#6b7280' }}>العنوان:</span>
                  <span className="font-medium">{attestation.organization_address}</span>
                </div>
              )}
              {attestation.organization_phone && (
                <div className="flex gap-1">
                  <span style={{ color: '#6b7280' }}>الهاتف:</span>
                  <span className="font-medium">{attestation.organization_phone}</span>
                </div>
              )}
              {attestation.organization_email && (
                <div className="flex gap-1">
                  <span style={{ color: '#6b7280' }}>البريد الإلكتروني:</span>
                  <span className="font-medium">{attestation.organization_email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Delegate / Representative */}
          {attestation.delegate_name && (
            <div className="rounded-lg p-3 mb-3" style={{ border: '1px solid #bfdbfe', background: '#eff6ff' }}>
              <h4 className="font-bold mb-1" style={{ fontSize: '11px', color: '#1e40af' }}>المفوض / الممثل القانوني</h4>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1" style={{ fontSize: '10px' }}>
                <div className="flex gap-1">
                  <span style={{ color: '#6b7280' }}>الاسم:</span>
                  <span className="font-bold">{attestation.delegate_name}</span>
                </div>
                {attestation.delegate_position && (
                  <div className="flex gap-1">
                    <span style={{ color: '#6b7280' }}>المسمى الوظيفي:</span>
                    <span>{attestation.delegate_position}</span>
                  </div>
                )}
                {attestation.delegate_national_id && (
                  <div className="flex gap-1">
                    <span style={{ color: '#6b7280' }}>الرقم القومي:</span>
                    <span className="font-mono">{attestation.delegate_national_id}</span>
                  </div>
                )}
                {attestation.delegate_phone && (
                  <div className="flex gap-1">
                    <span style={{ color: '#6b7280' }}>الهاتف:</span>
                    <span>{attestation.delegate_phone}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Verification Status Grid */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {[
              { label: 'الموافقة على الشروط والأحكام', ok: attestation.terms_accepted },
              { label: 'التحقق من الهوية (KYC)', ok: attestation.kyc_complete },
              { label: 'صلاحية التراخيص البيئية', ok: attestation.licenses_valid },
              { label: 'التحقق البيومتري', ok: attestation.identity_verified },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-lg p-2"
                style={{
                  fontSize: '10px',
                  border: `1px solid ${item.ok ? '#86efac' : '#fed7aa'}`,
                  backgroundColor: item.ok ? '#f0fdf4' : '#fff7ed',
                }}
              >
                <span>{item.ok ? '✅' : '⚠️'}</span>
                <span className="font-medium" style={{ color: item.ok ? '#166534' : '#9a3412' }}>{item.label}</span>
              </div>
            ))}
          </div>

          {/* Digital Compliance Statement */}
          <div className="rounded-lg p-3 mb-3" style={{ background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)', border: '1px solid #86efac' }}>
            <h4 className="font-bold mb-1" style={{ fontSize: '10px', color: '#166534' }}>📋 إقرار الالتزام الرقمي والبيئي</h4>
            <p style={{ fontSize: '9px', lineHeight: '1.6', color: '#374151' }}>
              بموجب طلب هذه الإفادة، تُقر الجهة المذكورة بالتزامها الكامل بالقوانين البيئية المصرية السارية، بما في ذلك القانون رقم 202 لسنة 2020 بشأن تنظيم إدارة المخلفات، والقانون رقم 4 لسنة 1994 بشأن حماية البيئة وتعديلاته، واللائحة التنفيذية لقانون 151 لسنة 2020، وكذلك الاتفاقيات الدولية ذات الصلة بما فيها اتفاقية بازل. كما تُقر بأن جميع البيانات المسجلة على المنصة صحيحة ودقيقة وتتحمل المسؤولية القانونية والجنائية الكاملة عن أي مخالفة.
            </p>
          </div>

          {/* Signatures & Stamps Row */}
          <div className="grid grid-cols-3 gap-3 mb-3">
            {/* Org Signature */}
            <div className="text-center border rounded-lg p-2" style={{ borderColor: '#d1d5db' }}>
              <p style={{ fontSize: '9px', marginBottom: '4px', color: '#6b7280' }}>توقيع الجهة</p>
              <div className="flex items-center justify-center rounded mb-1" style={{ height: '40px', background: '#f9fafb' }}>
                {attestation.signer_signature_url ? (
                  <img src={attestation.signer_signature_url} alt="التوقيع" style={{ maxHeight: '36px' }} className="object-contain" crossOrigin="anonymous" />
                ) : (
                  <span style={{ fontSize: '9px', color: '#9ca3af' }}>—</span>
                )}
              </div>
              <p style={{ fontSize: '9px', fontWeight: 500 }}>{attestation.delegate_name || attestation.organization_name}</p>
            </div>

            {/* Org Stamp */}
            <div className="text-center border rounded-lg p-2" style={{ borderColor: '#d1d5db' }}>
              <p style={{ fontSize: '9px', marginBottom: '4px', color: '#6b7280' }}>ختم الجهة</p>
              <div className="flex items-center justify-center rounded mb-1" style={{ height: '40px', background: '#f9fafb' }}>
                {attestation.signer_stamp_url ? (
                  <img src={attestation.signer_stamp_url} alt="الختم" style={{ maxHeight: '36px' }} className="object-contain" crossOrigin="anonymous" />
                ) : (
                  <span style={{ fontSize: '9px', color: '#9ca3af' }}>—</span>
                )}
              </div>
              <p style={{ fontSize: '9px', fontWeight: 500 }}>{attestation.organization_name}</p>
            </div>

            {/* Platform Seal */}
            <div className="text-center rounded-lg p-2" style={{ border: '2px solid #86efac', background: '#f0fdf4' }}>
              <p style={{ fontSize: '9px', marginBottom: '4px', color: '#166534' }}>ختم المنصة الرقمي</p>
              <div className="flex items-center justify-center mb-1" style={{ height: '40px' }}>
                <div className="text-center">
                  <div style={{ fontSize: '20px' }}>🛡️</div>
                  <p style={{ fontSize: '7px', fontWeight: 'bold', color: '#166534' }}>معتمد من iRecycle</p>
                </div>
              </div>
              <p className="font-mono font-bold" style={{ fontSize: '8px', color: '#166534' }}>{attestation.system_seal_number}</p>
            </div>
          </div>

          {/* QR + Barcode Row */}
          <div className="flex items-center justify-between rounded-lg p-3" style={{ border: '1px solid #e5e7eb', background: '#f9fafb' }}>
            <div className="flex items-center gap-3">
              <div className="bg-white p-1.5 rounded-lg shadow-sm border">
                <QRCodeSVG value={qrData} size={55} level="M" bgColor="#ffffff" fgColor="#166534" />
              </div>
              <div style={{ fontSize: '9px' }} className="space-y-0.5">
                <div>
                  <span style={{ color: '#6b7280' }}>كود التحقق: </span>
                  <span className="font-mono font-bold" style={{ color: '#166534' }}>{attestation.verification_code}</span>
                </div>
                <div>
                  <span style={{ color: '#6b7280' }}>رقم الختم: </span>
                  <span className="font-mono font-bold" style={{ color: '#166534' }}>{attestation.system_seal_number}</span>
                </div>
                <div style={{ color: '#9ca3af', fontSize: '8px' }}>
                  للتحقق: {verificationUrl}
                </div>
              </div>
            </div>
            <div>
              <Barcode
                value={attestation.attestation_number}
                width={1}
                height={30}
                fontSize={7}
                margin={0}
                displayValue={true}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="text-center" style={{ marginTop: '6px', paddingTop: '4px', borderTop: '1px solid #e5e7eb', color: '#9ca3af', fontSize: '9px' }}>
            <p>هذه الإفادة صادرة إلكترونياً من منصة iRecycle لإدارة المخلفات الصناعية والخطرة</p>
            <p style={{ marginTop: '2px' }}>تاريخ ووقت الإصدار: {issuedDate} - {issuedTime}</p>
            <p style={{ marginTop: '2px', color: '#d1d5db' }}>الصفحة 1 من 2</p>
          </div>
        </div>

        {/* PAGE BREAK */}
        <div style={{ pageBreakBefore: 'always' }} />

        {/* ===== PAGE 2: الشروط والأحكام ===== */}
        <div style={pageStyle} className="print:m-0 relative">
          <div style={watermarkStyle}>iRecycle</div>

          {/* Page 2 Header */}
          <div className="flex items-center justify-between pb-2 mb-3" style={{ borderBottom: '2px solid #16a34a' }}>
            <div className="flex items-center gap-2">
              <img src={logoImg} alt="iRecycle" className="h-8 w-8 object-contain" crossOrigin="anonymous" />
              <div>
                <h3 className="font-bold" style={{ fontSize: '13px', color: '#166534' }}>الشروط والأحكام والسياسات</h3>
                <p style={{ fontSize: '8px', color: '#6b7280' }}>Terms, Conditions & Policies</p>
              </div>
            </div>
            <div className="font-mono" style={{ fontSize: '9px', color: '#6b7280' }}>
              إفادة رقم: {attestation.attestation_number}
            </div>
          </div>

          {/* Terms Content - compact to fit in one page */}
          <div className="mb-4" style={{ columnCount: 2, columnGap: '12px' }}>
            {termsSections.length > 0 ? (
              termsSections.map((section, i) => (
                <div key={i} style={{ breakInside: 'avoid', marginBottom: '6px' }}>
                  <h4 className="font-bold px-1.5 py-0.5 rounded" style={{ fontSize: '9px', backgroundColor: '#f3f4f6', color: '#374151', marginBottom: '2px' }}>
                    {i + 1}. {section.title}
                  </h4>
                  <div style={{ paddingRight: '6px' }}>
                    {Array.isArray(section.content) ? section.content.map((c, j) => (
                      <p key={j} style={{ fontSize: '8px', lineHeight: '1.5', color: '#4b5563', marginBottom: '1px' }}>{c}</p>
                    )) : (
                      <p style={{ fontSize: '8px', lineHeight: '1.5', color: '#4b5563' }}>{String(section.content)}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4" style={{ color: '#9ca3af', columnSpan: 'all' as any }}>
                <p style={{ fontSize: '11px' }}>الشروط والأحكام التفصيلية متاحة عبر المنصة</p>
              </div>
            )}
          </div>

          {/* Legal Footer on Page 2 */}
          <div className="rounded-lg p-2 mb-3" style={{ border: '1px solid #fecaca', background: '#fef2f2' }}>
            <p className="font-bold text-center" style={{ fontSize: '8px', color: '#991b1b', marginBottom: '2px' }}>⚖️ إخلاء مسؤولية قانوني</p>
            <p className="text-center" style={{ fontSize: '7px', lineHeight: '1.5', color: '#7f1d1d' }}>
              هذه الإفادة صادرة إلكترونياً استناداً للبيانات المسجلة على المنصة بواسطة الجهة المذكورة. المنصة غير مسؤولة عن صحة البيانات المدخلة من قبل المستخدمين وتقع المسؤولية القانونية والجنائية الكاملة على عاتقهم وفقاً لأحكام القانون المصري. هذه الوثيقة لا تُعد ترخيصاً حكومياً ولا تحل محل أي تراخيص رسمية صادرة من الجهات الحكومية المختصة.
            </p>
          </div>

          {/* Page 2 Platform Seal */}
          <div className="flex items-center justify-between rounded-lg p-2" style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '2px solid #86efac' }}>
            <div className="flex items-center gap-2">
              <div className="bg-white p-1 rounded-lg shadow-sm border">
                <QRCodeSVG value={qrData} size={40} level="M" bgColor="#ffffff" fgColor="#166534" />
              </div>
              <div style={{ fontSize: '9px' }}>
                <p className="font-bold" style={{ color: '#166534' }}>مختوم رقمياً بختم منصة iRecycle</p>
                <p className="font-mono" style={{ fontSize: '7px', color: '#4ade80' }}>{attestation.system_seal_number}</p>
              </div>
            </div>
            <Barcode
              value={attestation.attestation_number}
              width={0.8}
              height={24}
              fontSize={6}
              margin={0}
              displayValue={true}
            />
          </div>

          {/* Page 2 Footer */}
          <div className="text-center" style={{ marginTop: '6px', paddingTop: '4px', borderTop: '1px solid #e5e7eb', color: '#9ca3af', fontSize: '8px' }}>
            <p>كلتا صفحتي هذه الوثيقة مختومتان رقمياً ولا تصح إحداهما دون الأخرى</p>
            <p style={{ marginTop: '2px', color: '#d1d5db' }}>الصفحة 2 من 2</p>
          </div>
        </div>
      </div>
    );
  }
);

AttestationDocumentPrint.displayName = 'AttestationDocumentPrint';

export default AttestationDocumentPrint;
