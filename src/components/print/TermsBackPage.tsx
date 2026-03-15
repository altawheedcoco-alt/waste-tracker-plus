import { Shield, CheckCircle2, Lock, Leaf, Truck, Recycle, Building2, Flame, FileCheck, Gavel, BadgeCheck, AlertTriangle, Users, Scale } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import PlatformLogo from '@/components/common/PlatformLogo';

const POLICY_VERSION = '2.0.0';

const TermsBackPage = () => {
  const sections = [
    {
      icon: Building2,
      title: 'التزامات المولد (GEN)',
      points: [
        'الإفصاح الدقيق عن نوع وكمية المخلفات وفصل الخطرة عن غير الخطرة قبل التسليم',
        'الحصول على التراخيص اللازمة من WMRA/EEAA/IDA والتأكد من سريانها',
        'تطبيق مبدأ «الملوث يدفع» وفقاً لقانون إدارة المخلفات 202/2020',
        'توفير منطقة تجميع آمنة ومطابقة للمواصفات البيئية والصحية',
      ],
    },
    {
      icon: Truck,
      title: 'التزامات النقل (TRN)',
      points: [
        'مركبة مرخصة بتجهيزات أمان وGPS وملصقات تحذيرية حسب نوع الحمولة',
        'سائق بشهادة تدريب مواد خطرة والتزام بالمسار المحدد (Geofencing 200م)',
        'صور ميزان وحمولة إلزامية قبل وبعد • تفاوت الوزن المقبول < 5%',
        'الإبلاغ الفوري عن أي حادث أو انحراف عن المسار خلال 10 دقائق',
      ],
    },
    {
      icon: Recycle,
      title: 'التزامات التدوير (RCY)',
      points: [
        'ترخيص تدوير ساري وفحص جودة دوري لمنع التلوث الخلطي',
        'تأكيد الاستلام خلال 15 دقيقة وإصدار شهادة تدوير رقمية بـ QR',
        'سجل رقمي كامل لسلسلة الحيازة من المصدر حتى المنتج النهائي',
        'الامتثال لمعايير ISO 14001 في كافة عمليات المعالجة والتدوير',
      ],
    },
    {
      icon: Flame,
      title: 'التخلص الآمن (DSP)',
      points: [
        'الالتزام بمعايير التخلص وفقاً للقانون المصري واتفاقية بازل الدولية',
        'توثيق كامل بالصور والأوزان وإصدار شهادة تخلص آمن رقمية موثقة',
        'تطبيق إجراءات السلامة المهنية (OHS) وفقاً لمعايير ISO 45001',
        'الاحتفاظ بسجلات التخلص لمدة لا تقل عن 5 سنوات للمراجعة',
      ],
    },
    {
      icon: FileCheck,
      title: 'المستندات والتوقيعات الإلكترونية',
      points: [
        'بصمة رقمية SHA-256 وتوقيع إلكتروني مُلزم قانونياً (قانون 15/2004)',
        'أرشفة غير قابلة للتعديل (Immutable Audit Trail) لجميع العمليات',
        'تحقق بيومتري (AI Face Match) من هوية الموقعين عند التوقيع',
        'رمز QR فريد لكل مستند للتحقق الفوري من صحته وسلامته',
      ],
    },
    {
      icon: Shield,
      title: 'الامتثال والرقابة',
      points: [
        'مؤشر امتثال من 6 محاور • الحد الأدنى 70% لاستمرار التشغيل',
        'إشارة مرور للتراخيص: أخضر/أصفر (30 يوم)/أحمر (حظر تلقائي)',
        'تزييف GPS أو التلاعب بالأوزان = تعليق فوري + إبلاغ السلطات',
        'مراجعة دورية آلية للامتثال مع إشعارات استباقية قبل انتهاء التراخيص',
      ],
    },
    {
      icon: Leaf,
      title: 'الاستدامة البيئية',
      points: [
        'حساب البصمة الكربونية وفقاً لمعاملات IPCC 2006 وبروتوكول GHG',
        'تتبع مؤشرات الاقتصاد الدائري (MCI) وجواز المنتج الرقمي (DPP)',
        'تقارير ESG دورية ومؤشرات أداء بيئي لكل منشأة مسجلة',
      ],
    },
    {
      icon: Lock,
      title: 'أمن المعلومات والخصوصية',
      points: [
        'تشفير AES-256 لجميع البيانات وعزل RLS بناءً على الملكية والوظيفة',
        'تحقق هوية من 3 مراحل: OCR + بيومتري + توقيع إلكتروني',
        'حماية البيانات الشخصية وعدم مشاركتها مع أطراف ثالثة',
      ],
    },
    {
      icon: AlertTriangle,
      title: 'المخالفات والعقوبات',
      points: [
        '16 نوع مخالفة تشغيلية مصنفة حسب الخطورة (تحذير/إيقاف/حظر)',
        'التلاعب في البيانات أو المستندات يعرض المنشأة للحظر النهائي',
        'حق المنصة في الإبلاغ للجهات الرقابية عن أي مخالفة جسيمة',
      ],
    },
    {
      icon: Scale,
      title: 'الأحكام العامة والقانون الحاكم',
      points: [
        'تخضع هذه الاشتراطات للقانون المصري وتختص المحاكم المصرية بأي نزاع',
        'يحق للمنصة تعديل السياسات مع إخطار المستخدمين قبل 30 يوماً',
        'أي تعديل بعد الطباعة يُعد باطلاً ما لم يكن مختوماً رقمياً من المنصة',
      ],
    },
  ];

  return (
    <div
      className="bg-white text-foreground print:block print-a4-page"
      style={{
        direction: 'rtl',
        pageBreakBefore: 'always',
        fontSize: '7pt',
        lineHeight: '1.5',
        maxWidth: '210mm',
        width: '100%',
        minHeight: '297mm',
        boxSizing: 'border-box',
        padding: '8mm 10mm',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Cairo', sans-serif",
        overflow: 'hidden',
        wordBreak: 'break-word' as const,
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4" style={{ borderBottom: '3px double hsl(var(--primary))' }}>
        <div className="flex items-center gap-3">
          <Shield className="w-7 h-7 text-primary" />
          <div>
            <h2 className="font-bold leading-tight" style={{ fontSize: '13pt' }}>اشتراطات وسياسات وأحكام المنصة</h2>
            <p className="text-muted-foreground" style={{ fontSize: '7.5pt' }}>
              الإصدار {POLICY_VERSION} • منصة iRecycle لإدارة المخلفات والاستدامة البيئية
            </p>
          </div>
        </div>
        <QRCodeSVG
          value={`${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard/platform-terms?v=${POLICY_VERSION}`}
          size={75}
          level="H"
        />
      </div>

      {/* Preamble */}
      <div className="rounded px-3 py-2 mb-4" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '7.5pt', lineHeight: '1.6' }}>
        <p className="font-bold mb-1" style={{ fontSize: '8pt' }}>⚖️ الإطار القانوني والتنظيمي</p>
        تسري هذه الاشتراطات على جميع أطراف المنظومة (مولد، ناقل، مُدوِّر، جهة تخلص آمن) وفقاً لقانون تنظيم إدارة المخلفات 202/2020 
        ولائحته التنفيذية، وقانون البيئة 4/1994 المعدّل، واتفاقية بازل بشأن نقل النفايات الخطرة عبر الحدود، ومعايير ISO 14001 و45001.
        يُعد قبول هذه الشروط شرطاً أساسياً لاستخدام المنصة وإجراء أي عملية عبرها.
      </div>

      {/* Sections Grid — fills the page */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4 flex-1">
        {sections.map((section, idx) => {
          const Icon = section.icon;
          return (
            <div key={idx} className="break-inside-avoid">
              <div className="flex items-center gap-2 mb-1.5" style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '3px' }}>
                <Icon className="w-4 h-4 text-primary shrink-0" />
                <span className="font-bold" style={{ fontSize: '8.5pt' }}>{idx + 1}. {section.title}</span>
              </div>
              <ul className="mr-5 space-y-1">
                {section.points.map((point, pIdx) => (
                  <li key={pIdx} className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0 mt-[2px]" />
                    <span style={{ fontSize: '7pt', lineHeight: '1.55' }}>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Footer with seal */}
      <div className="pt-3 mt-4" style={{ borderTop: '3px double hsl(var(--primary))' }}>
        <div className="flex items-center justify-between">
          {/* Legal text */}
          <div className="flex-1 text-muted-foreground space-y-1" style={{ fontSize: '6.5pt' }}>
            <p className="flex items-center gap-1">
              <Gavel className="w-3 h-3 shrink-0" />
              <strong>إقرار:</strong> بتوقيع هذا المستند أو استخدام المنصة يُقر الطرف بالموافقة الكاملة على جميع الاشتراطات والسياسات المذكورة أعلاه.
            </p>
            <p>• التوقيعات الإلكترونية مُلزمة قانونياً وفقاً لقانون التوقيع الإلكتروني رقم 15 لسنة 2004 ولائحته التنفيذية.</p>
            <p>• جميع المستندات الصادرة من المنصة محمية ببصمة رقمية SHA-256 ويمكن التحقق منها عبر رمز QR.</p>
            <p className="flex items-center gap-1">
              <Lock className="w-2.5 h-2.5 shrink-0" />
              أي تعديل يدوي بعد الطباعة يُعد باطلاً ولاغياً ما لم يكن مصدّقاً رقمياً من المنصة.
            </p>
          </div>

          {/* Platform seal */}
          <div className="mx-6 text-center">
            <div className="border border-dashed border-primary/40 rounded-full flex items-center justify-center bg-primary/5"
              style={{ width: '75px', height: '75px' }}>
              <div className="text-center">
                <PlatformLogo size="xs" className="justify-center mb-1" />
                <span className="text-primary block" style={{ fontSize: '5pt' }}>مختوم رقمياً</span>
              </div>
            </div>
          </div>

          {/* QR verification */}
          <div className="text-center">
            <QRCodeSVG
              value={`${typeof window !== 'undefined' ? window.location.origin : ''}/qr-verify?type=platform-terms&version=${POLICY_VERSION}`}
              size={75}
              level="H"
            />
            <p className="text-muted-foreground mt-1" style={{ fontSize: '7pt' }}>امسح للتحقق من صحة الوثيقة</p>
          </div>
        </div>

        <div className="text-center mt-3 text-muted-foreground" style={{ fontSize: '6pt' }}>
          جميع الحقوق محفوظة © {new Date().getFullYear()} iRecycle • الإصدار {POLICY_VERSION} • وثيقة محمية بتقنية SHA-256 • النسخة الكاملة متاحة عبر مسح رمز QR
        </div>
      </div>
    </div>
  );
};

export default TermsBackPage;
