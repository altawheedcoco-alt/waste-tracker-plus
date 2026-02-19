import { Shield, CheckCircle2, Lock, Leaf, Truck, Recycle, Building2, Flame, FileCheck, Gavel, BadgeCheck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const POLICY_VERSION = '2.0.0';

/**
 * Compact terms & policies back-page for single-page documents.
 * Add this component AFTER the main print content so it prints on the back (page 2).
 * Uses @media print page-break-before to force a new page.
 */
const TermsBackPage = () => {
  const sections = [
    {
      icon: Building2,
      title: 'التزامات المولد (GEN)',
      points: [
        'الإفصاح الدقيق عن نوع وكمية المخلفات وفصل الخطرة عن غير الخطرة',
        'الحصول على التراخيص اللازمة من WMRA/EEAA/IDA',
        'تطبيق مبدأ «الملوث يدفع» وفقاً للقانون 202/2020',
      ],
    },
    {
      icon: Truck,
      title: 'التزامات النقل (TRN)',
      points: [
        'مركبة مرخصة بتجهيزات أمان وGPS وملصقات تحذيرية',
        'سائق بشهادة تدريب مواد خطرة والتزام بالمسار (Geofencing 200م)',
        'صور ميزان وحمولة إلزامية • تفاوت الوزن < 5%',
      ],
    },
    {
      icon: Recycle,
      title: 'التزامات التدوير (RCY)',
      points: [
        'ترخيص تدوير ساري وفحص جودة لمنع التلوث الخلطي',
        'تأكيد الاستلام خلال 15 دقيقة وإصدار شهادة تدوير رقمية بـ QR',
        'سجل رقمي كامل لسلسلة الحيازة من المصدر للمنتج النهائي',
      ],
    },
    {
      icon: Flame,
      title: 'التخلص الآمن (DSP)',
      points: [
        'الالتزام بمعايير التخلص وفقاً للقانون المصري واتفاقية بازل',
        'توثيق كامل بالصور والأوزان وشهادة تخلص آمن رقمية',
        'تطبيق إجراءات السلامة المهنية (OHS) وفقاً للمعايير الدولية',
      ],
    },
    {
      icon: FileCheck,
      title: 'المستندات والتوقيعات',
      points: [
        'بصمة رقمية SHA-256 وتوقيع إلكتروني ملزم قانونياً (قانون 15/2004)',
        'أرشفة غير قابلة للتعديل (Immutable Audit Trail)',
        'تحقق بيومتري (AI Face Match) من هوية الموقعين',
      ],
    },
    {
      icon: Shield,
      title: 'الامتثال والعقوبات',
      points: [
        'مؤشر امتثال من 6 محاور • الحد الأدنى 70% لاستمرار التشغيل',
        'إشارة مرور للتراخيص: أخضر/أصفر (30 يوم)/أحمر (حظر تلقائي)',
        'تزييف GPS أو التلاعب بالأوزان = تعليق فوري + إبلاغ السلطات',
      ],
    },
    {
      icon: Leaf,
      title: 'الاستدامة البيئية',
      points: [
        'حساب البصمة الكربونية وفقاً لـ IPCC 2006 وبروتوكول GHG',
        'تتبع مؤشرات الاقتصاد الدائري (MCI) وجواز المنتج الرقمي (DPP)',
      ],
    },
    {
      icon: Lock,
      title: 'أمن المعلومات',
      points: [
        'تشفير AES-256 وعزل بيانات RLS بناءً على الملكية والوظيفة',
        'تحقق هوية من 3 مراحل: OCR + بيومتري + توقيع',
      ],
    },
  ];

  return (
    <div
      className="bg-white text-foreground print:block"
      style={{ direction: 'rtl', pageBreakBefore: 'always', fontSize: '6.5pt', lineHeight: '1.4' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-double pb-2 mb-3 px-1">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <div>
            <h2 className="text-[10pt] font-bold leading-tight">اشتراطات وسياسات وأحكام المنصة</h2>
            <p className="text-[6pt] text-muted-foreground">الإصدار {POLICY_VERSION} • منصة iRecycle لإدارة المخلفات والاستدامة البيئية</p>
          </div>
        </div>
        <QRCodeSVG
          value={`${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard/platform-terms?v=${POLICY_VERSION}`}
          size={40}
          level="M"
        />
      </div>

      {/* Preamble */}
      <div className="bg-gray-50 border border-gray-200 rounded px-2 py-1.5 mb-3 text-[6pt] leading-relaxed">
        تسري هذه الاشتراطات على جميع أطراف المنظومة وفقاً لقانون إدارة المخلفات 202/2020 وقانون البيئة 4/1994 واتفاقية بازل ومعايير ISO 14001 و45001.
        يُعد قبول هذه الشروط شرطاً أساسياً لاستخدام المنصة. النسخة الكاملة متاحة عبر مسح QR Code.
      </div>

      {/* Compact Sections Grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
        {sections.map((section, idx) => {
          const Icon = section.icon;
          return (
            <div key={idx} className="break-inside-avoid">
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className="w-3 h-3 text-primary shrink-0" />
                <span className="font-bold text-[7pt]">{section.title}</span>
              </div>
              <ul className="mr-4 space-y-0.5">
                {section.points.map((point, pIdx) => (
                  <li key={pIdx} className="flex items-start gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 shrink-0 mt-[1px]" />
                    <span className="text-[6pt] leading-[1.35]">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Footer with seal */}
      <div className="mt-4 pt-2 border-t-2 border-double">
        <div className="flex items-center justify-between">
          {/* Left: Legal text */}
          <div className="flex-1 text-[5.5pt] text-muted-foreground space-y-0.5">
            <p>• التوقيعات الإلكترونية مُلزمة قانونياً وفقاً لقانون التوقيع الإلكتروني رقم 15 لسنة 2004</p>
            <p>• يحق للمنصة تعديل هذه السياسات مع إخطار المستخدمين قبل 30 يوماً</p>
            <p>• تخضع هذه الاشتراطات للقانون المصري وتختص المحاكم المصرية بالفصل في أي نزاع</p>
            <p className="flex items-center gap-1">
              <Lock className="w-2 h-2" />
              أي تعديل بعد الطباعة يُعد باطلاً ما لم يكن مختوماً رقمياً من المنصة
            </p>
          </div>

          {/* Center: Platform seal */}
          <div className="mx-4 text-center">
            <div className="w-16 h-16 border border-dashed border-primary/40 rounded-full flex items-center justify-center bg-primary/5">
              <div className="text-center">
                <BadgeCheck className="w-5 h-5 text-primary mx-auto" />
                <span className="text-[5pt] text-primary font-bold block">iRecycle</span>
              </div>
            </div>
          </div>

          {/* Right: QR verification */}
          <div className="text-center">
            <QRCodeSVG
              value={`${typeof window !== 'undefined' ? window.location.origin : ''}/qr-verify?type=platform-terms&version=${POLICY_VERSION}`}
              size={45}
              level="H"
            />
            <p className="text-[5pt] text-muted-foreground mt-0.5">امسح للتحقق</p>
          </div>
        </div>

        <div className="text-center mt-2 text-[5pt] text-muted-foreground">
          جميع الحقوق محفوظة © {new Date().getFullYear()} iRecycle • الإصدار {POLICY_VERSION} • محمية بتقنية SHA-256
        </div>
      </div>
    </div>
  );
};

export default TermsBackPage;
