import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Brain,
  Rocket,
  Target,
  TrendingUp,
  Zap,
  Globe,
  Shield,
  Smartphone,
  Server,
  GitBranch,
  Layers,
  Gauge,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Code2,
  Database,
  Cloud,
  Lock,
  Users,
  BarChart3,
  Cpu,
  Workflow,
  Copy,
  Wand2,
} from 'lucide-react';

// Helper function to copy development request to clipboard
const copyDevelopmentRequest = (item: string) => {
  const request = `طوّر: ${item}`;
  navigator.clipboard.writeText(request);
  toast.success('تم نسخ طلب التطوير', {
    description: 'الصقه في المحادثة لبدء التطوير',
  });
};

interface DevelopmentPhase {
  id: string;
  name: string;
  description: string;
  progress: number;
  status: 'completed' | 'in_progress' | 'planned';
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedWeeks: number;
  items: string[];
}

interface TechnicalRecommendation {
  category: string;
  icon: React.ElementType;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  items: string[];
}

const developmentPhases: DevelopmentPhase[] = [
  {
    id: 'phase-1',
    name: 'المرحلة الأولى: تحسين الأداء',
    description: 'تحسين سرعة التحميل وأداء التطبيق',
    progress: 100,
    status: 'completed',
    priority: 'critical',
    estimatedWeeks: 3,
    items: [
      'Lazy Loading للمكونات الثقيلة',
      'تحسين حجم Bundle وتقسيمه',
      'تخزين مؤقت ذكي للبيانات (React Query)',
      'تحسين استعلامات قاعدة البيانات',
      'ضغط الصور والأصول',
    ],
  },
  {
    id: 'phase-2',
    name: 'المرحلة الثانية: تطبيق الموبايل',
    description: 'تحويل المنصة لتطبيق موبايل متكامل',
    progress: 75,
    status: 'in_progress',
    priority: 'high',
    estimatedWeeks: 6,
    items: [
      'PWA مع التثبيت على الجهاز ✓',
      'Push Notifications للموبايل ✓',
      'وضع عدم الاتصال (Offline Mode)',
      'تحسين تجربة اللمس',
      'اختصارات الشاشة الرئيسية',
    ],
  },
  {
    id: 'phase-3',
    name: 'المرحلة الثالثة: الأمان المتقدم',
    description: 'تعزيز الأمان والامتثال للمعايير',
    progress: 65,
    status: 'in_progress',
    priority: 'high',
    estimatedWeeks: 4,
    items: [
      'المصادقة الثنائية (2FA)',
      'تشفير البيانات الحساسة',
      'تقارير الأمان والتدقيق',
      'الامتثال لـ GDPR',
      'اختبارات الاختراق',
    ],
  },
  {
    id: 'phase-4',
    name: 'المرحلة الرابعة: الذكاء الاصطناعي',
    description: 'توسيع قدرات AI والأتمتة',
    progress: 80,
    status: 'in_progress',
    priority: 'medium',
    estimatedWeeks: 5,
    items: [
      'تحسين دقة استخراج البيانات ✓',
      'التنبؤ بأوقات التسليم',
      'توصيات المسارات الذكية',
      'تحليل المشاعر للدعم الفني',
      'Chatbot ذكي للمساعدة التلقائية',
    ],
  },
  {
    id: 'phase-5',
    name: 'المرحلة الخامسة: التوسع الإقليمي',
    description: 'التحضير للتوسع خارج مصر',
    progress: 20,
    status: 'planned',
    priority: 'medium',
    estimatedWeeks: 8,
    items: [
      'دعم اللغة الإنجليزية بالكامل',
      'تكييف للأنظمة القانونية المختلفة',
      'دعم عملات متعددة',
      'خوادم إقليمية (CDN)',
      'شراكات مع جهات خليجية',
    ],
  },
];

const technicalRecommendations: TechnicalRecommendation[] = [
  {
    category: 'architecture',
    icon: Layers,
    title: 'تحسين البنية المعمارية',
    description: 'إعادة هيكلة بعض المكونات لتحسين قابلية الصيانة',
    impact: 'high',
    effort: 'medium',
    items: [
      'تقسيم الملفات الكبيرة (>500 سطر) إلى مكونات أصغر',
      'استخدام Compound Components للمكونات المعقدة',
      'تحسين إدارة الحالة باستخدام Context مُحسّن',
      'تطبيق Repository Pattern للتعامل مع البيانات',
    ],
  },
  {
    category: 'database',
    icon: Database,
    title: 'تحسينات قاعدة البيانات',
    description: 'تحسين الأداء والأمان على مستوى البيانات',
    impact: 'high',
    effort: 'medium',
    items: [
      'إضافة فهارس مركبة للاستعلامات المتكررة',
      'تحسين سياسات RLS للأداء',
      'تطبيق Materialized Views للتقارير',
      'أرشفة البيانات القديمة تلقائياً',
    ],
  },
  {
    category: 'security',
    icon: Shield,
    title: 'تعزيز الأمان',
    description: 'طبقات حماية إضافية للنظام',
    impact: 'high',
    effort: 'high',
    items: [
      'تفعيل المصادقة الثنائية (TOTP)',
      'Rate Limiting للـ APIs',
      'تسجيل ومراقبة الأحداث الأمنية',
      'فحص أمني دوري آلي',
    ],
  },
  {
    category: 'performance',
    icon: Gauge,
    title: 'تحسين الأداء',
    description: 'تسريع التحميل وتقليل استهلاك الموارد',
    impact: 'medium',
    effort: 'medium',
    items: [
      'تطبيق Virtual Scrolling للقوائم الطويلة',
      'Prefetching للصفحات المتوقعة',
      'تحسين re-renders باستخدام memo',
      'استخدام Web Workers للعمليات الثقيلة',
    ],
  },
  {
    category: 'testing',
    icon: Code2,
    title: 'تغطية الاختبارات',
    description: 'زيادة موثوقية الكود عبر الاختبارات',
    impact: 'medium',
    effort: 'high',
    items: [
      'اختبارات وحدة للوظائف الحساسة',
      'اختبارات تكامل للـ APIs',
      'اختبارات E2E للسيناريوهات الحرجة',
      'اختبارات الأداء والحمل',
    ],
  },
  {
    category: 'devops',
    icon: GitBranch,
    title: 'تحسين DevOps',
    description: 'أتمتة عمليات النشر والمراقبة',
    impact: 'medium',
    effort: 'medium',
    items: [
      'CI/CD متكامل مع اختبارات تلقائية',
      'مراقبة الأداء (APM)',
      'تنبيهات الأخطاء الفورية',
      'نسخ احتياطي تلقائي',
    ],
  },
];

const architectureStrengths = [
  { icon: Code2, text: 'React 18 مع TypeScript للـ Type Safety', status: 'excellent' },
  { icon: Database, text: 'Supabase Backend مع RLS للأمان', status: 'excellent' },
  { icon: Layers, text: 'Tailwind CSS للتصميم المتجاوب', status: 'excellent' },
  { icon: Zap, text: 'React Query للـ Caching الذكي', status: 'excellent' },
  { icon: Workflow, text: 'Framer Motion للأنيميشن السلس', status: 'good' },
  { icon: Cloud, text: 'Edge Functions للمنطق الخلفي', status: 'good' },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-green-500/10 text-green-700 border-green-200';
    case 'in_progress': return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
    case 'planned': return 'bg-blue-500/10 text-blue-700 border-blue-200';
    default: return 'bg-muted';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'critical': return 'bg-red-500/10 text-red-700';
    case 'high': return 'bg-orange-500/10 text-orange-700';
    case 'medium': return 'bg-yellow-500/10 text-yellow-700';
    case 'low': return 'bg-green-500/10 text-green-700';
    default: return 'bg-muted';
  }
};

const getImpactColor = (impact: string) => {
  switch (impact) {
    case 'high': return 'text-green-600';
    case 'medium': return 'text-yellow-600';
    case 'low': return 'text-muted-foreground';
    default: return 'text-muted-foreground';
  }
};

const EngineerVisionSection = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('roadmap');

  const overallProgress = Math.round(
    developmentPhases.reduce((acc, phase) => acc + phase.progress, 0) / developmentPhases.length
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-br from-primary/5 via-primary/10 to-secondary/5 border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary/60 text-white">
              <Brain className="w-8 h-8" />
            </div>
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                رؤية المهندس القائم على المشروع
                <Badge variant="outline" className="bg-primary/10">
                  <Cpu className="w-3 h-3 ml-1" />
                  Technical Vision
                </Badge>
              </CardTitle>
              <CardDescription className="mt-1">
                تحليل تقني شامل وخارطة طريق للتطوير المستقبلي بناءً على دراسة معمقة للمنظومة
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-background/50 rounded-lg">
              <div className="text-3xl font-bold text-primary">{overallProgress}%</div>
              <div className="text-sm text-muted-foreground">التقدم الإجمالي</div>
            </div>
            <div className="text-center p-4 bg-background/50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">
                {developmentPhases.filter(p => p.status === 'completed').length}
              </div>
              <div className="text-sm text-muted-foreground">مراحل مكتملة</div>
            </div>
            <div className="text-center p-4 bg-background/50 rounded-lg">
              <div className="text-3xl font-bold text-yellow-600">
                {developmentPhases.filter(p => p.status === 'in_progress').length}
              </div>
              <div className="text-sm text-muted-foreground">قيد التنفيذ</div>
            </div>
            <div className="text-center p-4 bg-background/50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">
                {developmentPhases.reduce((acc, p) => acc + p.estimatedWeeks, 0)}
              </div>
              <div className="text-sm text-muted-foreground">أسبوع إجمالي</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="roadmap" className="flex items-center gap-2">
            <Rocket className="w-4 h-4" />
            <span className="hidden sm:inline">خارطة الطريق</span>
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            <span className="hidden sm:inline">التوصيات التقنية</span>
          </TabsTrigger>
          <TabsTrigger value="architecture" className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
            <span className="hidden sm:inline">البنية الحالية</span>
          </TabsTrigger>
          <TabsTrigger value="priorities" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            <span className="hidden sm:inline">الأولويات</span>
          </TabsTrigger>
        </TabsList>

        {/* Roadmap Tab */}
        <TabsContent value="roadmap" className="mt-6">
          <div className="space-y-4">
            {developmentPhases.map((phase, index) => (
              <Card key={phase.id} className={`transition-all hover:shadow-md ${getStatusColor(phase.status)}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <CardTitle className="text-base">{phase.name}</CardTitle>
                        <CardDescription>{phase.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(phase.priority)}>
                        {phase.priority === 'critical' ? 'حرج' : 
                         phase.priority === 'high' ? 'عالي' : 
                         phase.priority === 'medium' ? 'متوسط' : 'منخفض'}
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {phase.estimatedWeeks} أسابيع
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Progress value={phase.progress} className="flex-1 h-2" />
                      <span className="text-sm font-medium min-w-[45px]">{phase.progress}%</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {phase.items.map((item, i) => {
                        const isCompleted = item.includes('✓');
                        const cleanItem = item.replace(' ✓', '');
                        return (
                          <div key={i} className="flex items-center justify-between gap-2 text-sm group p-1.5 rounded-md hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-2">
                              {isCompleted ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                              ) : (
                                <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                              )}
                              <span>{cleanItem}</span>
                            </div>
                            {!isCompleted && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity text-primary hover:text-primary hover:bg-primary/10"
                                onClick={() => copyDevelopmentRequest(cleanItem)}
                              >
                                <Wand2 className="w-3 h-3 ml-1" />
                                طوّر
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {technicalRecommendations.map((rec) => (
              <Card key={rec.category} className="hover:shadow-md transition-all">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <rec.icon className="w-5 h-5" />
                      </div>
                      <CardTitle className="text-base">{rec.title}</CardTitle>
                    </div>
                    <div className="flex gap-1">
                      <Badge variant="outline" className={getImpactColor(rec.impact)}>
                        تأثير {rec.impact === 'high' ? 'عالي' : rec.impact === 'medium' ? 'متوسط' : 'منخفض'}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription>{rec.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {rec.items.map((item, i) => (
                      <li key={i} className="flex items-center justify-between gap-2 text-sm group p-1.5 rounded-md hover:bg-muted/50 transition-colors">
                        <div className="flex items-start gap-2">
                          <Zap className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          <span>{item}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity text-primary hover:text-primary hover:bg-primary/10 shrink-0"
                          onClick={() => copyDevelopmentRequest(item)}
                        >
                          <Wand2 className="w-3 h-3 ml-1" />
                          طوّر
                        </Button>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Architecture Tab */}
        <TabsContent value="architecture" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  نقاط القوة في البنية الحالية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {architectureStrengths.map((strength, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <strength.icon className="w-5 h-5 text-primary" />
                        <span className="text-sm">{strength.text}</span>
                      </div>
                      <Badge variant="outline" className={
                        strength.status === 'excellent' ? 'bg-green-500/10 text-green-700' : 'bg-blue-500/10 text-blue-700'
                      }>
                        {strength.status === 'excellent' ? 'ممتاز' : 'جيد'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  الإحصائيات التقنية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">عدد المكونات</span>
                      <span className="font-bold">+180 مكون</span>
                    </div>
                    <Progress value={90} className="h-2" />
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">جداول قاعدة البيانات</span>
                      <span className="font-bold">+50 جدول</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">Edge Functions</span>
                      <span className="font-bold">+15 دالة</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">سياسات RLS</span>
                      <span className="font-bold">+100 سياسة</span>
                    </div>
                    <Progress value={95} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Priorities Tab */}
        <TabsContent value="priorities" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                  أولويات قصوى (الشهر القادم)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center justify-between gap-2 group p-2 rounded-md hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-2">
                      <Shield className="w-4 h-4 text-red-500 mt-1 shrink-0" />
                      <div>
                        <span className="font-medium">المصادقة الثنائية 2FA</span>
                        <p className="text-sm text-muted-foreground">حماية أساسية للحسابات</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-600 hover:bg-red-50"
                      onClick={() => copyDevelopmentRequest('المصادقة الثنائية 2FA - حماية أساسية للحسابات')}
                    >
                      <Wand2 className="w-3 h-3 ml-1" />
                      طوّر
                    </Button>
                  </li>
                  <li className="flex items-center justify-between gap-2 group p-2 rounded-md hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-2">
                      <Smartphone className="w-4 h-4 text-red-500 mt-1 shrink-0" />
                      <div>
                        <span className="font-medium">تحسين تجربة الموبايل</span>
                        <p className="text-sm text-muted-foreground">وضع Offline وتحسين الأداء</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-600 hover:bg-red-50"
                      onClick={() => copyDevelopmentRequest('تحسين تجربة الموبايل - وضع Offline وتحسين الأداء')}
                    >
                      <Wand2 className="w-3 h-3 ml-1" />
                      طوّر
                    </Button>
                  </li>
                  <li className="flex items-center justify-between gap-2 group p-2 rounded-md hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-2">
                      <Gauge className="w-4 h-4 text-red-500 mt-1 shrink-0" />
                      <div>
                        <span className="font-medium">تحسين أداء الاستعلامات</span>
                        <p className="text-sm text-muted-foreground">فهارس وتحسين RLS</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-600 hover:bg-red-50"
                      onClick={() => copyDevelopmentRequest('تحسين أداء الاستعلامات - فهارس وتحسين RLS')}
                    >
                      <Wand2 className="w-3 h-3 ml-1" />
                      طوّر
                    </Button>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-yellow-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-600">
                  <Target className="w-5 h-5" />
                  أولويات متوسطة (3 أشهر)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center justify-between gap-2 group p-2 rounded-md hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-2">
                      <Brain className="w-4 h-4 text-yellow-500 mt-1 shrink-0" />
                      <div>
                        <span className="font-medium">توسيع قدرات AI</span>
                        <p className="text-sm text-muted-foreground">تحليل المشاعر وتوقعات ذكية</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity text-yellow-600 hover:text-yellow-600 hover:bg-yellow-50"
                      onClick={() => copyDevelopmentRequest('توسيع قدرات AI - تحليل المشاعر وتوقعات ذكية')}
                    >
                      <Wand2 className="w-3 h-3 ml-1" />
                      طوّر
                    </Button>
                  </li>
                  <li className="flex items-center justify-between gap-2 group p-2 rounded-md hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-2">
                      <BarChart3 className="w-4 h-4 text-yellow-500 mt-1 shrink-0" />
                      <div>
                        <span className="font-medium">تقارير تحليلية متقدمة</span>
                        <p className="text-sm text-muted-foreground">لوحات تحكم تفاعلية</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity text-yellow-600 hover:text-yellow-600 hover:bg-yellow-50"
                      onClick={() => copyDevelopmentRequest('تقارير تحليلية متقدمة - لوحات تحكم تفاعلية')}
                    >
                      <Wand2 className="w-3 h-3 ml-1" />
                      طوّر
                    </Button>
                  </li>
                  <li className="flex items-center justify-between gap-2 group p-2 rounded-md hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-2">
                      <Users className="w-4 h-4 text-yellow-500 mt-1 shrink-0" />
                      <div>
                        <span className="font-medium">نظام الدعوات</span>
                        <p className="text-sm text-muted-foreground">دعوة موظفين عبر روابط</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity text-yellow-600 hover:text-yellow-600 hover:bg-yellow-50"
                      onClick={() => copyDevelopmentRequest('نظام الدعوات - دعوة موظفين عبر روابط')}
                    >
                      <Wand2 className="w-3 h-3 ml-1" />
                      طوّر
                    </Button>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-blue-200 md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600">
                  <Globe className="w-5 h-5" />
                  الرؤية طويلة المدى (6-12 شهر)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg group relative hover:shadow-md transition-all">
                    <Globe className="w-6 h-6 text-blue-500 mb-2" />
                    <h4 className="font-medium">التوسع الإقليمي</h4>
                    <p className="text-sm text-muted-foreground">دعم دول الخليج والمغرب العربي</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 left-2 h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 hover:text-blue-600 hover:bg-blue-100"
                      onClick={() => copyDevelopmentRequest('التوسع الإقليمي - دعم دول الخليج والمغرب العربي')}
                    >
                      <Wand2 className="w-3 h-3 ml-1" />
                      طوّر
                    </Button>
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg group relative hover:shadow-md transition-all">
                    <Lock className="w-6 h-6 text-blue-500 mb-2" />
                    <h4 className="font-medium">شهادات الأمان</h4>
                    <p className="text-sm text-muted-foreground">ISO 27001 و SOC 2</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 left-2 h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 hover:text-blue-600 hover:bg-blue-100"
                      onClick={() => copyDevelopmentRequest('شهادات الأمان - ISO 27001 و SOC 2')}
                    >
                      <Wand2 className="w-3 h-3 ml-1" />
                      طوّر
                    </Button>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg group relative hover:shadow-md transition-all border-2 border-green-300">
                    <div className="absolute -top-2 -right-2">
                      <Badge className="bg-green-500 text-white">✓ جاهز</Badge>
                    </div>
                    <Server className="w-6 h-6 text-green-600 mb-2" />
                    <h4 className="font-medium">API مفتوح</h4>
                    <p className="text-sm text-muted-foreground">تكامل مع أنظمة خارجية</p>
                    <Button
                      variant="default"
                      size="sm"
                      className="absolute top-2 left-2 h-7 px-3"
                      onClick={() => navigate('/dashboard/api')}
                    >
                      افتح
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EngineerVisionSection;
