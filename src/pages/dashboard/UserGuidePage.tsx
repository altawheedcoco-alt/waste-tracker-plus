import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Printer, ArrowRight, Package, FileText, Users, Shield, Truck, Recycle, Factory, Brain, MapPin, BarChart3, Settings, Bell, MessageCircle, Calculator, BookOpen, Download, Eye, Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { usePDFExport } from '@/hooks/usePDFExport';

const Section = ({ id, icon: Icon, title, children }: { id: string; icon: any; title: string; children: React.ReactNode }) => (
  <section id={id} className="mb-8 scroll-mt-20">
    <div className="flex items-center gap-3 mb-4 pb-2 border-b-2 border-primary/20">
      <div className="p-2 rounded-lg bg-primary/10"><Icon className="w-5 h-5 text-primary" /></div>
      <h2 className="text-xl font-bold text-foreground">{title}</h2>
    </div>
    <div className="prose prose-sm max-w-none text-foreground/90 space-y-3">{children}</div>
  </section>
);

const SubSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mr-4 mb-4">
    <h3 className="text-base font-semibold text-foreground mb-2 flex items-center gap-2">
      <ArrowRight className="w-4 h-4 text-primary" />{title}
    </h3>
    <div className="mr-6 space-y-2 text-sm leading-relaxed">{children}</div>
  </div>
);

const StatusBadge = ({ color, label }: { color: string; label: string }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>
    <span className="w-2 h-2 rounded-full bg-current" />{label}
  </span>
);

const TableOfContents = () => {
  const sections = [
    { id: 'overview', label: 'نظرة عامة على المنصة' },
    { id: 'roles', label: 'الأدوار والصلاحيات' },
    { id: 'shipments', label: 'منظومة الشحنات' },
    { id: 'documents', label: 'الإقرارات والشهادات' },
    { id: 'generator', label: 'لوحة المولد' },
    { id: 'transporter', label: 'لوحة الناقل' },
    { id: 'recycler', label: 'لوحة المدوّر' },
    { id: 'admin', label: 'لوحة المدير' },
    { id: 'sidebar', label: 'القائمة الجانبية' },
    { id: 'tracking', label: 'التتبع والأمان' },
    { id: 'compliance', label: 'الامتثال القانوني' },
    { id: 'ai', label: 'الذكاء الاصطناعي' },
    { id: 'erp', label: 'نظام ERP' },
    { id: 'communication', label: 'التواصل والإشعارات' },
  ];

  return (
    <Card className="mb-8 print:hidden">
      <CardContent className="p-4">
        <h3 className="font-bold text-sm mb-3 text-primary">📑 فهرس المحتويات</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {sections.map(s => (
            <a key={s.id} href={`#${s.id}`} className="text-xs text-muted-foreground hover:text-primary transition-colors py-1 px-2 rounded hover:bg-primary/5">
              {s.label}
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const UserGuidePage = () => {
  const printRef = useRef<HTMLDivElement>(null);
  const { exportToPDF, previewPDF, printContent, isExporting } = usePDFExport({
    filename: 'دليل-المستخدم-iRecycle',
    orientation: 'portrait',
  });

  const handlePrint = () => printRef.current && printContent(printRef.current);
  const handlePDF = () => printRef.current && exportToPDF(printRef.current);
  const handlePreview = () => printRef.current && previewPDF(printRef.current);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <BackButton />
        {/* Header */}
        <div className="flex items-center justify-between mb-6 print:hidden">
          <div>
            <h1 className="text-2xl font-bold text-foreground">📖 دليل المستخدم الشامل</h1>
            <p className="text-sm text-muted-foreground mt-1">الشرح التفصيلي الكامل لجميع وظائف وخدمات منصة iRecycle</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handlePrint} className="gap-2" disabled={isExporting}>
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
              طباعة
            </Button>
            <Button variant="outline" onClick={handlePDF} className="gap-2" disabled={isExporting}>
              <Download className="w-4 h-4" />
              PDF
            </Button>
            <Button variant="outline" onClick={handlePreview} className="gap-2" disabled={isExporting}>
              <Eye className="w-4 h-4" />
              معاينة
            </Button>
          </div>
        </div>

        <TableOfContents />

        <div ref={printRef} className="space-y-2">

          {/* نظرة عامة */}
          <Section id="overview" icon={BookOpen} title="نظرة عامة على المنصة">
            <p>منصة <strong>iRecycle</strong> هي نظام متكامل لإدارة المخلفات رقمياً، مبني وفقاً لقانون تنظيم إدارة المخلفات المصري رقم 202 لسنة 2020. تربط المنصة بين جميع الأطراف المعنية في سلسلة إدارة المخلفات: المولّدين، شركات النقل، جهات التدوير، ومرافق التخلص النهائي.</p>
            <p>تتميز المنصة بـ: التتبع اللحظي GPS، سلسلة حيازة رقمية مشفرة (SHA-256)، توقيع وختم إلكتروني، ذكاء اصطناعي متقدم، ونظام ERP مدمج.</p>
          </Section>

          {/* الأدوار */}
          <Section id="roles" icon={Users} title="الأدوار والصلاحيات">
            <SubSection title="🏭 المولّد (Generator)">
              <p>الجهة المنتجة للمخلفات (مصانع، مستشفيات، شركات). يمكنه إنشاء شحنات، إصدار إقرارات تسليم، متابعة شهادات التدوير، وإدارة علاقاته مع الناقلين والمدورين.</p>
            </SubSection>
            <SubSection title="🚛 الناقل (Transporter)">
              <p>شركة النقل المرخصة. يدير أسطول المركبات والسائقين، يستلم وينقل الشحنات، يصدر إيصالات الاستلام والتسليم، ويتتبع الرحلات عبر GPS.</p>
            </SubSection>
            <SubSection title="♻️ المدوّر (Recycler)">
              <p>جهة إعادة التدوير أو المعالجة. يستلم المخلفات ويؤكد استلامها، يصدر شهادات التدوير، ويوثق عمليات المعالجة.</p>
            </SubSection>
            <SubSection title="🏗️ مرفق التخلص النهائي (Disposal)">
              <p>المدافن المرخصة ومرافق التخلص. يستقبل الشحنات النهائية ويصدر شهادات التخلص الآمن.</p>
            </SubSection>
            <SubSection title="🛡️ مدير النظام (Admin)">
              <p>يمتلك صلاحيات شاملة تشمل: إدارة المنظمات والمستخدمين، مراقبة الامتثال، الموافقة على التسجيلات الجديدة، وتحليل البيانات على مستوى المنصة.</p>
            </SubSection>
          </Section>

          {/* منظومة الشحنات */}
          <Section id="shipments" icon={Package} title="منظومة الشحنات — دورة الحياة الكاملة">
            <p className="font-medium">الشحنة هي الوحدة الأساسية في المنصة. تمر بـ 6 مراحل متتالية:</p>
            
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex flex-wrap gap-2">
                <StatusBadge color="bg-yellow-100 text-yellow-800" label="1. جديدة (new)" />
                <StatusBadge color="bg-green-100 text-green-800" label="2. معتمدة (approved)" />
                <StatusBadge color="bg-blue-100 text-blue-800" label="3. قيد النقل (in_transit)" />
                <StatusBadge color="bg-indigo-100 text-indigo-800" label="4. تم التسليم (delivered)" />
                <StatusBadge color="bg-emerald-100 text-emerald-800" label="5. مؤكدة (confirmed)" />
                <StatusBadge color="bg-teal-100 text-teal-800" label="6. مكتملة (completed)" />
              </div>
            </div>

            <SubSection title="المرحلة 1: جديدة">
              <p>يتم إنشاء الشحنة بكافة تفاصيلها: نوع المخلف، الكمية، الوحدة، عناوين الاستلام والتسليم، وتحديد الأطراف (المولد، الناقل، المدوّر/مرفق التخلص). يمكن إرفاق ملاحظات وتحديد تاريخ الجدولة.</p>
            </SubSection>
            <SubSection title="المرحلة 2: معتمدة">
              <p>يتم مراجعة البيانات واعتمادها. عند الاعتماد، يُنشأ <strong>إقرار المولد تلقائياً</strong> كإثبات لتسليم المخلفات. يتم أيضاً حجز القيمة المالية في محفظة الضمان (Escrow) إن وُجدت.</p>
            </SubSection>
            <SubSection title="المرحلة 3: قيد النقل">
              <p>يبدأ السائق الرحلة ويتم تفعيل <strong>التتبع المباشر GPS</strong>. النظام يراقب: الموقع الفعلي، كشف تزييف GPS، فقدان الإشارة، والالتزام بالمسار المحدد.</p>
            </SubSection>
            <SubSection title="المرحلة 4: تم التسليم">
              <p>وصول الشحنة للوجهة. يُشترط أن يكون السائق <strong>داخل نطاق 200 متر</strong> من الوجهة (Geofencing) لتأكيد التسليم. يُنشأ إيصال التسليم مع صور الحمولة وبيانات الميزان.</p>
            </SubSection>
            <SubSection title="المرحلة 5: مؤكدة">
              <p>المستلم (المدوّر أو مرفق التخلص) يؤكد استلام الشحنة ومطابقتها. يُنشأ <strong>إقرار المدوّر تلقائياً</strong>. يتم تحرير الأموال من محفظة الضمان للناقل.</p>
            </SubSection>
            <SubSection title="المرحلة 6: مكتملة">
              <p>اكتمال جميع المستندات والإقرارات. يظهر زر <strong>"مستند الشحنة الكامل"</strong> تلقائياً — وهو ملف PDF مجمع يحتوي على كل بيانات الشحنة والأطراف والإقرارات والتوقيعات والأختام وسلسلة الحيازة.</p>
            </SubSection>

            <SubSection title="بيانات الشحنة التفصيلية">
              <p>كل شحنة تحتوي على: رقم الشحنة الفريد، نوع المخلف وتصنيفه، الكمية والوحدة، الوزن المعلن والفعلي، رقم تذكرة الميزان، عناوين الاستلام والتسليم مع الإحداثيات، بيانات السائق والمركبة، السعر والعملة، وتواريخ كل مرحلة.</p>
            </SubSection>
          </Section>

          {/* الإقرارات والشهادات */}
          <Section id="documents" icon={FileText} title="منظومة الإقرارات والشهادات">
            <p>تنقسم المستندات إلى 6 أنواع رئيسية، تُنشأ تلقائياً أو يدوياً حسب مرحلة الشحنة:</p>

            <SubSection title="1️⃣ إقرار المولد (Generator Declaration)">
              <p><strong>متى يُنشأ:</strong> تلقائياً عند اعتماد أو تسجيل الشحنة.</p>
              <p><strong>المحتوى:</strong> إقرار رسمي بتسليم المخلفات، يتضمن نوعها وكميتها والتزام المولد بصحة البيانات المقدمة.</p>
              <p><strong>التوقيع:</strong> يتم توقيعه وختمه إلكترونياً من المولد مع بصمة رقمية SHA-256.</p>
            </SubSection>

            <SubSection title="2️⃣ إيصال استلام الناقل (Transporter Receipt)">
              <p><strong>متى يُنشأ:</strong> عند استلام الشحنة من المولد.</p>
              <p><strong>المحتوى:</strong> الوزن المعلن مقابل الوزن الفعلي، صور الحمولة، إحداثيات الاستلام GPS.</p>
              <p><strong>مهلة الموافقة:</strong> 6 ساعات للناقل للموافقة، وإلا يتم التأكيد التلقائي بالختم والتوقيع.</p>
              <p><strong>في حالة الرفض:</strong> يُلزم الناقل بذكر أسباب الرفض ويُسجل في سجل المرفوضات.</p>
            </SubSection>

            <SubSection title="3️⃣ شهادة التسليم (Delivery Certificate)">
              <p><strong>متى تُنشأ:</strong> عند تسليم الشحنة للمدوّر أو مرفق التخلص.</p>
              <p><strong>المحتوى:</strong> تأكيد نقل المخلفات بسلامة، بيانات المسار الجغرافي، الأوزان، وتوقيع الناقل والمستلم.</p>
            </SubSection>

            <SubSection title="4️⃣ إقرار المدوّر (Recycler Declaration)">
              <p><strong>متى يُنشأ:</strong> تلقائياً عند تأكيد استلام الشحنة من المدوّر.</p>
              <p><strong>المحتوى:</strong> إقرار رسمي بالاستلام والالتزام بالمعالجة وفق القانون والمعايير البيئية.</p>
              <p><strong>ملاحظة مهمة:</strong> في حالة الرفض، يظل السجل محفوظاً للأرشفة والتدقيق ولا يُحذف لضمان سلسلة الحيازة.</p>
            </SubSection>

            <SubSection title="5️⃣ شهادة التدوير (Recycling Certificate)">
              <p><strong>متى تُنشأ:</strong> بعد معالجة المخلفات فعلياً من قبل المدوّر.</p>
              <p><strong>المحتوى:</strong> تفاصيل المعالجة، الكميات المدخلة والمخرجة، طريقة المعالجة، النتائج.</p>
              <p><strong>الأمان:</strong> تتضمن QR Code للتحقق + بصمة رقمية SHA-256 + ختم النظام التسلسلي (IRS-YYMM-XXXXXX).</p>
            </SubSection>

            <SubSection title="6️⃣ مستند الشحنة الكامل (Complete Shipment Document)">
              <p><strong>متى يظهر:</strong> تلقائياً عند اكتمال الشحنة من جميع الأطراف (حالة مؤكدة أو مكتملة).</p>
              <p><strong>المحتوى:</strong> ملف PDF من صفحتين يجمع كل شيء: بيانات الأطراف الثلاثة التفصيلية، تفاصيل المخلفات والأوزان، جميع الإيصالات، كافة الإقرارات بتوقيعاتها وأختامها، سلسلة الحيازة الرقمية الكاملة، وسجل تغييرات الحالة.</p>
              <p><strong>الوصول:</strong> يظهر كزر تلقائي في بطاقة الشحنة وفي قوائم الشحنات لجميع الجهات المشاركة.</p>
            </SubSection>

            <SubSection title="التوقيع والختم الإلكتروني">
              <p>يدعم النظام 4 طرق للتوقيع: الرسم اليدوي، رفع صورة التوقيع، نص مزخرف، والموافقة بنقرة. كل توقيع يُربط ببيانات التدقيق (IP، الجهاز، الطابع الزمني) ويتم التحكم عبر نظام المفوضين المعتمدين (Authorized Signatories).</p>
            </SubSection>
          </Section>

          {/* لوحة المولد */}
          <Section id="generator" icon={Factory} title="لوحة تحكم المولد">
            <SubSection title="نظرة عامة">
              <p>إحصائيات شاملة: عدد الشحنات حسب الحالة، رسوم بيانية للاتجاهات، النبض اليومي، وتنبيهات الشحنات المتأخرة.</p>
            </SubSection>
            <SubSection title="شحناتي">
              <p>قائمة كاملة بالشحنات مع فلترة بالحالة والنوع والتاريخ، بحث متقدم، تصدير Excel، وطباعة. تتضمن كل شحنة بطاقة تفصيلية مع شريط تقدم بصري.</p>
            </SubSection>
            <SubSection title="إيصالات الاستلام">
              <p>متابعة إيصالات الشحنات المرسلة: شهادات التسليم الصادرة، حالتها (معلقة/مؤكدة/مرفوضة)، وإمكانية طباعتها.</p>
            </SubSection>
            <SubSection title="شهادات التدوير">
              <p>متابعة شهادات التدوير من المدورين المرتبطين، التحقق من حالتها، وتحميلها كـ PDF.</p>
            </SubSection>
            <SubSection title="الجهات المرتبطة">
              <p>إدارة العلاقات مع الناقلين والمدورين، نظام تقييم متبادل (جودة، التزام، سلامة)، وبوابة الشريك.</p>
            </SubSection>
            <SubSection title="الامتثال القانوني">
              <p>متابعة التراخيص بنظام إشارة المرور (أخضر/أصفر/أحمر)، تنبيه قبل 30 يوماً من الانتهاء، وحظر تلقائي قبل 7 أيام.</p>
            </SubSection>
          </Section>

          {/* لوحة الناقل */}
          <Section id="transporter" icon={Truck} title="لوحة تحكم الناقل">
            <SubSection title="نظرة عامة (Cockpit)">
              <p>تصميم تفاعلي يعرض: إحصائيات الشحنات، الإيرادات، النبض اليومي مقارنة بالمتوسط الأسبوعي، وتنبيهات فورية.</p>
            </SubSection>
            <SubSection title="الذكاء الاصطناعي">
              <p>4 أدوات متقدمة: كشف الشذوذ (Anomaly Detection)، التنبؤ بالطلب (Demand Forecasting)، تحسين الأسعار (Price Optimization)، وتخطيط السعة (Capacity Planning).</p>
            </SubSection>
            <SubSection title="الأداء">
              <p>تحليلات مالية وتشغيلية: تكاليف الرحلات، صافي الربحية، معدل الاستخدام، ومقارنة الأداء.</p>
            </SubSection>
            <SubSection title="التقويم">
              <p>جدول زمني للرحلات المجدولة والمكتملة، مع إمكانية جدولة رحلات جديدة.</p>
            </SubSection>
            <SubSection title="إدارة السائقين">
              <p>تسجيل السائقين والمركبات، متابعة التراخيص والتصاريح، التتبع المباشر GPS، وملف امتثال لكل سائق ومركبة.</p>
            </SubSection>
            <SubSection title="الشحنات">
              <p>القائمة الكاملة مع: فلترة بالحالة، بحث متقدم، تغيير جماعي للحالة، تصدير Excel، طباعة جماعية، وزر "مستند الشحنة الكامل" للشحنات المكتملة.</p>
            </SubSection>
            <SubSection title="التتبع والأمان">
              <p>خريطة مباشرة لمواقع السائقين، كشف تزييف GPS وحظر الواجهة، مراقبة فقدان الإشارة، ونطاق جغرافي (Geofencing) يمنع التسليم خارج 200 متر.</p>
            </SubSection>
          </Section>

          {/* لوحة المدوّر */}
          <Section id="recycler" icon={Recycle} title="لوحة تحكم المدوّر">
            <SubSection title="نظرة عامة">
              <p>إحصائيات الاستقبال والمعالجة، الكميات المعالجة، ومعدل إعادة التدوير.</p>
            </SubSection>
            <SubSection title="الشحنات الواردة">
              <p>قائمة الشحنات الموجهة للمدوّر، مع إمكانية تأكيد الاستلام أو الرفض مع ذكر الأسباب.</p>
            </SubSection>
            <SubSection title="إصدار شهادات التدوير">
              <p>إنشاء شهادات تدوير رسمية تتضمن تفاصيل المعالجة والنتائج، مع QR Code وبصمة رقمية.</p>
            </SubSection>
            <SubSection title="إقرارات التسليم">
              <p>الإقرارات الواردة من المولدين والناقلين، مع إمكانية المراجعة والتأكيد.</p>
            </SubSection>
          </Section>

          {/* لوحة المدير */}
          <Section id="admin" icon={Shield} title="لوحة تحكم مدير النظام">
            <SubSection title="العين الذكية (Smart Eye)">
              <p>رؤى ذكية مدعومة بالذكاء الاصطناعي عن أداء المنصة بالكامل.</p>
            </SubSection>
            <SubSection title="الموافقات">
              <p>الموافقة على تسجيل الشركات والسائقين الجدد، مراجعة الوثائق المطلوبة.</p>
            </SubSection>
            <SubSection title="حالة النظام">
              <p>مراقبة صحة النظام، الأداء، وتقارير الأخطاء.</p>
            </SubSection>
            <SubSection title="التتبع الشامل">
              <p>خريطة لجميع السائقين والمركبات على مستوى المنصة.</p>
            </SubSection>
          </Section>

          {/* القائمة الجانبية */}
          <Section id="sidebar" icon={Settings} title="القائمة الجانبية — الأقسام المشتركة">
            <p>بالإضافة للأقسام الخاصة بكل دور، تتضمن القائمة الجانبية أقسام مشتركة لجميع الجهات:</p>

            <SubSection title="📊 التقارير">
              <p>تقارير الشحنات التفصيلية، التقرير المجمع، ودليل إعداد التقارير.</p>
            </SubSection>
            <SubSection title="📁 أرشيف المستندات">
              <p>أرشيف رقمي شامل يسحب تلقائياً من 10 مصادر (فواتير، شهادات، عقود، أوزان...) مع بحث متقدم وتصنيف ذكي.</p>
            </SubSection>
            <SubSection title="📋 سجلات المخلفات">
              <p>سجل المخلفات غير الخطرة، سجل المخلفات الخطرة، وتصنيف أنواع المخلفات مع درجة الامتثال.</p>
            </SubSection>
            <SubSection title="🗺️ المواقع والخرائط">
              <p>مستكشف الخريطة للبحث عن المرافق، والمواقع المحفوظة.</p>
            </SubSection>
            <SubSection title="⚡ الروابط السريعة">
              <p>روابط سريعة للإيداعات، إنشاء الشحنات، وإدارة السائقين.</p>
            </SubSection>
            <SubSection title="💬 التواصل">
              <p>دردشة الفريق مع الجهات المرتبطة، والحالات (Stories) لمشاركة التحديثات.</p>
            </SubSection>
            <SubSection title="📨 الطلبات والتنظيم">
              <p>طلبات الموافقة، السجل التنظيمي، الخطط التشغيلية، وحسابات الجهات المرتبطة المالية.</p>
            </SubSection>
          </Section>

          {/* التتبع */}
          <Section id="tracking" icon={MapPin} title="نظام التتبع والأمان">
            <SubSection title="التتبع المباشر GPS">
              <p>تتبع لحظي لمواقع السائقين على الخريطة، مع عرض المسار المقطوع والسرعة.</p>
            </SubSection>
            <SubSection title="كشف تزييف الموقع (Fake GPS)">
              <p>النظام يكشف تلقائياً محاولات تزييف الموقع ويحظر الواجهة عند التلاعب.</p>
            </SubSection>
            <SubSection title="النطاق الجغرافي (Geofencing)">
              <p>يمنع تغيير حالة الشحنة إلى "تم التسليم" إلا داخل 200 متر من الوجهة.</p>
            </SubSection>
            <SubSection title="سلسلة الحيازة (Chain of Custody)">
              <p>توثيق تسلسلي عبر QR Code: المولد → الناقل → المستلم، مع تشفير SHA-256 وإحداثيات GPS لكل حدث.</p>
            </SubSection>
          </Section>

          {/* الامتثال */}
          <Section id="compliance" icon={Shield} title="الامتثال القانوني">
            <SubSection title="نظام إشارة المرور">
              <p>🟢 <strong>أخضر:</strong> الترخيص ساري المفعول | 🟡 <strong>أصفر:</strong> تنبيه قبل 30 يوماً من الانتهاء | 🔴 <strong>أحمر:</strong> حظر تلقائي قبل 7 أيام من الانتهاء.</p>
            </SubSection>
            <SubSection title="امتثال المركبات">
              <p>رخصة تداول مواد خطرة، ملصقات تحذيرية، تجهيزات أمان، وجهاز GPS مفعّل.</p>
            </SubSection>
            <SubSection title="امتثال السائقين">
              <p>رخصة قيادة مهنية، شهادة تدريب تداول مواد خطرة، وصحيفة جنائية.</p>
            </SubSection>
            <SubSection title="GDPR والخصوصية">
              <p>إدارة إعدادات الخصوصية، طلبات تصدير/حذف البيانات، وسجل التدقيق.</p>
            </SubSection>
          </Section>

          {/* الذكاء الاصطناعي */}
          <Section id="ai" icon={Brain} title="الذكاء الاصطناعي المتقدم">
            <SubSection title="كشف الشذوذ (Anomaly Detection)">
              <p>يحلل أنماط الشحنات والعمليات لاكتشاف السلوكيات غير الطبيعية مثل الأوزان المشبوهة أو المسارات غير المعتادة.</p>
            </SubSection>
            <SubSection title="التنبؤ بالطلب (Demand Forecasting)">
              <p>يتنبأ بحجم الطلب المستقبلي بناءً على البيانات التاريخية والموسمية لتحسين التخطيط.</p>
            </SubSection>
            <SubSection title="تحسين الأسعار (Price Optimization)">
              <p>يقترح أسعاراً مثلى بناءً على تحليل السوق والتكاليف والمنافسة.</p>
            </SubSection>
            <SubSection title="تخطيط السعة (Capacity Planning)">
              <p>يحلل القدرة الاستيعابية ويوصي بتوزيع الموارد الأمثل.</p>
            </SubSection>
            <SubSection title="المساعد الذكي">
              <p>مساعد ذكاء اصطناعي متاح على مدار الساعة للإجابة على الاستفسارات وتقديم التوصيات.</p>
            </SubSection>
          </Section>

          {/* ERP */}
          <Section id="erp" icon={Calculator} title="نظام ERP المدمج">
            <SubSection title="المحاسبة">
              <p>دفتر الأستاذ المحاسبي، القيود الآلية عند تأكيد الشحنات والإيداعات، وتقارير الأرباح والخسائر.</p>
            </SubSection>
            <SubSection title="المخزون">
              <p>إدارة مخزون المخلفات والمواد المعاد تدويرها، مع تتبع الكميات والحركة.</p>
            </SubSection>
            <SubSection title="الموارد البشرية">
              <p>إدارة الموظفين، الحضور، والتقييم.</p>
            </SubSection>
            <SubSection title="المشتريات والمبيعات">
              <p>أوامر الشراء والبيع، الفواتير، وتقارير المبيعات.</p>
            </SubSection>
            <SubSection title="التقارير المالية">
              <p>لوحة مالية شاملة، الإيرادات والمصروفات، تكلفة البضاعة المباعة، والمقارنات المالية.</p>
            </SubSection>
          </Section>

          {/* التواصل */}
          <Section id="communication" icon={MessageCircle} title="التواصل والإشعارات">
            <SubSection title="الدردشة">
              <p>نظام مراسلة فوري بين الجهات المرتبطة، مع دعم المرفقات والإشعارات.</p>
            </SubSection>
            <SubSection title="الإشعارات الذكية">
              <p>إشعارات فورية عند تغيير حالة الشحنات، مواعيد التسليم، انتهاء التراخيص، والتنبيهات الأمنية.</p>
            </SubSection>
            <SubSection title="الحالات (Stories)">
              <p>مشاركة التحديثات والإنجازات مع الجهات المرتبطة بأسلوب بصري.</p>
            </SubSection>
          </Section>

          {/* Footer */}
          <div className="border-t-2 border-primary/20 pt-6 mt-8 text-center text-sm text-muted-foreground">
            <p className="font-medium">منصة iRecycle لإدارة المخلفات — دليل المستخدم الشامل</p>
            <p>وفقاً لقانون تنظيم إدارة المخلفات رقم 202 لسنة 2020 ولائحته التنفيذية</p>
            <p className="text-xs mt-2">آخر تحديث: {new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          /* Hide UI chrome */
          nav, header, aside, [class*="sidebar"], [class*="Sidebar"], button, .print\\:hidden,
          [data-sidebar], [role="navigation"], footer:not(.print-footer) { display: none !important; }
          
          /* Reset page */
          @page { size: A4; margin: 15mm 15mm 20mm 15mm; }
          html, body { margin: 0 !important; padding: 0 !important; background: white !important; }
          body { font-size: 9px !important; line-height: 1.35 !important; font-family: 'Cairo', 'Segoe UI', sans-serif !important; direction: rtl !important; }
          
          /* Layout reset */
          .max-w-4xl { max-width: 100% !important; padding: 0 !important; margin: 0 !important; }
          main, [class*="main"], [role="main"] { padding: 0 !important; margin: 0 !important; width: 100% !important; max-width: 100% !important; }
          
          /* Compact sections */
          section { page-break-inside: avoid; margin-bottom: 4px !important; }
          .space-y-2 > * + * { margin-top: 2px !important; }
          .mb-8 { margin-bottom: 4px !important; }
          .mb-4 { margin-bottom: 2px !important; }
          .mb-2 { margin-bottom: 1px !important; }
          .mr-4 { margin-right: 8px !important; }
          .mr-6 { margin-right: 12px !important; }
          .space-y-3 > * + * { margin-top: 2px !important; }
          .space-y-2 > * + * { margin-top: 1px !important; }
          .pb-2 { padding-bottom: 1px !important; }
          .pt-6 { padding-top: 4px !important; }
          .mt-8 { margin-top: 4px !important; }
          
          /* Typography */
          h1 { font-size: 14px !important; margin: 0 !important; }
          h2 { font-size: 11px !important; margin: 0 !important; }
          h3 { font-size: 9.5px !important; margin: 0 0 1px 0 !important; }
          p { font-size: 8.5px !important; margin: 1px 0 !important; line-height: 1.3 !important; }
          
          /* Badges */
          .rounded-full { padding: 1px 4px !important; font-size: 7px !important; }
          .rounded-full .w-2 { width: 5px !important; height: 5px !important; }
          
          /* Section header */
          .border-b-2 { border-bottom-width: 1px !important; padding-bottom: 1px !important; margin-bottom: 2px !important; }
          .p-2 { padding: 2px !important; }
          .w-5 { width: 12px !important; height: 12px !important; }
          .gap-3 { gap: 4px !important; }
          .gap-2 { gap: 3px !important; }
          .gap-1\\.5 { gap: 2px !important; }
          
          /* Status badges container */
          .bg-muted\\/50 { padding: 3px 6px !important; margin: 2px 0 !important; }
          .flex-wrap { gap: 2px !important; }
          
          /* Icons in subsections */
          .w-4 { width: 10px !important; height: 10px !important; }
          
          /* Print header */
          .border-t-2 { border-top-width: 1px !important; padding-top: 3px !important; margin-top: 4px !important; }
          .text-xs { font-size: 7px !important; }
          .mt-2 { margin-top: 2px !important; }
          
          /* Color adjustments */
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
        }
      `}</style>
    </DashboardLayout>
  );
};

export default UserGuidePage;
