import { motion } from 'framer-motion';
import {
  Leaf,
  Target,
  Eye,
  Shield,
  TrendingUp,
  Users,
  MapPin,
  Award,
  Recycle,
  Building2,
  Truck,
  Globe,
  CheckCircle2,
  ArrowUpRight,
  Sparkles,
  BarChart3,
  Clock,
  Heart,
  Zap,
  Scale,
  FileText,
  Handshake
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useDisplayMode } from '@/hooks/useDisplayMode';
import { cn } from '@/lib/utils';

const AboutPlatform = () => {
  const { isMobile, getResponsiveClass } = useDisplayMode();

  const containerPadding = getResponsiveClass({
    mobile: 'p-3',
    tablet: 'p-4',
    desktop: 'p-6',
  });

  const cardPadding = getResponsiveClass({
    mobile: 'p-4',
    tablet: 'p-5',
    desktop: 'p-6',
  });

  const titleSize = getResponsiveClass({
    mobile: 'text-xl',
    tablet: 'text-2xl',
    desktop: 'text-3xl',
  });

  // إحصائيات المنصة
  const platformStats = [
    { label: 'جهة مولدة', value: '500+', icon: Building2, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    { label: 'شركة نقل', value: '150+', icon: Truck, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
    { label: 'مصنع تدوير', value: '80+', icon: Recycle, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
    { label: 'محافظة مصرية', value: '27', icon: MapPin, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  ];

  // الإنجازات البيئية
  const environmentalImpact = [
    { label: 'طن نفايات تم تدويرها', value: '50,000+', progress: 85 },
    { label: 'طن انبعاثات كربونية تم تجنبها', value: '25,000+', progress: 70 },
    { label: 'شحنة تم إتمامها بنجاح', value: '100,000+', progress: 95 },
    { label: 'شهادة إعادة تدوير صادرة', value: '75,000+', progress: 80 },
  ];

  // القيم الأساسية
  const coreValues = [
    {
      icon: Leaf,
      title: 'الاستدامة البيئية',
      description: 'نلتزم بالحفاظ على البيئة وتقليل الأثر السلبي للنفايات على النظام البيئي المصري',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      icon: Shield,
      title: 'الشفافية والمصداقية',
      description: 'نوفر منظومة متكاملة لتتبع النفايات من المصدر حتى التدوير مع توثيق كامل',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: Scale,
      title: 'الامتثال التنظيمي',
      description: 'نضمن التزام جميع الأطراف بقوانين جهاز تنظيم إدارة المخلفات (WMRA)',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      icon: Zap,
      title: 'الكفاءة التشغيلية',
      description: 'نستخدم أحدث التقنيات لتسهيل وتسريع عمليات إدارة النفايات',
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
  ];

  // الأهداف الاستراتيجية
  const strategicGoals = [
    {
      title: 'رقمنة إدارة المخلفات',
      description: 'تحويل 100% من عمليات إدارة المخلفات الصناعية إلى منظومة رقمية متكاملة',
      target: '2025',
      progress: 75,
    },
    {
      title: 'التغطية الجغرافية الشاملة',
      description: 'الوصول إلى جميع المناطق الصناعية في محافظات مصر',
      target: '2026',
      progress: 60,
    },
    {
      title: 'خفض الانبعاثات الكربونية',
      description: 'المساهمة في خفض 100,000 طن من انبعاثات الكربون سنوياً',
      target: '2027',
      progress: 45,
    },
    {
      title: 'التكامل الإقليمي',
      description: 'التوسع لتقديم خدماتنا في دول الشرق الأوسط وشمال أفريقيا',
      target: '2028',
      progress: 20,
    },
  ];

  // السياسات
  const policies = [
    {
      icon: FileText,
      title: 'سياسة الخصوصية',
      points: [
        'حماية كاملة لبيانات المستخدمين والشركات',
        'عدم مشاركة البيانات مع أطراف ثالثة',
        'تشفير متقدم لجميع المعاملات',
      ],
    },
    {
      icon: Shield,
      title: 'سياسة الأمان',
      points: [
        'مراقبة مستمرة على مدار الساعة',
        'نسخ احتياطية يومية للبيانات',
        'معايير أمان دولية ISO 27001',
      ],
    },
    {
      icon: Handshake,
      title: 'سياسة الشراكة',
      points: [
        'عقود واضحة وشفافة',
        'دعم فني متواصل للشركاء',
        'برامج تدريب وتأهيل مجانية',
      ],
    },
  ];

  // المميزات الرئيسية
  const keyFeatures = [
    { icon: Globe, label: 'تتبع لحظي للشحنات' },
    { icon: BarChart3, label: 'تقارير تحليلية متقدمة' },
    { icon: Award, label: 'شهادات إعادة تدوير معتمدة' },
    { icon: Clock, label: 'دعم فني على مدار الساعة' },
    { icon: Users, label: 'إدارة متعددة المستخدمين' },
    { icon: Heart, label: 'واجهة سهلة الاستخدام' },
  ];

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 },
  };

  return (
    <DashboardLayout>
      <div className={cn('space-y-6', containerPadding)}>
        {/* Hero Section */}
        <motion.div
          {...fadeInUp}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground"
        >
          <div className="absolute inset-0 bg-[url('/placeholder.svg')] opacity-5" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <div className={cn('relative', isMobile ? 'p-6' : 'p-8 md:p-12')}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
                <Recycle className="w-7 h-7" />
              </div>
              <Badge variant="secondary" className="bg-white/20 text-white border-0">
                منصة معتمدة من WMRA
              </Badge>
            </div>
            
            <h1 className={cn('font-bold mb-4', titleSize)}>
              iRecycle - منصة إدارة المخلفات الذكية
            </h1>
            <p className={cn('opacity-90 leading-relaxed max-w-3xl', isMobile ? 'text-sm' : 'text-base md:text-lg')}>
              المنصة الرقمية الأولى في مصر لإدارة دورة حياة المخلفات الصناعية بشكل متكامل، 
              من الجمع والنقل وحتى التدوير، مع ضمان الامتثال الكامل للوائح جهاز تنظيم إدارة المخلفات (WMRA).
            </p>

            {/* Quick Stats */}
            <div className={cn('grid gap-4 mt-8', isMobile ? 'grid-cols-2' : 'grid-cols-4')}>
              {platformStats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/10 backdrop-blur rounded-xl p-4 text-center"
                >
                  <stat.icon className="w-6 h-6 mx-auto mb-2 opacity-80" />
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm opacity-80">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Tabs Section */}
        <Tabs defaultValue="vision" className="w-full">
          <TabsList className={cn('w-full grid', isMobile ? 'grid-cols-2 gap-1' : 'grid-cols-4')}>
            <TabsTrigger value="vision" className="gap-2">
              <Eye className="w-4 h-4" />
              <span className={isMobile ? 'text-xs' : ''}>الرؤية والرسالة</span>
            </TabsTrigger>
            <TabsTrigger value="goals" className="gap-2">
              <Target className="w-4 h-4" />
              <span className={isMobile ? 'text-xs' : ''}>الأهداف</span>
            </TabsTrigger>
            <TabsTrigger value="impact" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className={isMobile ? 'text-xs' : ''}>التأثير</span>
            </TabsTrigger>
            <TabsTrigger value="policies" className="gap-2">
              <Shield className="w-4 h-4" />
              <span className={isMobile ? 'text-xs' : ''}>السياسات</span>
            </TabsTrigger>
          </TabsList>

          {/* Vision Tab */}
          <TabsContent value="vision" className="mt-6 space-y-6">
            {/* Vision & Mission Cards */}
            <div className={cn('grid gap-6', isMobile ? 'grid-cols-1' : 'grid-cols-2')}>
              <motion.div {...fadeInUp}>
                <Card className="h-full border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                  <CardHeader className={cardPadding}>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Eye className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle className="text-xl">رؤيتنا</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className={cn(cardPadding, 'pt-0')}>
                    <p className="text-muted-foreground leading-relaxed">
                      أن نكون المنصة الرائدة في الشرق الأوسط وأفريقيا لإدارة المخلفات الذكية، 
                      ونساهم في بناء اقتصاد دائري مستدام يحافظ على البيئة ويدعم التنمية الاقتصادية.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div {...fadeInUp} transition={{ delay: 0.1 }}>
                <Card className="h-full border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
                  <CardHeader className={cardPadding}>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <Target className="w-6 h-6 text-emerald-500" />
                      </div>
                      <CardTitle className="text-xl">رسالتنا</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className={cn(cardPadding, 'pt-0')}>
                    <p className="text-muted-foreground leading-relaxed">
                      تمكين المؤسسات من إدارة مخلفاتها بكفاءة وشفافية من خلال منصة رقمية متكاملة 
                      تربط بين مولدي النفايات والناقلين ومصانع التدوير، مع ضمان الامتثال الكامل للوائح البيئية.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Core Values */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                قيمنا الأساسية
              </h3>
              <div className={cn('grid gap-4', isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-4')}>
                {coreValues.map((value, index) => (
                  <motion.div
                    key={value.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="h-full hover:shadow-md transition-shadow">
                      <CardContent className={cn(cardPadding)}>
                        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-4', value.bgColor)}>
                          <value.icon className={cn('w-6 h-6', value.color)} />
                        </div>
                        <h4 className="font-semibold mb-2">{value.title}</h4>
                        <p className="text-sm text-muted-foreground">{value.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Key Features */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  مميزات المنصة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={cn('grid gap-3', isMobile ? 'grid-cols-2' : 'grid-cols-3 lg:grid-cols-6')}>
                  {keyFeatures.map((feature, index) => (
                    <motion.div
                      key={feature.label}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex flex-col items-center text-center p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <feature.icon className="w-8 h-8 text-primary mb-2" />
                      <span className="text-sm font-medium">{feature.label}</span>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Goals Tab */}
          <TabsContent value="goals" className="mt-6 space-y-6">
            <div className="grid gap-4">
              {strategicGoals.map((goal, index) => (
                <motion.div
                  key={goal.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className={cn(cardPadding)}>
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{goal.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              {goal.target}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{goal.description}</p>
                        </div>
                        <div className="text-left shrink-0">
                          <span className="text-2xl font-bold text-primary">{goal.progress}%</span>
                        </div>
                      </div>
                      <Progress value={goal.progress} className="h-2" />
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Growth Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  خطة النمو والتوسع
                </CardTitle>
              </CardHeader>
              <CardContent className={cardPadding}>
                <div className="relative">
                  <div className="absolute right-4 top-0 bottom-0 w-0.5 bg-border" />
                  <div className="space-y-6">
                    {[
                      { year: '2024', title: 'إطلاق المنصة', description: 'بداية العمليات في القاهرة والإسكندرية' },
                      { year: '2025', title: 'التوسع المحلي', description: 'الوصول لجميع المناطق الصناعية في مصر' },
                      { year: '2026', title: 'التكامل الحكومي', description: 'الربط المباشر مع منظومة WMRA' },
                      { year: '2027', title: 'التوسع الإقليمي', description: 'الانطلاق في السعودية والإمارات' },
                    ].map((item, index) => (
                      <motion.div
                        key={item.year}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.15 }}
                        className="relative pr-10"
                      >
                        <div className="absolute right-2.5 w-4 h-4 rounded-full bg-primary border-4 border-background" />
                        <div className="bg-muted/50 rounded-xl p-4">
                          <Badge className="mb-2">{item.year}</Badge>
                          <h5 className="font-semibold">{item.title}</h5>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Impact Tab */}
          <TabsContent value="impact" className="mt-6 space-y-6">
            {/* Environmental Impact */}
            <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Leaf className="w-5 h-5 text-emerald-500" />
                  الأثر البيئي
                </CardTitle>
              </CardHeader>
              <CardContent className={cardPadding}>
                <div className={cn('grid gap-6', isMobile ? 'grid-cols-1' : 'grid-cols-2')}>
                  {environmentalImpact.map((item, index) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="space-y-2"
                    >
                      <div className="flex justify-between items-end">
                        <span className="text-sm text-muted-foreground">{item.label}</span>
                        <span className="text-xl font-bold text-emerald-500">{item.value}</span>
                      </div>
                      <Progress value={item.progress} className="h-2 bg-emerald-500/20" />
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Impact in Egypt */}
            <div className={cn('grid gap-6', isMobile ? 'grid-cols-1' : 'grid-cols-3')}>
              <Card>
                <CardContent className={cn(cardPadding, 'text-center')}>
                  <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                    <Building2 className="w-8 h-8 text-blue-500" />
                  </div>
                  <h4 className="text-3xl font-bold text-blue-500 mb-1">500+</h4>
                  <p className="text-muted-foreground">منشأة صناعية تستخدم المنصة</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className={cn(cardPadding, 'text-center')}>
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-amber-500" />
                  </div>
                  <h4 className="text-3xl font-bold text-amber-500 mb-1">5,000+</h4>
                  <p className="text-muted-foreground">فرصة عمل تم توفيرها</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className={cn(cardPadding, 'text-center')}>
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h4 className="text-3xl font-bold text-emerald-500 mb-1">27</h4>
                  <p className="text-muted-foreground">محافظة مصرية نغطيها</p>
                </CardContent>
              </Card>
            </div>

            {/* Testimonial */}
            <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
              <CardContent className={cn(cardPadding)}>
                <blockquote className="text-lg italic text-center">
                  "منصة iRecycle ساهمت في تحويل إدارة المخلفات الصناعية في مصر إلى منظومة رقمية متكاملة، 
                  مما أدى إلى تحسين كفاءة العمليات وزيادة معدلات التدوير بشكل ملحوظ."
                </blockquote>
                <div className="text-center mt-4">
                  <p className="font-semibold">جهاز تنظيم إدارة المخلفات - WMRA</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Policies Tab */}
          <TabsContent value="policies" className="mt-6 space-y-6">
            <div className={cn('grid gap-6', isMobile ? 'grid-cols-1' : 'grid-cols-3')}>
              {policies.map((policy, index) => (
                <motion.div
                  key={policy.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-md transition-shadow">
                    <CardHeader className={cardPadding}>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <policy.icon className="w-6 h-6 text-primary" />
                        </div>
                        <CardTitle className="text-lg">{policy.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className={cn(cardPadding, 'pt-0')}>
                      <ul className="space-y-3">
                        {policy.points.map((point, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                            <span className="text-sm text-muted-foreground">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Compliance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  الاعتمادات والشهادات
                </CardTitle>
              </CardHeader>
              <CardContent className={cardPadding}>
                <div className={cn('grid gap-4', isMobile ? 'grid-cols-2' : 'grid-cols-4')}>
                  {[
                    { name: 'WMRA', desc: 'جهاز تنظيم المخلفات' },
                    { name: 'ISO 27001', desc: 'أمان المعلومات' },
                    { name: 'ISO 14001', desc: 'الإدارة البيئية' },
                    { name: 'GDPR', desc: 'حماية البيانات' },
                  ].map((cert, index) => (
                    <motion.div
                      key={cert.name}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="text-center p-4 rounded-xl bg-muted/50 border border-border"
                    >
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                        <Award className="w-6 h-6 text-primary" />
                      </div>
                      <h5 className="font-semibold">{cert.name}</h5>
                      <p className="text-xs text-muted-foreground">{cert.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
              <CardContent className={cn(cardPadding)}>
                <div className="text-center">
                  <h4 className="text-lg font-semibold mb-2">تواصل معنا</h4>
                  <p className="text-muted-foreground mb-4">
                    فريق الدعم متاح على مدار الساعة للإجابة على استفساراتكم
                  </p>
                  <div className={cn('flex justify-center gap-4 flex-wrap', isMobile && 'flex-col')}>
                    <Badge variant="secondary" className="text-sm py-2 px-4">
                      support@irecycle.eg
                    </Badge>
                    <Badge variant="secondary" className="text-sm py-2 px-4">
                      +20 2 1234 5678
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AboutPlatform;
