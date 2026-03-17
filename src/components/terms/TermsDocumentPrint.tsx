import { forwardRef, useEffect, useState } from 'react';
import { getTermsSections, OrganizationType } from '@/data/organizationTermsContent';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface TermsSection {
  title: string;
  content: string[];
}

interface TermsDocumentPrintProps {
  acceptance: {
    id: string;
    full_name: string | null;
    organization_name: string | null;
    organization_type: string;
    organization_logo_url?: string | null;
    terms_version: string;
    accepted_at: string;
    ip_address: string | null;
    signer_national_id?: string | null;
    signer_phone?: string | null;
    signer_position?: string | null;
    signer_id_front_url?: string | null;
    signer_id_back_url?: string | null;
    signer_signature_url?: string | null;
    verified_match?: boolean;
  };
  showSignature?: boolean; // Only true for admin view
}

const TermsDocumentPrint = forwardRef<HTMLDivElement, TermsDocumentPrintProps>(
  ({ acceptance, showSignature = false }, ref) => {
    const [sections, setSections] = useState<TermsSection[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch terms content from database
    useEffect(() => {
      const fetchTerms = async () => {
        try {
          const { data, error } = await supabase
            .from('terms_content')
            .select('sections')
            .eq('organization_type', acceptance.organization_type)
            .eq('is_active', true)
            .maybeSingle();

          if (error) throw error;

          if (data?.sections && Array.isArray(data.sections)) {
            // Cast through unknown to handle JSON type
            const parsedSections = (data.sections as unknown) as TermsSection[];
            setSections(parsedSections);
          } else {
            // Fallback to static content
            const staticSections = getTermsSections(acceptance.organization_type as OrganizationType);
            setSections(staticSections.map(s => ({
              title: s.title,
              content: Array.isArray(s.content) ? s.content : [String(s.content)]
            })));
          }
        } catch (error) {
          console.error('Error fetching terms:', error);
          // Fallback to static content
          const staticSections = getTermsSections(acceptance.organization_type as OrganizationType);
          setSections(staticSections.map(s => ({
            title: s.title,
            content: Array.isArray(s.content) ? s.content : [String(s.content)]
          })));
        } finally {
          setIsLoading(false);
        }
      };

      fetchTerms();
    }, [acceptance.organization_type]);
    
    const getOrgTypeLabel = (type: string) => {
      switch (type) {
        case 'generator': return 'الجهة المولدة للمخلفات';
        case 'transporter': return 'الجهة الناقلة للمخلفات';
        case 'recycler': return 'الجهة المدورة للمخلفات';
        default: return type;
      }
    };

    return (
      <div 
        ref={ref} 
        className="bg-white text-black mx-auto print:m-0 no-guilloche" 
        dir="rtl" 
        style={{ 
          fontFamily: 'Cairo, sans-serif',
          width: '210mm',
          minHeight: '297mm',
          padding: '15mm 15mm 20mm 15mm',
          boxSizing: 'border-box'
        }}
      >
        {/* Header */}
        <div className="text-center border-b-2 border-gray-300 pb-4 mb-4">
          <h1 className="text-xl font-bold text-gray-800 mb-1">
            وثيقة الموافقة على الشروط والأحكام
          </h1>
          <p className="text-xs text-gray-600">
            منصة iRecycle لإدارة المخلفات الصناعية
          </p>
          <div className="mt-2 inline-block bg-amber-100 text-amber-800 px-3 py-0.5 rounded-full text-[10px] font-medium">
            🔒 هذه الوثيقة سرية ومؤمنة
          </div>
        </div>

        {/* ID Card Images - Side by Side */}
        {(acceptance.signer_id_front_url || acceptance.signer_id_back_url) && (
          <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-200">
            <h2 className="font-bold text-sm mb-3 text-gray-800 text-center">صور إثبات الهوية</h2>
            <div className="flex items-center justify-center gap-4">
              {acceptance.signer_id_front_url && (
                <div className="text-center flex-1 max-w-[45%]">
                  <p className="text-[10px] text-gray-600 mb-1">وجه البطاقة</p>
                  <img 
                    src={acceptance.signer_id_front_url} 
                    alt="وجه البطاقة" 
                    className="w-full h-32 object-contain rounded border border-gray-300 bg-white"
                    crossOrigin="anonymous"
                  />
                </div>
              )}
              {acceptance.signer_id_back_url && (
                <div className="text-center flex-1 max-w-[45%]">
                  <p className="text-[10px] text-gray-600 mb-1">ظهر البطاقة</p>
                  <img 
                    src={acceptance.signer_id_back_url} 
                    alt="ظهر البطاقة" 
                    className="w-full h-32 object-contain rounded border border-gray-300 bg-white"
                    crossOrigin="anonymous"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Terms Content */}
        <div className="mb-6">
          <h2 className="font-bold text-lg mb-4 text-gray-800 border-b pb-2">
            الشروط والأحكام - {getOrgTypeLabel(acceptance.organization_type)}
          </h2>
          
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">
              جاري تحميل الشروط والأحكام...
            </div>
          ) : sections.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              لا توجد شروط وأحكام متاحة
            </div>
          ) : (
            sections.map((section, index) => (
              <div key={`section-${index}`} className="mb-6 print:break-inside-avoid">
                <h3 className="font-bold text-base text-gray-700 mb-3 bg-gray-100 px-3 py-2 rounded">
                  {index + 1}. {section.title}
                </h3>
                <div className="pr-4 space-y-2">
                  {Array.isArray(section.content) ? (
                    section.content.map((item, itemIndex) => (
                      <p key={`item-${itemIndex}`} className="text-sm text-gray-600 leading-relaxed">
                        {item}
                      </p>
                    ))
                  ) : (
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                      {String(section.content)}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Electronic Signature Section */}
        <div className="border-t-2 border-gray-300 pt-6 mt-6 print:break-inside-avoid">
          <h2 className="font-bold text-lg mb-4 text-gray-800 flex items-center gap-2">
            <span>✍️</span> التوقيع الإلكتروني والموافقة
          </h2>
          
          {/* Electronic Signature Box */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">اسم الموقّع الإلكتروني:</p>
                <p className="font-bold text-lg text-blue-800">{acceptance.full_name || 'غير محدد'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">الرقم القومي:</p>
                <p className="font-bold text-lg text-blue-800 font-mono">{acceptance.signer_national_id || 'غير محدد'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">المسمى الوظيفي:</p>
                <p className="font-medium">{acceptance.signer_position || 'غير محدد'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">رقم الهاتف:</p>
                <p className="font-medium">{acceptance.signer_phone || 'غير محدد'}</p>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">تاريخ ووقت التوقيع الإلكتروني:</p>
                  <p className="font-bold text-blue-800">
                    {format(new Date(acceptance.accepted_at), 'dd MMMM yyyy - hh:mm:ss a', { locale: ar })}
                  </p>
                </div>
                <div className="text-left">
                  <p className="text-sm text-gray-600">عنوان IP:</p>
                  <p className="font-mono text-sm">{acceptance.ip_address || 'غير متاح'}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 bg-white rounded p-3 border border-blue-100">
              <p className="text-xs text-gray-600 text-center">
                🔐 تم التوقيع إلكترونياً وفقاً لقانون التوقيع الإلكتروني المصري رقم 15 لسنة 2004
              </p>
              <p className="text-xs text-gray-500 text-center mt-1">
                هذا التوقيع الإلكتروني له نفس الحجية القانونية للتوقيع الخطي
              </p>
            </div>

            {/* Legal Binding Notice */}
            <div className="mt-4 bg-red-50 border border-red-200 rounded p-3">
              <p className="text-xs font-bold text-red-800 text-center mb-1">
                ⚖️ إقرار قانوني ملزم
              </p>
              <p className="text-[10px] text-red-700 text-center leading-relaxed">
                يُعتبر تسجيل المستخدم على منصة iRecycle وإتمام عملية التسجيل بمثابة موافقة صريحة وكاملة وغير مشروطة على جميع الشروط والأحكام والسياسات المنصوص عليها في هذه الوثيقة، ويُعد التوقيع الإلكتروني المثبت أعلاه بمثابة إقرار قانوني ملزم بقبول كافة البنود والالتزامات الواردة فيها، وذلك وفقاً لأحكام القانون المصري رقم 15 لسنة 2004 بشأن التوقيع الإلكتروني ولائحته التنفيذية.
              </p>
            </div>
          </div>

          {/* Verification Status */}
          <div className={`rounded-lg p-3 mb-6 ${acceptance.verified_match ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
            <div className="flex items-center gap-2">
              <span className="text-xl">{acceptance.verified_match ? '✅' : '⚠️'}</span>
              <div>
                <p className={`font-bold ${acceptance.verified_match ? 'text-green-700' : 'text-amber-700'}`}>
                  {acceptance.verified_match ? 'تم التحقق من تطابق الهوية' : 'قيد المراجعة والتحقق'}
                </p>
                <p className="text-xs text-gray-600">
                  {acceptance.verified_match 
                    ? 'بيانات الموقّع متطابقة مع بيانات الحساب المسجل'
                    : 'يرجى مراجعة البيانات والتأكد من صحتها'}
                </p>
              </div>
            </div>
          </div>

          {/* Official Signatures Grid */}
          <div className="grid grid-cols-2 gap-8">
            <div className="text-center border rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">توقيع الموافق</p>
              <div className="border-b-2 border-gray-400 min-h-16 mb-2 flex items-center justify-center bg-gray-50 rounded">
                {acceptance.signer_signature_url ? (
                  <img 
                    src={acceptance.signer_signature_url} 
                    alt="توقيع الموقّع" 
                    className="max-h-14 mx-auto"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <span className="text-xs text-gray-400">
                    لا يوجد توقيع
                  </span>
                )}
              </div>
              <p className="font-medium text-sm">{acceptance.full_name || 'غير محدد'}</p>
              <p className="text-xs text-gray-500">{acceptance.signer_position || ''}</p>
              <p className="text-xs text-gray-400 mt-1">الرقم القومي: {acceptance.signer_national_id || 'غير محدد'}</p>
            </div>
            <div className="text-center border rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">ختم المنصة</p>
              <div className="border-2 border-dashed border-primary/30 h-16 mb-2 flex items-center justify-center bg-primary/5 rounded">
                <span className="text-xs text-primary font-bold">✓ موثق إلكترونياً من iRecycle</span>
              </div>
              <p className="font-medium text-sm">منصة iRecycle</p>
              <p className="text-xs text-gray-500">لإدارة المخلفات الصناعية</p>
            </div>
          </div>
        </div>

        {/* Legal Disclaimer Footer */}
        <div className="mt-6 pt-3 border-t-2 border-gray-300 print:break-inside-avoid">
          <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-3">
            <p className="text-[9px] font-bold text-gray-700 text-center mb-1">
              ⚖️ إخلاء مسؤولية قانوني
            </p>
            <p className="text-[8px] text-gray-600 text-center leading-relaxed">
              تُعتبر منصة iRecycle جهة وسيطة تقنية (Service Provider) تعمل على تنظيم وتسهيل الربط المعلوماتي واللوجستي.
              المنصة غير مسؤولة قانوناً عن صحة البيانات المدخلة من قبل المستخدمين، أو عن طبيعة المواد المنقولة فعلياً،
              أو عن أي مخالفات تشغيلية تقع من أطراف التعاقد خارج النطاق الرقمي للمنصة.
              تقع المسؤولية القانونية والبيئية والضريبية الكاملة على عاتق المستخدم/المنشأة صاحب الحساب.
            </p>
            <p className="text-[8px] text-gray-500 text-center mt-1">
              مستند صادر آلياً من نظام iRecycle ولا يُعتد به بدون رمز التحقق الرقمي — وفقاً لقانون التوقيع الإلكتروني المصري رقم 15 لسنة 2004
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 text-center text-xs text-gray-500">
          <p>تم إنشاء هذه الوثيقة إلكترونياً من منصة iRecycle لإدارة المخلفات الصناعية</p>
          <p className="mt-1">
            رقم التحقق: EG-I-RECYCLE-TA-{acceptance.id.slice(0, 8).toUpperCase()}
          </p>
          <p className="mt-2 text-gray-400">
            تاريخ الطباعة: {format(new Date(), 'dd/MM/yyyy hh:mm a', { locale: ar })}
          </p>
        </div>
      </div>
    );
  }
);

TermsDocumentPrint.displayName = 'TermsDocumentPrint';

export default TermsDocumentPrint;
