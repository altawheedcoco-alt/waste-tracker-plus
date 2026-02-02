import { forwardRef } from 'react';
import { getTermsSections, OrganizationType } from '@/data/organizationTermsContent';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface TermsDocumentPrintProps {
  acceptance: {
    id: string;
    full_name: string | null;
    organization_name: string | null;
    organization_type: string;
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
    const sections = getTermsSections(acceptance.organization_type as OrganizationType);
    
    const getOrgTypeLabel = (type: string) => {
      switch (type) {
        case 'generator': return 'الجهة المولدة للمخلفات';
        case 'transporter': return 'الجهة الناقلة للمخلفات';
        case 'recycler': return 'الجهة المدورة للمخلفات';
        default: return type;
      }
    };

    return (
      <div ref={ref} className="bg-white text-black p-8 max-w-4xl mx-auto" dir="rtl">
        {/* Header */}
        <div className="text-center border-b-2 border-gray-300 pb-6 mb-6">
          <div className="flex justify-center mb-4">
            <img 
              src="/lovable-uploads/d3dbed14-6b0a-4a5a-90b3-de9dbfc586e3.png" 
              alt="I-Recycle Logo" 
              className="h-16 object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            وثيقة الموافقة على الشروط والأحكام
          </h1>
          <p className="text-sm text-gray-600">
            منصة I-Recycle لإدارة المخلفات الصناعية
          </p>
          <div className="mt-3 inline-block bg-amber-100 text-amber-800 px-4 py-1 rounded-full text-xs font-medium">
            🔒 هذه الوثيقة سرية ومؤمنة
          </div>
        </div>

        {/* Acceptance Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 border">
          <h2 className="font-bold text-lg mb-3 text-gray-800">بيانات الموقّع القانونية</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">اسم الموقّع:</span>
              <span className="font-medium mr-2">{acceptance.full_name || 'غير محدد'}</span>
            </div>
            <div>
              <span className="text-gray-500">الرقم القومي:</span>
              <span className="font-medium mr-2 font-mono">{acceptance.signer_national_id || 'غير محدد'}</span>
            </div>
            <div>
              <span className="text-gray-500">المسمى الوظيفي:</span>
              <span className="font-medium mr-2">{acceptance.signer_position || 'غير محدد'}</span>
            </div>
            <div>
              <span className="text-gray-500">رقم الهاتف:</span>
              <span className="font-medium mr-2">{acceptance.signer_phone || 'غير محدد'}</span>
            </div>
            <div>
              <span className="text-gray-500">اسم الجهة:</span>
              <span className="font-medium mr-2">{acceptance.organization_name || 'غير محدد'}</span>
            </div>
            <div>
              <span className="text-gray-500">نوع الجهة:</span>
              <span className="font-medium mr-2">{getOrgTypeLabel(acceptance.organization_type)}</span>
            </div>
            <div>
              <span className="text-gray-500">إصدار الشروط:</span>
              <span className="font-medium mr-2">{acceptance.terms_version}</span>
            </div>
            <div>
              <span className="text-gray-500">تاريخ الموافقة:</span>
              <span className="font-medium mr-2">
                {format(new Date(acceptance.accepted_at), 'dd MMMM yyyy - hh:mm a', { locale: ar })}
              </span>
            </div>
            <div>
              <span className="text-gray-500">رقم الوثيقة:</span>
              <span className="font-medium mr-2 font-mono text-xs">
                TA-{acceptance.id.slice(0, 8).toUpperCase()}
              </span>
            </div>
            <div>
              <span className="text-gray-500">حالة التحقق:</span>
              <span className={`font-medium mr-2 ${acceptance.verified_match ? 'text-green-600' : 'text-amber-600'}`}>
                {acceptance.verified_match ? '✓ تم التحقق' : '⚠ قيد المراجعة'}
              </span>
            </div>
          </div>
        </div>

        {/* ID Card Images */}
        {(acceptance.signer_id_front_url || acceptance.signer_id_back_url) && (
          <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
            <h2 className="font-bold text-lg mb-3 text-gray-800">صور إثبات الهوية</h2>
            <div className="grid grid-cols-2 gap-4">
              {acceptance.signer_id_front_url && (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">وجه البطاقة الشخصية</p>
                  <img 
                    src={acceptance.signer_id_front_url} 
                    alt="وجه البطاقة" 
                    className="max-h-40 mx-auto rounded border border-gray-300"
                  />
                </div>
              )}
              {acceptance.signer_id_back_url && (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">ظهر البطاقة الشخصية</p>
                  <img 
                    src={acceptance.signer_id_back_url} 
                    alt="ظهر البطاقة" 
                    className="max-h-40 mx-auto rounded border border-gray-300"
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
          
          {sections.map((section, index) => (
            <div key={`section-${index}`} className="mb-4">
              <h3 className="font-bold text-sm text-gray-700 mb-2">
                {index + 1}. {section.title}
              </h3>
              <div className="text-xs text-gray-600 leading-relaxed whitespace-pre-line pr-4">
                {section.content}
              </div>
            </div>
          ))}
        </div>

        {/* Electronic Signature Section */}
        <div className="border-t-2 border-gray-300 pt-6 mt-6">
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
                {showSignature && acceptance.signer_signature_url ? (
                  <img 
                    src={acceptance.signer_signature_url} 
                    alt="توقيع الموقّع" 
                    className="max-h-14 mx-auto"
                  />
                ) : (
                  <span className="text-xs text-gray-400">
                    {showSignature ? 'لا يوجد توقيع' : 'التوقيع محفوظ لدى الإدارة'}
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
                <span className="text-xs text-primary font-bold">✓ موثق إلكترونياً من I-Recycle</span>
              </div>
              <p className="font-medium text-sm">منصة I-Recycle</p>
              <p className="text-xs text-gray-500">لإدارة المخلفات الصناعية</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t text-center text-xs text-gray-500">
          <p>تم إنشاء هذه الوثيقة إلكترونياً من منصة I-Recycle لإدارة المخلفات الصناعية</p>
          <p className="mt-1">
            رقم التحقق: EG-I-RECYCLE-TA-{acceptance.id.slice(0, 8).toUpperCase()}
          </p>
          <p className="mt-2 text-gray-400">
            تاريخ الطباعة: {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ar })}
          </p>
        </div>
      </div>
    );
  }
);

TermsDocumentPrint.displayName = 'TermsDocumentPrint';

export default TermsDocumentPrint;
