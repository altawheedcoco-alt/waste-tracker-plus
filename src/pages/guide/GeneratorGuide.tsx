import { motion } from "framer-motion";
import { 
  Factory, 
  FileText, 
  Truck, 
  BarChart3, 
  Shield, 
  Users, 
  Clock, 
  CheckCircle2,
  ArrowLeft,
  Recycle,
  MapPin,
  Bell,
  Settings,
  FileCheck
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import GuideToolbar from "@/components/guide/GuideToolbar";

const sections = [
  {
    id: "intro",
    title: "مقدمة عن دور المولد",
    icon: Factory,
    content: `المولد هو أي منشأة أو شركة تنتج نفايات خلال عملياتها التشغيلية. يشمل ذلك المصانع، المستشفيات، الفنادق، المطاعم، ومراكز التسوق. 
    
    دورك كمولد يتضمن:
    • تصنيف النفايات المنتجة بشكل صحيح
    • التعاقد مع ناقلين ومدورين معتمدين
    • تتبع شحنات النفايات من البداية للنهاية
    • الحصول على شهادات إعادة التدوير
    • الالتزام بالمعايير البيئية المصرية والدولية`,
  },
  {
    id: "registration",
    title: "التسجيل وإعداد الحساب",
    icon: FileText,
    content: `خطوات التسجيل كمولد:

    1. إنشاء حساب جديد:
       • اختر "مولد" كنوع المنشأة
       • أدخل بيانات الشركة (الاسم، العنوان، السجل التجاري)
       • رفع المستندات المطلوبة (رخصة النشاط، البطاقة الضريبية)
    
    2. تفعيل الحساب:
       • انتظر مراجعة الإدارة (24-48 ساعة)
       • استلم إشعار التفعيل بالبريد الإلكتروني
       • أكمل إعداد الملف التعريفي
    
    3. إعدادات أساسية:
       • أضف فروع المنشأة ومواقعها
       • حدد أنواع النفايات التي تنتجها
       • عيّن المسؤولين والموظفين`,
  },
  {
    id: "partners",
    title: "إدارة الجهات المرتبطة",
    icon: Users,
    content: `كيفية التعامل مع شركاء العمل:

    🚛 اختيار الناقلين:
    • استعرض قائمة الناقلين المعتمدين
    • تحقق من التراخيص وتقييمات العملاء
    • أرسل طلب شراكة للناقل المناسب
    • راجع شروط العقد قبل الموافقة
    
    ♻️ اختيار المدورين:
    • ابحث عن مدورين حسب نوع النفايات
    • تأكد من قدرتهم على معالجة كمياتك
    • راجع شهادات الجودة والبيئة
    • تفاوض على الأسعار والشروط
    
    📋 إدارة العقود:
    • استخدم نماذج العقود الجاهزة
    • راجع البنود القانونية تلقائياً
    • احفظ نسخ رقمية موقعة`,
  },
  {
    id: "shipments",
    title: "إنشاء وتتبع الشحنات",
    icon: Truck,
    content: `خطوات إنشاء شحنة جديدة:

    1. بدء شحنة جديدة:
       • اضغط "شحنة جديدة" من لوحة التحكم
       • حدد نوع النفايات والكمية المقدرة
       • اختر الناقل والمدور من شركائك
    
    2. جدولة الشحنة:
       • حدد موعد الاستلام المفضل
       • أدخل عنوان الاستلام بدقة
       • أضف ملاحظات خاصة إن وجدت
    
    3. متابعة الشحنة:
       • تتبع موقع الشاحنة لحظياً
       • استلم إشعارات بتغير الحالة
       • راجع وثائق الاستلام والتسليم
    
    4. إتمام الشحنة:
       • تأكد من وصول الشحنة للمدور
       • راجع تقرير الوزن النهائي
       • احفظ شهادة إعادة التدوير`,
  },
  {
    id: "tracking",
    title: "التتبع اللحظي",
    icon: MapPin,
    content: `ميزات التتبع المتقدمة:

    🗺️ خريطة تفاعلية:
    • شاهد موقع شحناتك على الخريطة
    • تتبع مسار الشاحنة في الوقت الحقيقي
    • احصل على وقت الوصول المتوقع
    
    📊 حالات الشحنة:
    • في انتظار الاستلام
    • جاري الاستلام
    • في الطريق للمدور
    • وصلت للمدور
    • تم الوزن والتسليم
    • مكتملة
    
    🔔 الإشعارات:
    • تنبيه فوري عند تغير الحالة
    • إشعار عند تأخر الشحنة
    • تنبيه عند اكتمال التسليم`,
  },
  {
    id: "reports",
    title: "التقارير والإحصائيات",
    icon: BarChart3,
    content: `أنواع التقارير المتاحة:

    📈 تقارير الإنتاج:
    • كميات النفايات الشهرية/السنوية
    • تصنيف حسب نوع النفايات
    • مقارنة بين الفترات الزمنية
    
    ♻️ تقارير إعادة التدوير:
    • نسبة النفايات المُعاد تدويرها
    • شهادات إعادة التدوير
    • الأثر البيئي الإيجابي
    
    💰 تقارير مالية:
    • تكاليف النقل والتدوير
    • الفواتير والمدفوعات
    • تحليل التكلفة لكل نوع نفايات
    
    📋 تقارير الامتثال:
    • سجل النفايات الخطرة
    • سجل النفايات غير الخطرة
    • تقارير جهاز شؤون البيئة`,
  },
  {
    id: "certificates",
    title: "الشهادات والتوثيق",
    icon: FileCheck,
    content: `الوثائق المتاحة للمولد:

    📜 شهادات إعادة التدوير:
    • شهادة لكل شحنة مكتملة
    • تفاصيل الكميات المُعاد تدويرها
    • رمز QR للتحقق الإلكتروني
    
    📋 سجلات رسمية:
    • سجل النفايات الخطرة (Form 2)
    • سجل النفايات غير الخطرة
    • بيانات الشحنات المجمعة
    
    🏆 شهادات الاستدامة:
    • شهادة الالتزام البيئي
    • تقرير البصمة الكربونية
    • شهادة المسؤولية الاجتماعية`,
  },
  {
    id: "compliance",
    title: "الامتثال البيئي",
    icon: Shield,
    content: `متطلبات الامتثال للمولد:

    📌 القوانين المصرية:
    • قانون البيئة رقم 4 لسنة 1994
    • قانون إدارة المخلفات رقم 202 لسنة 2020
    • اللائحة التنفيذية لقانون المخلفات
    
    ✅ التزاماتك كمولد:
    • تصنيف النفايات بشكل صحيح
    • التعاقد مع جهات مرخصة فقط
    • الاحتفاظ بسجلات لمدة 5 سنوات
    • الإبلاغ عن الحوادث البيئية
    
    🛡️ كيف تساعدك المنصة:
    • تذكيرات بتجديد التراخيص
    • قوالب جاهزة للتقارير الرسمية
    • تنبيهات بالتحديثات القانونية
    • أرشفة إلكترونية آمنة`,
  },
];

const GeneratorGuide = () => {
  const navigate = useNavigate();

  // Transform sections for toolbar
  const toolbarSections = sections.map(s => ({
    id: s.id,
    title: s.title,
    content: s.content,
  }));

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-l from-primary to-primary/80 text-primary-foreground">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-primary-foreground hover:bg-white/20 mb-4 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة للرئيسية
          </Button>
          
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/20 rounded-2xl">
              <Factory className="w-12 h-12" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">دليل المولد</h1>
              <p className="text-primary-foreground/70 mt-2">
                دليلك الشامل لاستخدام منصة آي ريسايكل كمنشأة مولدة للنفايات
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <GuideToolbar 
        sections={toolbarSections} 
        guideTitle="دليل المولد" 
        primaryColor="blue"
      />

      {/* Quick Stats */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "أقسام الدليل", value: "8", icon: FileText },
            { label: "دقائق القراءة", value: "15", icon: Clock },
            { label: "خطوات عملية", value: "25+", icon: CheckCircle2 },
            { label: "نصائح مهمة", value: "40+", icon: Shield },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="bg-card border-border">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <stat.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Table of Contents */}
      <div className="container mx-auto px-4 pb-8">
        <Card className="bg-card border-border mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              فهرس المحتويات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {sections.map((section, i) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="flex items-center gap-2 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                    {i + 1}
                  </span>
                  <span className="text-sm text-foreground">{section.title}</span>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Content Sections */}
        <div className="space-y-8">
          {sections.map((section, i) => (
            <motion.div
              key={section.id}
              id={section.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-card border-border overflow-hidden">
                <CardHeader className="bg-gradient-to-l from-primary/5 to-primary/10 border-b border-border">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <section.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <span className="text-xs text-primary font-normal">القسم {i + 1}</span>
                      <h2 className="text-xl">{section.title}</h2>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line leading-relaxed">
                    {section.content}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12"
        >
          <Card className="bg-gradient-to-l from-primary to-primary/80 border-0 text-primary-foreground">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-4">جاهز للبدء؟</h3>
              <p className="text-primary-foreground/70 mb-6">
                سجّل الآن كمولد واستفد من جميع مميزات المنصة
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => navigate("/auth")}
                  className="gap-2"
                >
                  <Factory className="w-5 h-5" />
                  إنشاء حساب مولد
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/")}
                  className="gap-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                >
                  تصفح المزيد
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default GeneratorGuide;
