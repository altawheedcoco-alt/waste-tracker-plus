import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Shield, Truck, Recycle, Factory, Scale, Lock, Users, FileCheck, Leaf, Gavel,
  CheckCircle2, BookOpen, Building2, Flame, BadgeCheck, ArrowRight, ChevronDown,
  ChevronUp, Eye, UserCheck, FileText, Camera, MapPin, AlertTriangle, Printer
} from 'lucide-react';
import PageNavBar from '@/components/ui/page-nav-bar';
import Header from '@/components/Header';
import { lazy, Suspense } from 'react';

const Footer = lazy(() => import('@/components/Footer'));
const UsageAgreementSection = lazy(() => import('@/components/legal/UsageAgreementAcceptance'));

interface PolicyArticle {
  number: string;
  title: string;
  content: string[];
}

interface PolicySection {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  articles: PolicyArticle[];
}

const policySections: PolicySection[] = [
  {
    id: 'general',
    title: 'الأحكام العامة والتعريفات',
    icon: BookOpen,
    color: 'text-primary',
    bgColor: 'bg-primary/5',
    articles: [
      {
        number: '1',
        title: 'نطاق التطبيق',
        content: [
          'تسري هذه الاشتراطات والسياسات على جميع الأطراف المستخدمة لمنصة iRecycle بما فيهم: الجهات المولدة للمخلفات (GEN)، شركات النقل (TRN)، مصانع التدوير (RCY)، جهات التخلص الآمن (DSP)، الاستشاريون البيئيون (CNS)، المكاتب الاستشارية (COF)، والجهات المانحة للأيزو (ISO).',
          'يُعد قبول هذه الشروط شرطاً أساسياً لاستخدام المنصة وإجراء أي عمليات عليها.',
          'تخضع هذه السياسات للقوانين المصرية ذات الصلة بما فيها قانون تنظيم إدارة المخلفات رقم 202 لسنة 2020 وقانون البيئة رقم 4 لسنة 1994 وتعديلاته.',
        ],
      },
      {
        number: '2',
        title: 'التعريفات',
        content: [
          '«المنصة»: منظومة iRecycle الرقمية لإدارة المخلفات والنقل والتدوير.',
          '«الشحنة»: أي عملية نقل مخلفات مُسجلة على المنصة من نقطة المصدر إلى نقطة المعالجة أو التخلص.',
          '«سلسلة الحيازة»: التسلسل الموثق رقمياً لانتقال المخلفات عبر الأطراف المختلفة باستخدام أكواد QR.',
          '«البصمة الرقمية»: توقيع SHA-256 يضمن عدم التلاعب بالمستندات بعد إصدارها.',
          '«مؤشر الامتثال»: نسبة مئوية محسوبة آلياً من 6 محاور رقابية لتقييم التزام كل عملية.',
        ],
      },
    ],
  },
  {
    id: 'generator',
    title: 'اشتراطات الجهة المولدة (GEN)',
    icon: Building2,
    color: 'text-primary',
    bgColor: 'bg-primary/5',
    articles: [
      {
        number: '3',
        title: 'التزامات المولد',
        content: [
          'الإفصاح الدقيق عن نوع وكمية المخلفات وفقاً لنظام التصنيف القياسي المعتمد على المنصة (يشمل 21+ تصنيفاً رئيسياً).',
          'ضمان فصل المخلفات الخطرة عن غير الخطرة وفقاً لاتفاقية بازل والقوانين المصرية.',
          'توفير بيانات دقيقة عن موقع التحميل (GPS) وعدم التلاعب بالإحداثيات الجغرافية.',
          'الحصول على التراخيص اللازمة من WMRA أو EEAA أو IDA حسب نوع النشاط وتحميلها على المنصة.',
          'الالتزام بسداد المستحقات المالية في المواعيد المحددة وفقاً لخطابات الترسية والعقود المبرمة.',
        ],
      },
      {
        number: '4',
        title: 'إقرار المولد',
        content: [
          'يلتزم المولد بإصدار إقرار رقمي عند كل شحنة يتضمن: نوع المخلف، الكمية المقدرة، درجة الخطورة.',
          'يُعد الإقرار مستنداً قانونياً ملزماً ولا يجوز تعديله بعد التوقيع الرقمي إلا بموافقة إدارية موثقة.',
          'يتم تطبيق مبدأ «الملوث يدفع» (Polluter Pays Principle) وفقاً للمادة 30 من قانون 202/2020.',
        ],
      },
    ],
  },
  {
    id: 'transporter',
    title: 'اشتراطات شركات النقل (TRN)',
    icon: Truck,
    color: 'text-primary',
    bgColor: 'bg-accent',
    articles: [
      {
        number: '5',
        title: 'متطلبات المركبات',
        content: [
          'يجب أن تحمل كل مركبة رخصة تداول مواد خطرة سارية (إن كانت تنقل مخلفات خطرة).',
          'تجهيز المركبة بملصقات تحذيرية وفقاً لنظام GHS ولوائح ADR للنقل.',
          'وجود تجهيزات أمان إلزامية: طفاية حريق، حقيبة إسعافات أولية، أدوات احتواء الانسكاب.',
          'تركيب جهاز تتبع GPS فعال ومتصل بمنظومة المنصة لحظياً.',
          'يُحظر تشغيل مركبة لا تستوفي شروط الامتثال الكامل.',
        ],
      },
      {
        number: '6',
        title: 'التزامات السائق',
        content: [
          'حيازة رخصة قيادة مهنية سارية وشهادة تدريب تداول مواد خطرة.',
          'تقديم صحيفة جنائية حديثة واجتياز فحص التحقق البيومتري (Face Match).',
          'الالتزام بالمسار المحدد عبر GPS وعدم الانحراف عن النطاق الجغرافي (Geofencing: 200م).',
          'تسجيل صور الميزان والحمولة عند كل نقطة تسليم واستلام.',
          'الإبلاغ الفوري عن أي حادث انسكاب أو طوارئ مع تحديد الموقع والصور.',
        ],
      },
      {
        number: '7',
        title: 'التوثيق المرئي الإلزامي',
        content: [
          'لا يتم اعتماد أي عملية نهائياً إلا بعد رفع صورة تذكرة ميزان البسكول.',
          'يجب التحقق من البيانات الوصفية للصور (الموقع الجغرافي والطابع الزمني).',
          'يتم التحقق المزدوج من الوزن: يجب ألا تتجاوز نسبة التفاوت بين وزن التحميل والتفريغ 5%.',
          'رفع إثبات الدفع (صورة أو إيصال) شرط لترحيل القيد لدفتر الأستاذ.',
        ],
      },
    ],
  },
  {
    id: 'recycler',
    title: 'اشتراطات جهة التدوير (RCY)',
    icon: Recycle,
    color: 'text-primary',
    bgColor: 'bg-primary/5',
    articles: [
      {
        number: '8',
        title: 'متطلبات التشغيل',
        content: [
          'الحصول على ترخيص تدوير ساري من الجهات المختصة وتحميله على المنصة.',
          'الإفصاح عن القدرة الاستيعابية للمصنع وأنواع المخلفات المقبولة.',
          'تطبيق فحص الجودة ومنع التلوث الخلطي (مثل منع تدوير بلاستيك الزيوت للصناعات الغذائية).',
          'إصدار شهادة تدوير رقمية لكل دفعة مكتملة تتضمن QR Code للتحقق.',
          'الاحتفاظ بسجل رقمي كامل لسلسلة الحيازة من المصدر حتى المنتج النهائي.',
        ],
      },
      {
        number: '9',
        title: 'إقرار الاستلام والتأكيد',
        content: [
          'يلتزم المدوّر بتأكيد استلام الشحنة خلال المهلة الزمنية المحددة (15 دقيقة للموافقة التلقائية).',
          'يتم إصدار إقرار استلام رقمي موقع يُعد جزءاً من سلسلة المستندات القانونية للشحنة.',
          'أي رفض للشحنة يجب أن يكون مسبباً وموثقاً مع إخطار فوري لجميع الأطراف.',
        ],
      },
    ],
  },
  {
    id: 'disposal',
    title: 'اشتراطات التخلص الآمن (DSP)',
    icon: Flame,
    color: 'text-destructive',
    bgColor: 'bg-destructive/5',
    articles: [
      {
        number: '10',
        title: 'بروتوكولات التخلص',
        content: [
          'الالتزام بمعايير التخلص الآمن وفقاً للقانون المصري واتفاقية بازل.',
          'توثيق عملية التخلص بالكامل: صور، أوزان، شهادات، وتقارير بيئية.',
          'إصدار شهادة تخلص آمن رقمية لكل عملية مع بصمة SHA-256.',
          'عدم قبول مخلفات لا تتوافق مع التراخيص الممنوحة للمنشأة.',
          'تطبيق إجراءات السلامة والصحة المهنية (OHS) وفقاً للمعايير المصرية والدولية.',
        ],
      },
    ],
  },
  {
    id: 'consultant',
    title: 'اشتراطات الاستشاريين والمكاتب (CNS/COF)',
    icon: BadgeCheck,
    color: 'text-primary',
    bgColor: 'bg-secondary',
    articles: [
      {
        number: '11',
        title: 'شروط التسجيل كاستشاري بيئي',
        content: [
          'يجب أن يكون المستشار حاصلاً على مؤهل علمي ذي صلة (بيئة، كيمياء، هندسة) وخبرة لا تقل عن 3 سنوات.',
          'تقديم السيرة الذاتية والشهادات المهنية وصور الهوية للتحقق عبر نظام AI OCR.',
          'خضوع الاستشاري للتحقق البيومتري (Face Match) والتوقيع الإلكتروني.',
          'يلتزم المكتب الاستشاري بتقديم السجل التجاري والبطاقة الضريبية وشهادة التأسيس.',
        ],
      },
      {
        number: '12',
        title: 'التزامات الاستشاري',
        content: [
          'تقديم خدمات استشارية تتوافق مع القوانين المصرية والمعايير الدولية (ISO 14001, 45001).',
          'الالتزام بالحياد المهني وعدم تضارب المصالح.',
          'إعداد تقارير التدقيق والمراجعة بشفافية ودقة مع توثيق الأدلة المادية.',
          'الإبلاغ عن أي مخالفات بيئية يتم رصدها أثناء عمليات التدقيق.',
        ],
      },
    ],
  },
  {
    id: 'documents',
    title: 'نظام المستندات والتوقيعات',
    icon: FileCheck,
    color: 'text-primary',
    bgColor: 'bg-muted',
    articles: [
      {
        number: '13',
        title: 'دورة حياة المستندات',
        content: [
          'تتبع كل شحنة دورة مستندية متكاملة تشمل 7 مستندات أساسية (من المولد للناقل للمدور).',
          'كل مستند يحمل بصمة رقمية SHA-256 وتوقيع إلكتروني وختم المنصة.',
          'لا يجوز تعديل أي مستند بعد التوقيع إلا عبر آلية التجاوز اليدوي مع توثيق السبب.',
          'يتم أرشفة جميع المستندات في سجل غير قابل للتعديل (Immutable Audit Trail).',
          'تعتمد المنصة نظام الصفحتين: الصفحة الأولى للمستند الأساسي والثانية لاشتراطات وسياسات المنصة.',
        ],
      },
      {
        number: '14',
        title: 'التحقق والمصادقة',
        content: [
          'كل مستند قابل للتحقق عبر مسح QR Code المرفق به أو عبر صفحة التحقق على المنصة.',
          'يتم التحقق من هوية الموقعين عبر نظام التحقق البيومتري (AI Face Match).',
          'التوقيعات الإلكترونية مُلزمة قانونياً وفقاً لقانون التوقيع الإلكتروني المصري رقم 15 لسنة 2004.',
          'يحق لمسؤولي وزارة البيئة (Regulator) الاطلاع الكامل على جميع المستندات والسجلات.',
          'تُؤمن المستندات بعلامات مائية، رموز QR، باركود، وبصمة SHA-256.',
        ],
      },
    ],
  },
  {
    id: 'identity',
    title: 'التحقق من الهوية والتسجيل',
    icon: UserCheck,
    color: 'text-primary',
    bgColor: 'bg-accent',
    articles: [
      {
        number: '15',
        title: 'نظام التحقق الذكي من الهوية',
        content: [
          'يخضع جميع المستخدمين لعملية تحقق من 3 مراحل إلزامية:',
          'المرحلة الأولى - التحقق من الهوية: استخراج البيانات آلياً من البطاقة الشخصية أو جواز السفر عبر AI OCR مع تقنيات تحسين الصور.',
          'المرحلة الثانية - المطابقة البيومترية: مقارنة صورة سيلفي حية مع صورة الهوية لضمان تطابق المستخدم (Biometric Face Match).',
          'المرحلة الثالثة - مراجعة الشروط والتوقيع: التوقيع الإلكتروني أو رفع توقيع ورقي مع قبول الشروط والأحكام.',
          'يدعم النظام الوكالة والتفويض للأطراف المتعددة مع رفع المستندات القانونية المطلوبة.',
        ],
      },
      {
        number: '16',
        title: 'المستندات القانونية المطلوبة',
        content: [
          'للأفراد: بطاقة الرقم القومي أو جواز السفر ساري المفعول.',
          'للمنشآت: البطاقة الضريبية، السجل التجاري، عقد التأسيس.',
          'للسائقين: رخصة القيادة المهنية، شهادة تداول مواد خطرة، صحيفة الحالة الجنائية.',
          'يتم تجميع كافة الوثائق في ملف PDF موحد يُحفظ في سجلات المنصة.',
          'الطلبات بدرجة تحقق ≥80% تُقبل تلقائياً، والباقي يُحال للمراجعة اليدوية من المدير.',
        ],
      },
    ],
  },
  {
    id: 'compliance',
    title: 'الامتثال والرقابة',
    icon: Shield,
    color: 'text-primary',
    bgColor: 'bg-primary/5',
    articles: [
      {
        number: '17',
        title: 'مؤشر الامتثال',
        content: [
          'يتم حساب مؤشر الامتثال آلياً من 6 محاور: التراخيص، سلسلة المستندات، مسار النقل بـ GPS، التدقيق المرئي، التحقق المزدوج من الوزن (تفاوت < 5%)، والالتزام بمراحل خط الأنابيب.',
          'يجب ألا يقل مؤشر الامتثال عن 70% لاستمرار التشغيل. أقل من ذلك يتم تعليق العمليات مؤقتاً.',
          'يتم إصدار شهادة امتثال iRecycle مُصنفة: ذهبية (≥90%)، فضية (≥80%)، برونزية (≥70%).',
        ],
      },
      {
        number: '18',
        title: 'نظام التراخيص وإشارة المرور',
        content: [
          'تطبيق نظام إشارة المرور: أخضر (ساري)، أصفر (تنبيه قبل 30 يوماً)، أحمر (حظر تلقائي قبل 7 أيام).',
          'يتم حظر إصدار أي مستندات رسمية للمنظمات غير الممتثلة تلقائياً.',
          'يُحظر إنشاء رحلات جديدة إذا كانت المركبة أو السائق غير ممتثلين.',
          'يتم مراقبة تراخيص WMRA و EEAA و IDA آلياً مع إنذارات ذكية قبل الانتهاء.',
        ],
      },
      {
        number: '19',
        title: 'المخالفات والعقوبات',
        content: [
          'تزييف الموقع الجغرافي (Fake GPS): تعليق فوري للحساب + إخطار الجهات المختصة.',
          'التلاعب بالأوزان المسجلة: غرامة مالية + تجميد العمليات لحين التحقيق.',
          'عدم الالتزام بمسار النقل المحدد: تنبيه أول، ثم تعليق ثم إلغاء الترخيص.',
          'تقديم مستندات أو تراخيص منتهية أو مزورة: إلغاء فوري للحساب وإبلاغ السلطات.',
          'يتم تطبيق 16 مخالفة تشغيلية محددة وفقاً لإطار عمل المخالفات المعتمد مع جدول جزاءات مخصص لقطاع المخلفات.',
        ],
      },
    ],
  },
  {
    id: 'regulator',
    title: 'الرقابة الحكومية',
    icon: Eye,
    color: 'text-primary',
    bgColor: 'bg-secondary',
    articles: [
      {
        number: '20',
        title: 'منظومة الرقابة متعددة المستويات',
        content: [
          'تدعم المنصة منظومة رقابة حكومية شاملة تشمل: وزارة البيئة، جهاز WMRA، جهاز شئون البيئة EEAA، والمحافظات.',
          'لوحة تحكم رقابية (Regulator Dashboard) لمراقبة المواقع لحظياً وتحليل نسب الامتثال.',
          'سجل الشركات المُنظمة لمتابعة التراخيص وتنبيهات الانتهاء.',
          'نظام التفتيش الميداني الرقمي لجدولة وتسجيل الزيارات وتوثيق الصور وحساب درجات الامتثال.',
          'نظام إنفاذ القانون لإصدار المخالفات بمرجعيات قانونية وأرقام تسلسلية آلية (VIO-...).',
        ],
      },
      {
        number: '21',
        title: 'صلاحيات الوصول الرقابي',
        content: [
          'صلاحيات وصول هرمية تضمن رؤية البيانات حسب النطاق الجغرافي للمسؤول.',
          'يحق للجهات الرقابية الاطلاع الكامل على سجلات التتبع والمستندات والتقارير.',
          'يتم توقيع الجزاءات (غرامات مالية أو تعليق تراخيص) إلكترونياً عبر المنصة.',
        ],
      },
    ],
  },
  {
    id: 'contracts',
    title: 'العقود والاتفاقيات',
    icon: FileText,
    color: 'text-primary',
    bgColor: 'bg-accent',
    articles: [
      {
        number: '22',
        title: 'نظام التعاقد الذكي',
        content: [
          'يتبع نظام التعاقد بنية نمطية (Modular) تتوافق مع القوانين المصرية (202/2020، 151/2020، وقانون العمل الجديد 2025).',
          'تخصيص قوالب العقود حسب نوع العلاقة التعاقدية (نقل، تدوير، تخلص، استشارات).',
          'يدمج إطار عمل للمخالفات (16 مخالفة) وجدول جزاءات نمطي مخصص لقطاع المخلفات.',
          'بنود مشتركة إلزامية: سرية المعلومات، بصمة رقمية SHA-256، والإقرار الرقمي كشرط لتفعيل الحساب.',
          'ربط آلي بمحرك الامتثال وتراخيص المنظمة عند إصدار أو تعديل العقود.',
        ],
      },
    ],
  },
  {
    id: 'environment',
    title: 'الاستدامة البيئية',
    icon: Leaf,
    color: 'text-primary',
    bgColor: 'bg-primary/5',
    articles: [
      {
        number: '23',
        title: 'البصمة الكربونية',
        content: [
          'يتم حساب البصمة الكربونية لكل شحنة وفقاً لمعايير IPCC 2006 وبروتوكول GHG.',
          'تشمل الحسابات: انبعاثات النقل (لكل كم/طن)، انبعاثات المعالجة، والوفورات من إعادة التدوير.',
          'يلتزم كل طرف بالعمل على تقليل بصمته الكربونية ومتابعة مؤشرات الاستدامة.',
        ],
      },
      {
        number: '24',
        title: 'الاقتصاد الدائري',
        content: [
          'يتم تتبع مؤشرات الاقتصاد الدائري (MCI) وجواز المنتج الرقمي (DPP) لكل عملية تدوير.',
          'تُصدر تقارير ESG دورية لمتابعة الأداء البيئي والاجتماعي وحوكمة الشركات.',
          'يحق للمنصة نشر البيانات البيئية المجمعة (بدون بيانات حساسة) لأغراض البحث والشفافية.',
        ],
      },
    ],
  },
  {
    id: 'security',
    title: 'أمن المعلومات والخصوصية',
    icon: Lock,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    articles: [
      {
        number: '25',
        title: 'حماية البيانات',
        content: [
          'جميع البيانات مشفرة أثناء النقل والتخزين وفقاً لمعايير AES-256.',
          'تطبيق عزل صارم للبيانات (Row-Level Security) بناءً على الملكية والوظيفة والارتباط.',
          'لا تُشارك البيانات الحساسة (تفاصيل السائقين، الأسعار) إلا بتفعيل يدوي من صاحب البيانات.',
          'يحق لكل مستخدم طلب تصدير أو حذف بياناته وفقاً لسياسة حماية البيانات الشخصية.',
        ],
      },
      {
        number: '26',
        title: 'سجل المراجعة (Audit Trail)',
        content: [
          'يتم تسجيل جميع العمليات والتعديلات في سجل مراجعة غير قابل للتعديل.',
          'يشمل السجل: هوية المستخدم، نوع العملية، الطابع الزمني، عنوان IP، والتغييرات المحددة.',
          'يتم الاحتفاظ بالسجلات لمدة لا تقل عن 5 سنوات وفقاً لمتطلبات قانون 202/2020.',
          'لا يمكن لأي مستخدم حذف أو تعديل سجلات المراجعة بما فيهم مسؤولي النظام.',
        ],
      },
    ],
  },
  {
    id: 'omaluna',
    title: 'سياسات منصة عُمالنا للتوظيف',
    icon: Users,
    color: 'text-primary',
    bgColor: 'bg-secondary',
    articles: [
      {
        number: '27',
        title: 'شروط استخدام منصة التوظيف',
        content: [
          'تخضع منصة عُمالنا لقانون العمل المصري الجديد 2025 والقوانين ذات الصلة.',
          'يلتزم صاحب العمل بالإفصاح الكامل عن تفاصيل الوظيفة: المسمى، المهام، الراتب، والموقع.',
          'يلتزم الباحث عن عمل بتقديم بيانات صحيحة ودقيقة في ملفه الشخصي.',
          'يُحظر نشر وظائف وهمية أو مضللة، ويتم تعليق الحساب فوراً في حال المخالفة.',
          'تحتفظ المنصة بحق مراجعة واعتماد أو رفض أي إعلان وظيفي قبل نشره.',
        ],
      },
    ],
  },
  {
    id: 'ads',
    title: 'سياسات الإعلانات المدفوعة',
    icon: AlertTriangle,
    color: 'text-destructive',
    bgColor: 'bg-destructive/5',
    articles: [
      {
        number: '28',
        title: 'شروط نشر الإعلانات',
        content: [
          'تخضع جميع الإعلانات للمراجعة والموافقة من إدارة المنصة قبل النشر.',
          'يُحظر نشر إعلانات مخالفة للقوانين المصرية أو تتعلق بأنشطة غير مرخصة.',
          'يلتزم المعلن بدفع رسوم الإعلان مسبقاً وفقاً للباقة المختارة.',
          'يحق للمنصة إزالة أي إعلان دون إنذار مسبق إذا تبين مخالفته للسياسات.',
          'لا تتحمل المنصة مسؤولية محتوى الإعلانات ولا تضمن نتائج محددة للمعلنين.',
        ],
      },
    ],
  },
  {
    id: 'final',
    title: 'أحكام ختامية',
    icon: Gavel,
    color: 'text-foreground',
    bgColor: 'bg-muted',
    articles: [
      {
        number: '29',
        title: 'التعديل والتحديث',
        content: [
          'يحق للمنصة تعديل هذه الاشتراطات والسياسات في أي وقت مع إخطار المستخدمين قبل 30 يوماً.',
          'يُعد استمرار استخدام المنصة بعد سريان التعديلات موافقة ضمنية عليها.',
          'في حال التعارض بين هذه السياسات والقوانين المصرية، تُقدم القوانين المصرية.',
        ],
      },
      {
        number: '30',
        title: 'القانون الواجب التطبيق',
        content: [
          'تخضع هذه الاشتراطات للقانون المصري وتختص المحاكم المصرية بالفصل في أي نزاع.',
          'يُرجع في تفسير هذه الشروط إلى قانون إدارة المخلفات 202/2020 وقانون البيئة 4/1994.',
          'تُعد النسخة العربية هي المرجع الأساسي في حال وجود أي اختلاف في الترجمة.',
        ],
      },
      {
        number: '31',
        title: 'الرؤية الوطنية',
        content: [
          'منصة iRecycle هي مبادرة وطنية خدمية عامة لجمهورية مصر العربية تهدف لدعم وزارة البيئة وجهاز WMRA لتحقيق رؤية مصر 2030.',
          'تسعى المنصة لأن تكون الركيزة الرقمية الأولى لمنظومة إدارة المخلفات في مصر.',
          'تلتزم المنصة بمبادئ الخدمة العامة الحيادية والابتكار الرقمي والمسؤولية البيئية كواجب وطني.',
        ],
      },
    ],
  },
];

const POLICY_VERSION = '3.0.0';
const EFFECTIVE_DATE = '2025-01-01';

const Policies = () => {
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['general']));

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpandedSections(new Set(policySections.map(s => s.id)));
  const collapseAll = () => setExpandedSections(new Set());

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <PageNavBar className="mb-4" />
        </div>
        {/* Hero */}
        <div className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background py-16">
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'repeating-linear-gradient(45deg, hsl(var(--primary)) 0, hsl(var(--primary)) 1px, transparent 0, transparent 50%)',
            backgroundSize: '20px 20px',
          }} />
          <div className="container mx-auto px-4 relative">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 text-primary text-sm font-bold mb-6 border border-primary/20">
                <Shield className="w-4 h-4" />
                الإصدار {POLICY_VERSION} — ساري من {EFFECTIVE_DATE}
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground mb-4 leading-tight">
                اشتراطات وسياسات المنصة
              </h1>
              <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-2xl mx-auto mb-8">
                الإطار القانوني والتنظيمي الشامل لمنصة iRecycle — يتضمن {policySections.reduce((sum, s) => sum + s.articles.length, 0)} مادة تنظيمية تحكم جميع العمليات والأطراف
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Button variant="outline" size="sm" onClick={expandAll} className="gap-2">
                  <ChevronDown className="w-4 h-4" />
                  عرض الكل
                </Button>
                <Button variant="outline" size="sm" onClick={collapseAll} className="gap-2">
                  <ChevronUp className="w-4 h-4" />
                  طي الكل
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Table of Contents */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-card border border-border rounded-2xl p-6 mb-10">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                فهرس السياسات
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {policySections.map((section, i) => (
                  <button
                    key={section.id}
                    onClick={() => {
                      setExpandedSections(prev => new Set(prev).add(section.id));
                      document.getElementById(`section-${section.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-accent/60 transition-colors text-start group"
                  >
                    <div className={`w-8 h-8 rounded-lg ${section.bgColor} flex items-center justify-center flex-shrink-0`}>
                      <section.icon className={`w-4 h-4 ${section.color}`} />
                    </div>
                    <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{section.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sections */}
            <div className="space-y-4">
              {policySections.map((section) => {
                const isExpanded = expandedSections.has(section.id);
                return (
                  <div
                    key={section.id}
                    id={`section-${section.id}`}
                    className="bg-card border border-border rounded-2xl overflow-hidden scroll-mt-24 transition-shadow hover:shadow-md"
                  >
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="w-full flex items-center gap-3 p-5 text-start hover:bg-accent/30 transition-colors"
                    >
                      <div className={`w-11 h-11 rounded-xl ${section.bgColor} flex items-center justify-center flex-shrink-0`}>
                        <section.icon className={`w-5 h-5 ${section.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-foreground text-base">{section.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{section.articles.length} مادة</p>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="px-5 pb-5 space-y-5 animate-fade-in">
                        {section.articles.map((article) => (
                          <div key={article.number} className={`rounded-xl ${section.bgColor} p-5`}>
                            <h4 className="font-bold text-foreground mb-3 flex items-center gap-2">
                              <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg bg-background text-xs font-bold ${section.color}`}>
                                {article.number}
                              </span>
                              المادة {article.number}: {article.title}
                            </h4>
                            <ul className="space-y-2.5">
                              {article.content.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-2.5 text-sm text-foreground/80 leading-relaxed">
                                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Usage Agreement Acceptance */}
            <div className="mt-10">
              <Suspense fallback={null}>
                <UsageAgreementSection currentPage="policies" />
              </Suspense>
            </div>

            {/* Footer Note */}
            <div className="mt-8 bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center">
              <Shield className="w-10 h-10 text-primary mx-auto mb-3" />
              <h3 className="font-bold text-foreground mb-2">التزامنا بالشفافية</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto">
                منصة iRecycle مبادرة وطنية تلتزم بأعلى معايير الشفافية والامتثال القانوني. جميع السياسات مبنية على القوانين المصرية والاتفاقيات الدولية لضمان حقوق جميع الأطراف.
              </p>
              <div className="flex flex-wrap gap-3 justify-center mt-4">
                <Button onClick={() => navigate('/auth?mode=register')} className="gap-2">
                  <Users className="w-4 h-4" />
                  سجّل الآن
                </Button>
                <Button variant="outline" onClick={() => navigate('/')} className="gap-2">
                  <ArrowRight className="w-4 h-4" />
                  الصفحة الرئيسية
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
};

export default Policies;
