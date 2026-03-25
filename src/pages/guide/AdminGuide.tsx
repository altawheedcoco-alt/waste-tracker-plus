import { motion } from "framer-motion";
import { 
  Shield, 
  FileText, 
  Users, 
  BarChart3, 
  Settings, 
  Building2, 
  Clock, 
  CheckCircle2,
  ArrowLeft,
  UserCheck,
  Bell,
  Database,
  Lock,
  AlertTriangle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import GuideToolbar from "@/components/guide/GuideToolbar";

const sections = [
  {
    id: "intro",
    title: "مقدمة عن دور مدير النظام",
    icon: Shield,
    content: `مدير النظام هو المسؤول الأعلى عن إدارة منصة آي ريسايكل، ويملك صلاحيات كاملة للتحكم في جميع جوانب المنظومة.

    مسؤولياتك كمدير النظام:
    • مراجعة واعتماد طلبات تسجيل الشركات الجديدة
    • إدارة حسابات المستخدمين والصلاحيات
    • مراقبة أداء المنظومة وإحصائياتها
    • التعامل مع طلبات الدعم والشكاوى
    • ضمان الامتثال للمعايير البيئية
    • إدارة إعدادات المنصة العامة
    
    صلاحياتك:
    • الوصول الكامل لجميع البيانات
    • تعديل حالة أي شحنة أو عقد
    • إيقاف أو تفعيل أي حساب
    • إصدار التقارير الإدارية
    • تعديل إعدادات النظام`,
  },
  {
    id: "companies",
    title: "إدارة الشركات",
    icon: Building2,
    content: `إدارة الشركات المسجلة على المنصة:

    📋 طلبات التسجيل الجديدة:
    • مراجعة بيانات الشركة
    • التحقق من المستندات المرفوعة
    • مراجعة التراخيص والشهادات
    • الموافقة أو الرفض مع التوضيح
    
    🏢 إدارة الشركات المفعلة:
    • عرض قائمة جميع الشركات
    • فلترة حسب النوع (مولد/ناقل/مدور)
    • البحث بالاسم أو السجل التجاري
    • عرض تفاصيل كل شركة
    
    ⚙️ إجراءات الإدارة:
    • تعديل بيانات الشركة
    • إيقاف حساب مؤقتاً
    • إلغاء تفعيل الحساب
    • إعادة تفعيل حساب موقوف
    
    📊 إحصائيات الشركات:
    • عدد الشركات حسب النوع
    • الشركات الأكثر نشاطاً
    • الشركات الجديدة هذا الشهر`,
  },
  {
    id: "users",
    title: "إدارة المستخدمين",
    icon: Users,
    content: `إدارة حسابات المستخدمين:

    👤 قائمة المستخدمين:
    • جميع المستخدمين المسجلين
    • فلترة حسب الدور والشركة
    • البحث بالاسم أو البريد
    • حالة الحساب (نشط/موقوف)
    
    ✅ اعتماد السائقين:
    • مراجعة طلبات السائقين الجدد
    • التحقق من رخص القيادة
    • الموافقة أو الرفض
    
    🔐 إدارة الصلاحيات:
    • تعديل صلاحيات المستخدم
    • منح صلاحيات إضافية
    • سحب صلاحيات
    
    🔑 إعادة تعيين كلمات المرور:
    • إرسال رابط إعادة التعيين
    • إعادة تعيين مباشر (حالات خاصة)
    • تتبع محاولات تسجيل الدخول`,
  },
  {
    id: "approvals",
    title: "الموافقات والطلبات",
    icon: UserCheck,
    content: `نظام الموافقات المركزي:

    📥 أنواع الطلبات:
    • طلبات تسجيل شركات جديدة
    • طلبات اعتماد سائقين
    • طلبات تعديل بيانات
    • طلبات دعم فني
    • طلبات تقارير خاصة
    
    📋 إدارة الطلبات:
    • قائمة الطلبات المعلقة
    • ترتيب حسب الأولوية
    • تعيين طلب لمسؤول معين
    • تتبع حالة الطلب
    
    ✅ اتخاذ الإجراءات:
    • الموافقة مع التعليق
    • الرفض مع توضيح السبب
    • طلب مستندات إضافية
    • تحويل لمسؤول آخر
    
    📊 إحصائيات الطلبات:
    • متوسط وقت الاستجابة
    • نسبة القبول/الرفض
    • الطلبات حسب النوع`,
  },
  {
    id: "monitoring",
    title: "المراقبة والتتبع",
    icon: BarChart3,
    content: `مراقبة أداء المنظومة:

    📊 لوحة المعلومات:
    • إحصائيات لحظية للنظام
    • عدد الشحنات النشطة
    • عدد المستخدمين المتصلين
    • التنبيهات العاجلة
    
    🗺️ خريطة التتبع:
    • مواقع جميع الشاحنات
    • حالة كل شحنة على الخريطة
    • تتبع مسارات النقل
    
    📈 تقارير الأداء:
    • إجمالي الشحنات الشهرية
    • كميات النفايات المعالجة
    • أداء كل شركة
    • مقارنة بين الفترات
    
    ⚠️ التنبيهات:
    • شحنات متأخرة
    • مشاكل في التسليم
    • شكاوى العملاء
    • أخطاء النظام`,
  },
  {
    id: "documents",
    title: "التحقق من الوثائق",
    icon: FileText,
    content: `نظام التحقق من المستندات:

    📄 أنواع الوثائق:
    • السجلات التجارية
    • تراخيص مزاولة النشاط
    • رخص المركبات
    • رخص القيادة
    • شهادات التأمين
    
    🔍 عملية التحقق:
    • مراجعة الوثيقة المرفوعة
    • التحقق من الصلاحية
    • مطابقة البيانات
    • تحليل AI للوثائق
    
    ✅ حالات التحقق:
    • قيد المراجعة
    • معتمد
    • مرفوض (مع السبب)
    • منتهي الصلاحية
    
    🔔 التنبيهات:
    • وثائق تنتهي قريباً
    • وثائق منتهية
    • وثائق تحتاج تجديد`,
  },
  {
    id: "security",
    title: "الأمان والخصوصية",
    icon: Lock,
    content: `إدارة أمان المنصة:

    🔐 إدارة الوصول:
    • سجل تسجيلات الدخول
    • محاولات الدخول الفاشلة
    • الأجهزة المستخدمة
    • المواقع الجغرافية
    
    🛡️ حماية البيانات:
    • تشفير البيانات الحساسة
    • النسخ الاحتياطي التلقائي
    • استعادة البيانات
    
    📋 سجل الأنشطة:
    • جميع العمليات على النظام
    • من قام بماذا ومتى
    • تتبع التعديلات
    • تقارير التدقيق
    
    ⚠️ التنبيهات الأمنية:
    • نشاط مشبوه
    • محاولات اختراق
    • تغييرات غير معتادة`,
  },
  {
    id: "settings",
    title: "إعدادات النظام",
    icon: Settings,
    content: `تكوين إعدادات المنصة:

    ⚙️ الإعدادات العامة:
    • اسم المنصة والشعار
    • معلومات التواصل
    • الشروط والأحكام
    • سياسة الخصوصية
    
    📧 إعدادات الإشعارات:
    • قوالب البريد الإلكتروني
    • إعدادات الرسائل النصية
    • أنواع الإشعارات
    
    💰 إعدادات مالية:
    • العملة الافتراضية
    • الضرائب والرسوم
    • طرق الدفع المتاحة
    
    🔧 إعدادات متقدمة:
    • حدود الاستخدام
    • إعدادات API
    • صيانة النظام
    • تحديثات المنصة
    
    📊 التقارير الإدارية:
    • تقرير النظام الشامل
    • تقرير الأداء الشهري
    • تقرير الامتثال البيئي`,
  },
];

const AdminGuide = () => {
  const navigate = useNavigate();

  const toolbarSections = sections.map(s => ({
    id: s.id,
    title: s.title,
    content: s.content,
  }));

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-l from-red-600 to-red-800 text-white">
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
              <Shield className="w-12 h-12" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">دليل مدير النظام</h1>
              <p className="text-red-100 mt-2">
                دليلك الشامل لإدارة منصة آي ريسايكل والتحكم الكامل بالمنظومة
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <GuideToolbar 
        sections={toolbarSections} 
        guideTitle="دليل مدير النظام" 
        primaryColor="red"
      />

      {/* Quick Stats */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "أقسام الدليل", value: "8", icon: FileText },
            { label: "دقائق القراءة", value: "25", icon: Clock },
            { label: "صلاحيات إدارية", value: "50+", icon: CheckCircle2 },
            { label: "أدوات تحكم", value: "30+", icon: Settings },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="bg-card border-border">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 bg-red-500/10 rounded-lg">
                    <stat.icon className="w-5 h-5 text-red-500" />
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
                  <span className="w-6 h-6 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center text-sm font-medium">
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
                <CardHeader className="bg-gradient-to-l from-red-500/5 to-red-500/10 border-b border-border">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-red-500/10 rounded-lg">
                      <section.icon className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                      <span className="text-xs text-red-500 font-normal">القسم {i + 1}</span>
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
          <Card className="bg-gradient-to-l from-red-600 to-red-800 border-0 text-white">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-4">إدارة فعّالة ومتكاملة</h3>
              <p className="text-red-100 mb-6">
                تحكم كامل في منظومة إدارة النفايات مع أدوات متقدمة للمراقبة والتحليل
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => navigate("/dashboard")}
                  className="gap-2"
                >
                  <Shield className="w-5 h-5" />
                  الدخول للوحة التحكم
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

export default AdminGuide;
