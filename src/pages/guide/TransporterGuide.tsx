import { motion } from "framer-motion";
import { 
  Truck, 
  FileText, 
  MapPin, 
  BarChart3, 
  Shield, 
  Users, 
  Clock, 
  CheckCircle2,
  ArrowLeft,
  Navigation,
  Bell,
  Settings,
  Wallet,
  UserCheck
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import GuideToolbar from "@/components/guide/GuideToolbar";

const sections = [
  {
    id: "intro",
    title: "مقدمة عن دور الناقل",
    icon: Truck,
    content: `الناقل هو الشركة المسؤولة عن نقل النفايات من المولد إلى المدور بطريقة آمنة ومرخصة.

    مسؤولياتك كناقل:
    • امتلاك أسطول مركبات مرخص لنقل النفايات
    • توظيف سائقين مدربين ومؤهلين
    • الالتزام بمسارات النقل المعتمدة
    • توثيق عمليات الاستلام والتسليم
    • ضمان سلامة الحمولة طوال الرحلة
    
    أنواع النفايات المسموح بنقلها:
    • النفايات الصلبة البلدية
    • النفايات الصناعية غير الخطرة
    • النفايات الخطرة (بترخيص خاص)
    • نفايات البناء والهدم`,
  },
  {
    id: "registration",
    title: "التسجيل والتراخيص",
    icon: FileText,
    content: `متطلبات التسجيل كناقل:

    📋 المستندات المطلوبة:
    • السجل التجاري (نشاط نقل النفايات)
    • ترخيص مزاولة النشاط من البيئة
    • رخص المركبات سارية المفعول
    • شهادات الصيانة الدورية
    • وثائق التأمين على المركبات
    
    ✅ خطوات التسجيل:
    1. أنشئ حساب واختر "ناقل"
    2. أدخل بيانات الشركة الأساسية
    3. ارفع المستندات المطلوبة
    4. انتظر مراجعة الإدارة
    5. فعّل حسابك وأضف أسطولك
    
    ⚠️ ملاحظات مهمة:
    • تجديد التراخيص قبل انتهائها
    • تحديث بيانات المركبات دورياً
    • إضافة مركبات جديدة عند الحاجة`,
  },
  {
    id: "fleet",
    title: "إدارة الأسطول",
    icon: Truck,
    content: `إدارة مركبات الأسطول:

    🚛 إضافة مركبة جديدة:
    • أدخل رقم اللوحة والموديل
    • حدد نوع المركبة وسعتها
    • ارفع رخصة المركبة
    • عيّن السائق المسؤول
    
    📊 متابعة حالة المركبات:
    • متاحة للعمل
    • في مهمة نقل
    • في الصيانة
    • غير متاحة
    
    🔧 جدول الصيانة:
    • تذكيرات الصيانة الدورية
    • سجل الصيانة والإصلاحات
    • تنبيهات تجديد الرخص
    
    📈 إحصائيات الأسطول:
    • عدد الرحلات المكتملة
    • إجمالي المسافات المقطوعة
    • متوسط وقت التسليم`,
  },
  {
    id: "drivers",
    title: "إدارة السائقين",
    icon: UserCheck,
    content: `إدارة فريق السائقين:

    👤 إضافة سائق جديد:
    • البيانات الشخصية الأساسية
    • رقم رخصة القيادة وتاريخ الانتهاء
    • شهادة التدريب على نقل النفايات
    • صورة الهوية الوطنية
    
    📱 تطبيق السائق:
    • يحمّل السائق تطبيق المنصة
    • يسجل دخوله ببياناته
    • يستقبل المهام الجديدة
    • يتتبع مساره ويوثق العمليات
    
    📊 متابعة الأداء:
    • عدد الشحنات المكتملة
    • تقييمات العملاء
    • الالتزام بالمواعيد
    • سجل المخالفات
    
    💰 الحوافز والمكافآت:
    • مكافآت الأداء المتميز
    • حوافز الشحنات الإضافية
    • تقارير الإنتاجية الشهرية`,
  },
  {
    id: "shipments",
    title: "إدارة الشحنات",
    icon: Navigation,
    content: `التعامل مع طلبات النقل:

    📥 استلام الطلبات:
    • إشعار فوري بالطلبات الجديدة
    • مراجعة تفاصيل الشحنة
    • قبول أو رفض الطلب
    • تعيين السائق والمركبة
    
    🗓️ جدولة الشحنات:
    • تحديد موعد الاستلام
    • تنظيم الشحنات حسب المنطقة
    • تحسين المسارات تلقائياً
    
    📋 توثيق العمليات:
    • تأكيد الاستلام بالتوقيع
    • تصوير الحمولة عند الاستلام
    • تسجيل الوزن الفعلي
    • تأكيد التسليم للمدور
    
    ⚠️ التعامل مع المشاكل:
    • الإبلاغ عن التأخير
    • توثيق الحوادث
    • التواصل مع الدعم الفني`,
  },
  {
    id: "tracking",
    title: "التتبع والملاحة",
    icon: MapPin,
    content: `نظام التتبع المتقدم:

    🗺️ التتبع اللحظي:
    • موقع كل مركبة على الخريطة
    • حالة الشحنة الحالية
    • الوقت المتوقع للوصول
    • تنبيهات الانحراف عن المسار
    
    🧭 نظام الملاحة:
    • أفضل مسار للوجهة
    • تجنب الازدحام المروري
    • نقاط التوقف المحددة
    • تكامل مع Google Maps وWaze
    
    📊 سجل الرحلات:
    • تاريخ جميع الرحلات
    • المسافة والوقت لكل رحلة
    • نقاط التوقف والاستراحات
    • تقارير الكفاءة
    
    🔔 الإشعارات:
    • وصول السائق للموقع
    • بدء وانتهاء التحميل
    • الوصول للوجهة النهائية`,
  },
  {
    id: "finance",
    title: "الإدارة المالية",
    icon: Wallet,
    content: `إدارة الحسابات والفواتير:

    💰 التسعير:
    • تحديد أسعار النقل
    • تسعير حسب المسافة أو الوزن
    • عروض خاصة للعملاء الدائمين
    
    📄 الفواتير:
    • إصدار فواتير تلقائية
    • فواتير فردية أو مجمعة
    • إرسال الفواتير إلكترونياً
    
    💳 المدفوعات:
    • تتبع المستحقات
    • إشعارات التحصيل
    • تسوية الحسابات
    
    📊 التقارير المالية:
    • الإيرادات الشهرية
    • تحليل الربحية
    • مصروفات التشغيل
    • تقارير الضرائب`,
  },
  {
    id: "compliance",
    title: "الامتثال والسلامة",
    icon: Shield,
    content: `معايير السلامة والامتثال:

    📌 اشتراطات النقل:
    • المركبات مجهزة ومغطاة
    • عدم تسرب أو انسكاب
    • فصل النفايات الخطرة
    • التغليف المناسب
    
    📋 الوثائق المطلوبة:
    • بوليصة الشحن لكل رحلة
    • سجل الوزن والكميات
    • إيصالات الاستلام والتسليم
    
    ⚠️ إجراءات الطوارئ:
    • خطة التعامل مع الحوادث
    • معدات السلامة بالمركبات
    • أرقام الطوارئ
    
    ✅ التفتيش الدوري:
    • فحص المركبات أسبوعياً
    • تدريب السائقين دورياً
    • مراجعة الوثائق شهرياً`,
  },
];

const TransporterGuide = () => {
  const navigate = useNavigate();

  const toolbarSections = sections.map(s => ({
    id: s.id,
    title: s.title,
    content: s.content,
  }));

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-l from-orange-600 to-orange-800 text-white">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-white hover:bg-white/20 mb-4 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة للرئيسية
          </Button>
          
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/20 rounded-2xl">
              <Truck className="w-12 h-12" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">دليل الناقل</h1>
              <p className="text-orange-100 mt-2">
                دليلك الشامل لاستخدام منصة آي ريسايكل كشركة نقل نفايات
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <GuideToolbar 
        sections={toolbarSections} 
        guideTitle="دليل الناقل" 
        primaryColor="orange"
      />

      {/* Quick Stats */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "أقسام الدليل", value: "8", icon: FileText },
            { label: "دقائق القراءة", value: "18", icon: Clock },
            { label: "خطوات عملية", value: "30+", icon: CheckCircle2 },
            { label: "نصائح مهمة", value: "45+", icon: Shield },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="bg-card border-border">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 bg-orange-500/10 rounded-lg">
                    <stat.icon className="w-5 h-5 text-orange-500" />
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
                  <span className="w-6 h-6 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center text-sm font-medium">
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
                <CardHeader className="bg-gradient-to-l from-orange-500/5 to-orange-500/10 border-b border-border">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/10 rounded-lg">
                      <section.icon className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                      <span className="text-xs text-orange-500 font-normal">القسم {i + 1}</span>
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
          <Card className="bg-gradient-to-l from-orange-600 to-orange-800 border-0 text-white">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-4">جاهز للانطلاق؟</h3>
              <p className="text-orange-100 mb-6">
                سجّل شركتك الآن وابدأ باستقبال طلبات النقل
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => navigate("/auth")}
                  className="gap-2"
                >
                  <Truck className="w-5 h-5" />
                  إنشاء حساب ناقل
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/")}
                  className="gap-2 border-white/30 text-white hover:bg-white/10"
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

export default TransporterGuide;
