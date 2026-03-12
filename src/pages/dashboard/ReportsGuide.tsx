import { motion } from 'framer-motion';
import { 
  FileText, 
  Truck, 
  ClipboardList, 
  CalendarClock, 
  BookOpen,
  AlertTriangle,
  Leaf,
  ArrowLeft,
  CheckCircle2,
  Users,
  Building2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { useDisplayMode } from '@/hooks/useDisplayMode';
import { cn } from '@/lib/utils';

interface GuideSection {
  id: string;
  title: string;
  titleEn: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  purpose: string;
  users: string[];
  features: string[];
  example: string;
}

const sections: GuideSection[] = [
  {
    id: 'reports',
    title: 'التقارير',
    titleEn: 'Reports',
    icon: <FileText className="w-6 h-6" />,
    color: 'bg-blue-500',
    description: 'تقارير تحليلية شاملة تعرض إحصائيات وبيانات الأداء العام للمنشأة.',
    purpose: 'مراقبة الأداء واتخاذ القرارات الإدارية بناءً على البيانات التاريخية والتحليلات.',
    users: ['مدير المنشأة', 'الإدارة العليا', 'قسم التحليل'],
    features: [
      'رسوم بيانية وإحصائيات',
      'مقارنات زمنية (شهرية/سنوية)',
      'مؤشرات الأداء الرئيسية KPIs',
      'تصدير PDF للاجتماعات'
    ],
    example: 'تقرير أداء الربع الأول يوضح إجمالي الشحنات ونسبة النمو مقارنة بالعام السابق.'
  },
  {
    id: 'shipment-reports',
    title: 'تقارير الشحنات',
    titleEn: 'Shipment Reports',
    icon: <Truck className="w-6 h-6" />,
    color: 'bg-emerald-500',
    description: 'تقارير تفصيلية لكل شحنة على حدة تتضمن بيانات النقل والتسليم.',
    purpose: 'توثيق كل شحنة بشكل منفصل للرجوع إليها عند الحاجة أو لأغراض المراجعة.',
    users: ['مسؤول الشحنات', 'السائقين', 'المستلمين'],
    features: [
      'تفاصيل الشحنة الكاملة',
      'مسار التتبع والحالات',
      'بيانات المولد والناقل والمعالج',
      'طباعة إيصال التسليم'
    ],
    example: 'تقرير الشحنة SHP-2025-0042 يوضح نوع المخلفات والكمية وتاريخ النقل والتسليم.'
  },
  {
    id: 'aggregate-reports',
    title: 'التقرير المجمع',
    titleEn: 'Aggregate Report',
    icon: <ClipboardList className="w-6 h-6" />,
    color: 'bg-purple-500',
    description: 'تقرير شامل يجمع عدة شحنات في مستند واحد للتحليل والمراقبة.',
    purpose: 'إنشاء تقرير رسمي موحد لمجموعة شحنات (مثلاً: كل شحنات شهر معين أو نوع مخلفات محدد).',
    users: ['الإدارة', 'جهة إعادة التدوير', 'الجهات الرقابية'],
    features: [
      'تجميع شحنات متعددة',
      'فلترة حسب التاريخ والنوع',
      'عدادات الكميات الإجمالية',
      'مستند رسمي بالختم والتوقيع'
    ],
    example: 'تقرير مجمع لجميع شحنات البلاستيك في يناير 2025 (15 شحنة بإجمالي 2.5 طن).'
  },
  {
    id: 'operational-plans',
    title: 'الخطط التشغيلية',
    titleEn: 'Operational Plans',
    icon: <CalendarClock className="w-6 h-6" />,
    color: 'bg-amber-500',
    description: 'خطط عمل مستقبلية تحدد جداول ومواعيد جمع المخلفات بشكل دوري.',
    purpose: 'التخطيط المسبق لعمليات الجمع والنقل وتنسيق المواعيد مع الجهات المرتبطة.',
    users: ['مدير العمليات', 'الناقلين', 'المولدين'],
    features: [
      'جدولة مواعيد الجمع',
      'تحديد التكرار (يومي/أسبوعي/شهري)',
      'تقدير الكميات المتوقعة',
      'موافقة الإدارة'
    ],
    example: 'خطة جمع أسبوعية من مصنع ABC كل يوم أحد بكمية تقديرية 500 كجم بلاستيك.'
  },
  {
    id: 'hazardous-register',
    title: 'سجل المخلفات الخطرة',
    titleEn: 'Hazardous Waste Register',
    icon: <AlertTriangle className="w-6 h-6" />,
    color: 'bg-red-500',
    description: 'سجل رسمي موثق لجميع المخلفات الخطرة وفقاً للوائح البيئية.',
    purpose: 'الالتزام بالمتطلبات القانونية وتتبع المخلفات الخطرة من المصدر للمعالجة.',
    users: ['مسؤول البيئة', 'الجهات الرقابية', 'إدارة المخاطر'],
    features: [
      'تصنيف حسب درجة الخطورة',
      'رموز المخلفات الدولية',
      'تتبع سلسلة الحيازة',
      'تقارير إلزامية للجهات'
    ],
    example: 'سجل مخلفات كيميائية فئة A تم نقلها للمعالجة بتاريخ 15/01/2025.'
  },
  {
    id: 'non-hazardous-register',
    title: 'سجل المخلفات غير الخطرة',
    titleEn: 'Non-Hazardous Waste Register',
    icon: <Leaf className="w-6 h-6" />,
    color: 'bg-green-500',
    description: 'سجل للمخلفات العادية القابلة لإعادة التدوير أو المعالجة الآمنة.',
    purpose: 'توثيق المخلفات العادية وتتبع عمليات إعادة التدوير والاستفادة منها.',
    users: ['مسؤول التدوير', 'قسم الاستدامة', 'المحاسبة'],
    features: [
      'تصنيف حسب النوع (بلاستيك/ورق/معادن)',
      'كميات قابلة للتدوير',
      'قيمة المواد المستردة',
      'إحصائيات الاستدامة'
    ],
    example: 'سجل ورق مكتبي: 200 كجم تم تحويلها لإعادة التدوير في فبراير 2025.'
  }
];

const ReportsGuide = () => {
  const { isMobile } = useDisplayMode();

  return (
    <DashboardLayout>
      <div className={cn("max-w-5xl mx-auto", isMobile ? "p-4" : "p-6")}>
        <BackButton />
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className={cn("font-bold", isMobile ? "text-xl" : "text-2xl")}>
                دليل التقارير والسجلات
              </h1>
              <p className="text-muted-foreground text-sm">
                تعرف على الفرق بين كل نوع من التقارير والسجلات في النظام
              </p>
            </div>
          </div>
        </motion.div>

        {/* Quick Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">مقارنة سريعة</CardTitle>
              <CardDescription>نظرة عامة على الفروقات الأساسية</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-3 px-2 text-right font-medium">القسم</th>
                      <th className="py-3 px-2 text-right font-medium">الغرض الرئيسي</th>
                      <th className="py-3 px-2 text-right font-medium">المستخدم الأساسي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sections.map((section) => (
                      <tr key={section.id} className="border-b last:border-0">
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white", section.color)}>
                              {section.icon}
                            </div>
                            <span className="font-medium">{section.title}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-muted-foreground">{section.purpose.slice(0, 50)}...</td>
                        <td className="py-3 px-2">
                          <Badge variant="secondary">{section.users[0]}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Detailed Sections */}
        <div className="space-y-6">
          {sections.map((section, index) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + index * 0.05 }}
            >
              <Card className="overflow-hidden">
                <div className={cn("h-2", section.color)} />
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white", section.color)}>
                        {section.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{section.title}</CardTitle>
                        <CardDescription className="text-xs">{section.titleEn}</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Description */}
                  <div>
                    <p className="text-foreground leading-relaxed">{section.description}</p>
                  </div>

                  <Separator />

                  {/* Purpose */}
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      الغرض الأساسي
                    </h4>
                    <p className="text-muted-foreground text-sm">{section.purpose}</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Users */}
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="font-medium mb-2 flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-primary" />
                        المستخدمون
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {section.users.map((user, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {user}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Features */}
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="font-medium mb-2 flex items-center gap-2 text-sm">
                        <Building2 className="w-4 h-4 text-primary" />
                        الميزات الرئيسية
                      </h4>
                      <ul className="space-y-1">
                        {section.features.map((feature, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <div className="w-1 h-1 rounded-full bg-primary" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Example */}
                  <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
                    <h4 className="font-medium mb-1 text-sm text-primary">مثال عملي</h4>
                    <p className="text-sm text-muted-foreground">{section.example}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Summary Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 p-4 bg-muted/50 rounded-lg border"
        >
          <h3 className="font-semibold mb-2">ملخص الفروقات</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold">•</span>
              <span><strong>التقارير:</strong> إحصائيات وتحليلات عامة للأداء</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold">•</span>
              <span><strong>تقارير الشحنات:</strong> تفاصيل شحنة واحدة محددة</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-500 font-bold">•</span>
              <span><strong>التقرير المجمع:</strong> دمج عدة شحنات في مستند رسمي واحد</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 font-bold">•</span>
              <span><strong>الخطط التشغيلية:</strong> جدولة وتنسيق مستقبلي لعمليات الجمع</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold">•</span>
              <span><strong>سجل المخلفات الخطرة:</strong> توثيق إلزامي للمواد الخطرة</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">•</span>
              <span><strong>سجل المخلفات غير الخطرة:</strong> توثيق المواد القابلة للتدوير</span>
            </li>
          </ul>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default ReportsGuide;
