import { motion } from "framer-motion";
import { 
  User, 
  FileText, 
  MapPin, 
  Smartphone, 
  Shield, 
  Navigation, 
  Clock, 
  CheckCircle2,
  ArrowLeft,
  Truck,
  Camera,
  Bell,
  Wallet,
  Award
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import GuideToolbar from "@/components/guide/GuideToolbar";

const sections = [
  {
    id: "intro",
    title: "مقدمة عن دور السائق",
    icon: User,
    content: `السائق هو الحلقة الأساسية في سلسلة نقل النفايات، وهو المسؤول عن تنفيذ عمليات الاستلام والتسليم بشكل آمن ودقيق.

    مهامك كسائق:
    • استلام الشحنات من المولدين
    • نقل النفايات بأمان للمدور
    • توثيق عمليات الاستلام والتسليم
    • الالتزام بمسارات النقل المحددة
    • الإبلاغ عن أي مشاكل أو حوادث
    
    مميزات العمل على المنصة:
    • استلام المهام إلكترونياً
    • نظام ملاحة متكامل
    • توثيق سهل وسريع
    • تتبع الأداء والحوافز
    • دعم فني متواصل`,
  },
  {
    id: "registration",
    title: "التسجيل والتفعيل",
    icon: FileText,
    content: `كيفية التسجيل كسائق:

    📋 المستندات المطلوبة:
    • رخصة قيادة سارية (ثقيل أو نقل)
    • البطاقة الشخصية
    • شهادة تدريب نقل النفايات (إن وجدت)
    • صورة شخصية حديثة
    
    ✅ خطوات التسجيل:
    1. احصل على دعوة من شركة النقل
    2. حمّل تطبيق آي ريسايكل
    3. أدخل رمز التفعيل
    4. أكمل بياناتك الشخصية
    5. ارفع المستندات المطلوبة
    6. انتظر موافقة الشركة
    
    📱 تفعيل الحساب:
    • ستصلك رسالة تأكيد
    • سجّل دخولك بالبريد وكلمة المرور
    • ستظهر لك لوحة تحكم السائق`,
  },
  {
    id: "app",
    title: "استخدام التطبيق",
    icon: Smartphone,
    content: `دليل استخدام تطبيق السائق:

    🏠 الشاشة الرئيسية:
    • المهام الحالية والقادمة
    • حالتك (متاح/مشغول/غير متاح)
    • إحصائيات اليوم
    • الإشعارات الجديدة
    
    📋 قائمة المهام:
    • الشحنات المعلقة
    • الشحنات قيد التنفيذ
    • الشحنات المكتملة
    • تفاصيل كل شحنة
    
    ⚙️ الإعدادات:
    • تحديث البيانات الشخصية
    • إعدادات الإشعارات
    • تغيير اللغة
    • الدعم الفني
    
    📊 التقارير:
    • سجل الشحنات
    • الأداء الشهري
    • الحوافز المكتسبة`,
  },
  {
    id: "tasks",
    title: "تنفيذ المهام",
    icon: CheckCircle2,
    content: `خطوات تنفيذ مهمة النقل:

    📥 استلام المهمة:
    • إشعار بمهمة جديدة
    • مراجعة التفاصيل (العنوان، النوع، الكمية)
    • قبول أو رفض المهمة
    • تحديد وقت الانطلاق
    
    🚛 التوجه للموقع:
    • ابدأ الملاحة للمولد
    • اتبع المسار المحدد
    • أبلغ عند الوصول
    
    📦 الاستلام:
    • تحقق من نوع النفايات
    • تأكد من الكمية المتوقعة
    • صوّر الحمولة
    • احصل على توقيع المولد
    
    🎯 التسليم:
    • توجه لموقع المدور
    • أبلغ عند الوصول
    • انتظر عملية الوزن
    • احصل على إيصال التسليم`,
  },
  {
    id: "navigation",
    title: "الملاحة والتتبع",
    icon: Navigation,
    content: `نظام الملاحة المدمج:

    🗺️ خريطة تفاعلية:
    • موقعك الحالي
    • نقطة الاستلام (المولد)
    • نقطة التسليم (المدور)
    • المسار المقترح
    
    🧭 توجيهات الملاحة:
    • إرشادات صوتية
    • تحديث المسار لحظياً
    • تجنب الازدحام
    • وقت الوصول المتوقع
    
    📍 التتبع اللحظي:
    • موقعك مرئي للشركة
    • موقعك مرئي للمولد والمدور
    • تحديث كل 30 ثانية
    
    🔗 تطبيقات خارجية:
    • فتح في Google Maps
    • فتح في Waze
    • مشاركة الموقع`,
  },
  {
    id: "documentation",
    title: "التوثيق والإثبات",
    icon: Camera,
    content: `توثيق عمليات النقل:

    📸 التصوير:
    • صور الحمولة عند الاستلام
    • صور الحمولة عند التسليم
    • صور أي مشاكل أو أضرار
    • صور واضحة ومضاءة جيداً
    
    ✍️ التوقيع الإلكتروني:
    • توقيع المولد عند الاستلام
    • توقيع المدور عند التسليم
    • توقيعك كسائق
    
    📋 البيانات المطلوبة:
    • الوزن التقديري/الفعلي
    • نوع النفايات
    • ملاحظات خاصة
    • وقت كل عملية
    
    📤 الإرسال:
    • ترسل البيانات تلقائياً
    • تُحفظ نسخة على جهازك
    • يمكن الوصول لها لاحقاً`,
  },
  {
    id: "safety",
    title: "السلامة والأمان",
    icon: Shield,
    content: `إرشادات السلامة للسائق:

    🦺 معدات السلامة:
    • ارتدِ القفازات دائماً
    • استخدم حذاء السلامة
    • احمل كمامة للروائح
    • استخدم نظارات الحماية عند الحاجة
    
    🚛 سلامة المركبة:
    • تأكد من تغطية الحمولة
    • افحص الإطارات والفرامل
    • تأكد من إغلاق الأبواب
    • لا تحمّل أكثر من السعة
    
    ⚠️ حالات الطوارئ:
    • أرقام الطوارئ متاحة بالتطبيق
    • زر الإبلاغ السريع
    • التواصل مع الشركة
    • إجراءات الحوادث
    
    🚫 ممنوعات:
    • لا تخلط أنواع النفايات
    • لا تفتح العبوات المغلقة
    • لا تتوقف في أماكن غير مصرح بها`,
  },
  {
    id: "rewards",
    title: "الحوافز والمكافآت",
    icon: Award,
    content: `نظام المكافآت للسائقين:

    ⭐ تقييم الأداء:
    • الالتزام بالمواعيد
    • جودة التوثيق
    • تقييمات العملاء
    • عدم المخالفات
    
    💰 الحوافز:
    • مكافأة الشحنة الإضافية
    • مكافأة التقييم الممتاز
    • مكافأة الشهر بدون تأخير
    • مكافأة التوثيق الكامل
    
    🏆 المستويات:
    • سائق مبتدئ
    • سائق متميز
    • سائق خبير
    • سائق نخبة
    
    📊 لوحة المتصدرين:
    • ترتيبك بين السائقين
    • أفضل سائق الأسبوع
    • أفضل سائق الشهر
    • جوائز خاصة`,
  },
];

const DriverGuide = () => {
  const navigate = useNavigate();

  const toolbarSections = sections.map(s => ({
    id: s.id,
    title: s.title,
    content: s.content,
  }));

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-l from-purple-600 to-purple-800 text-white">
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
              <User className="w-12 h-12" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">دليل السائق</h1>
              <p className="text-purple-100 mt-2">
                دليلك الشامل لاستخدام تطبيق آي ريسايكل للسائقين
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <GuideToolbar 
        sections={toolbarSections} 
        guideTitle="دليل السائق" 
        primaryColor="purple"
      />

      {/* Quick Stats */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "أقسام الدليل", value: "8", icon: FileText },
            { label: "دقائق القراءة", value: "12", icon: Clock },
            { label: "خطوات عملية", value: "20+", icon: CheckCircle2 },
            { label: "نصائح مهمة", value: "35+", icon: Shield },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="bg-card border-border">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <stat.icon className="w-5 h-5 text-purple-500" />
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
                  <span className="w-6 h-6 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center text-sm font-medium">
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
                <CardHeader className="bg-gradient-to-l from-purple-500/5 to-purple-500/10 border-b border-border">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                      <section.icon className="w-6 h-6 text-purple-500" />
                    </div>
                    <div>
                      <span className="text-xs text-purple-500 font-normal">القسم {i + 1}</span>
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
          <Card className="bg-gradient-to-l from-purple-600 to-purple-800 border-0 text-white">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-4">انضم لفريق السائقين</h3>
              <p className="text-purple-100 mb-6">
                تواصل مع شركة نقل واحصل على دعوة للانضمام
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => navigate("/auth")}
                  className="gap-2"
                >
                  <User className="w-5 h-5" />
                  تسجيل الدخول
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

export default DriverGuide;
