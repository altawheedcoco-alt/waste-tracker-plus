import { motion } from "framer-motion";
import { 
  Recycle, 
  FileText, 
  Scale, 
  BarChart3, 
  Shield, 
  Users, 
  Clock, 
  CheckCircle2,
  ArrowLeft,
  Factory,
  Bell,
  Award,
  Wallet,
  Leaf
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import GuideToolbar from "@/components/guide/GuideToolbar";

const sections = [
  {
    id: "intro",
    title: "مقدمة عن دور المدور",
    icon: Recycle,
    content: `المدور (مصنع إعادة التدوير) هو المنشأة المسؤولة عن استقبال النفايات ومعالجتها وتحويلها إلى مواد خام قابلة لإعادة الاستخدام.

    دورك كمدور:
    • استقبال النفايات من الناقلين المعتمدين
    • وزن وتصنيف النفايات المستلمة
    • معالجة وإعادة تدوير المواد
    • إصدار شهادات إعادة التدوير
    • الالتزام بمعايير الجودة والبيئة
    
    أنواع النفايات القابلة للتدوير:
    • البلاستيك بأنواعه
    • الورق والكرتون
    • المعادن (حديد، ألومنيوم، نحاس)
    • الزجاج
    • النفايات العضوية
    • النفايات الإلكترونية`,
  },
  {
    id: "registration",
    title: "التسجيل والتراخيص",
    icon: FileText,
    content: `متطلبات التسجيل كمدور:

    📋 المستندات المطلوبة:
    • ترخيص مزاولة نشاط إعادة التدوير
    • شهادة تقييم الأثر البيئي
    • السجل التجاري والبطاقة الضريبية
    • شهادات الجودة (ISO إن وجدت)
    • تراخيص المعدات والآلات
    
    ✅ خطوات التسجيل:
    1. أنشئ حساب واختر "مدور"
    2. أدخل بيانات المصنع والموقع
    3. حدد أنواع النفايات التي تعالجها
    4. ارفع المستندات والتراخيص
    5. انتظر مراجعة وتفعيل الحساب
    
    📍 بيانات الموقع:
    • العنوان التفصيلي للمصنع
    • إحداثيات GPS للموقع
    • ساعات العمل والاستقبال
    • أرقام التواصل`,
  },
  {
    id: "capacity",
    title: "إدارة الطاقة الاستيعابية",
    icon: Factory,
    content: `تحديد وإدارة قدرات المصنع:

    📊 تحديد السعة:
    • السعة اليومية لكل نوع نفايات
    • السعة التخزينية المتاحة
    • معدل المعالجة بالساعة
    
    🔄 إدارة الطاقة:
    • مراقبة الإشغال الحالي
    • جدولة الشحنات الواردة
    • تنبيهات اقتراب السعة القصوى
    
    📅 التخطيط:
    • جدول الصيانة الدورية
    • فترات التوقف المخططة
    • التوسعات المستقبلية
    
    ⚠️ إدارة الفائض:
    • رفض الشحنات عند الامتلاء
    • توجيه الشحنات لمدورين آخرين
    • إشعار الجهات المرتبطة بالحالة`,
  },
  {
    id: "receiving",
    title: "استقبال الشحنات",
    icon: Scale,
    content: `إجراءات استقبال النفايات:

    🚛 الاستلام:
    • التحقق من هوية السائق والشاحنة
    • مطابقة بيانات الشحنة
    • فحص نوع النفايات المستلمة
    
    ⚖️ الوزن:
    • وزن الشاحنة عند الدخول
    • وزن الشاحنة بعد التفريغ
    • تسجيل الوزن الصافي تلقائياً
    
    📋 التوثيق:
    • إصدار إيصال الاستلام
    • توقيع السائق إلكترونياً
    • تصوير الحمولة
    • ربط البيانات بالشحنة
    
    ✅ التأكيد:
    • تحديث حالة الشحنة
    • إشعار المولد بالاستلام
    • إرسال تقرير الوزن`,
  },
  {
    id: "certificates",
    title: "إصدار الشهادات",
    icon: Award,
    content: `نظام شهادات إعادة التدوير:

    📜 أنواع الشهادات:
    • شهادة استلام النفايات
    • شهادة إعادة التدوير
    • شهادة التخلص الآمن
    • شهادة الأثر البيئي
    
    🔐 التوثيق والتحقق:
    • رقم تسلسلي فريد لكل شهادة
    • رمز QR للتحقق الإلكتروني
    • توقيع رقمي معتمد
    • ربط بسجلات الشحنة
    
    📤 الإرسال:
    • إرسال تلقائي للمولد
    • نسخة للناقل
    • أرشفة إلكترونية
    
    📊 التقارير:
    • سجل الشهادات الصادرة
    • إحصائيات إعادة التدوير
    • تقارير الاستدامة`,
  },
  {
    id: "partners",
    title: "إدارة الجهات المرتبطة",
    icon: Users,
    content: `التعامل مع المولدين والناقلين:

    🏭 شراكات المولدين:
    • استقبال طلبات الشراكة
    • مراجعة بيانات المولد
    • الموافقة أو الرفض
    • تحديد شروط التعاقد
    
    🚛 شراكات الناقلين:
    • قائمة الناقلين المعتمدين
    • تقييم أداء الناقلين
    • التنسيق على المواعيد
    
    📋 العقود:
    • إنشاء عقود مخصصة
    • تحديد الأسعار والشروط
    • التوقيع الإلكتروني
    • متابعة صلاحية العقود
    
    💬 التواصل:
    • رسائل مباشرة مع الجهات المرتبطة
    • إشعارات بالتحديثات
    • حل النزاعات`,
  },
  {
    id: "finance",
    title: "الإدارة المالية",
    icon: Wallet,
    content: `نظام الفواتير والحسابات:

    💰 التسعير:
    • تسعير حسب نوع النفايات
    • تسعير حسب الوزن
    • عروض للكميات الكبيرة
    • أسعار خاصة للعقود الطويلة
    
    📄 الفواتير:
    • إصدار فواتير تلقائية
    • فواتير فردية أو مجمعة
    • إرسال إلكتروني للعملاء
    
    💳 التحصيل:
    • متابعة المستحقات
    • تسجيل المدفوعات
    • إشعارات التأخر
    
    📊 التقارير:
    • الإيرادات حسب نوع النفايات
    • تحليل العملاء الأكثر ربحية
    • مصروفات التشغيل
    • هامش الربح`,
  },
  {
    id: "sustainability",
    title: "الاستدامة والبيئة",
    icon: Leaf,
    content: `معايير الاستدامة البيئية:

    🌍 الأثر البيئي:
    • حساب الكربون المُوفَّر
    • كمية المواد المُعاد تدويرها
    • تقليل النفايات للمدافن
    
    📈 مؤشرات الأداء:
    • نسبة إعادة التدوير
    • كفاءة استخدام الطاقة
    • تقليل الانبعاثات
    
    🏆 الشهادات البيئية:
    • شهادات ISO 14001
    • شهادات الاستدامة
    • جوائز البيئة
    
    📋 التقارير البيئية:
    • تقرير الاستدامة السنوي
    • تقارير جهاز شؤون البيئة
    • بيانات البصمة الكربونية
    
    ✅ الامتثال:
    • معايير وزارة البيئة
    • المعايير الدولية
    • التدقيق البيئي الدوري`,
  },
];

const RecyclerGuide = () => {
  const navigate = useNavigate();

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
              <Recycle className="w-12 h-12" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">دليل المدور</h1>
              <p className="text-primary-foreground/70 mt-2">
                دليلك الشامل لاستخدام منصة آي ريسايكل كمصنع إعادة تدوير
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <GuideToolbar 
        sections={toolbarSections} 
        guideTitle="دليل المدور" 
        primaryColor="green"
      />

      {/* Quick Stats */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "أقسام الدليل", value: "8", icon: FileText },
            { label: "دقائق القراءة", value: "20", icon: Clock },
            { label: "خطوات عملية", value: "35+", icon: CheckCircle2 },
            { label: "نصائح مهمة", value: "50+", icon: Shield },
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
              <h3 className="text-2xl font-bold mb-4">ابدأ رحلة الاستدامة</h3>
              <p className="text-primary-foreground/70 mb-6">
                سجّل مصنعك الآن وانضم لشبكة إعادة التدوير المتكاملة
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => navigate("/auth")}
                  className="gap-2"
                >
                  <Recycle className="w-5 h-5" />
                  إنشاء حساب مدور
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

export default RecyclerGuide;
