import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Lightbulb,
  Target,
  TrendingUp,
  Bug,
  Sparkles,
  Rocket,
  BarChart3,
  Zap,
  Globe,
  Lock,
  Smartphone,
  RefreshCw,
  Award,
  Star,
  Activity,
  ExternalLink,
  Link2,
  Network,
  Brain,
  Radio,
  Building2,
  Wrench,
} from 'lucide-react';
import EngineerVisionSection from '@/components/system-status/EngineerVisionSection';
import BackButton from '@/components/ui/back-button';
import { LiveHealthDashboard } from '@/components/system-status/LiveHealthDashboard';
import { useNavigate } from 'react-router-dom';
import { useSystemStats } from '@/hooks/useSystemStats';
import { systemModulesData, systemIntegrationsData } from '@/components/system-status/systemModulesData';
import { ModuleOverviewCard, StrengthsList, getStatusInfo, getPriorityVariant } from '@/components/system-status/ModuleComponents';
import { LiveStatsGrid, OverallProgressCard } from '@/components/system-status/StatsComponents';
import { IntegrationCard, IntegrationDetailView, IntegrationStatsGrid } from '@/components/system-status/IntegrationsComponents';
import { OrganizationsHealthTab } from '@/components/system-status/OrganizationsHealthTab';
import { triggerAIChat } from '@/lib/aiChatBus';
import { toast } from 'sonner';

// Calculate overall system progress
const calculateOverallProgress = () => {
  const total = systemModulesData.reduce((acc, module) => acc + module.overallProgress, 0);
  return Math.round(total / systemModulesData.length);
};

const SystemStatus = () => {
  const [activeTab, setActiveTab] = useState('live-monitor');
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useSystemStats();
  const overallProgress = calculateOverallProgress();

  const completedFeatures = systemModulesData.flatMap(m => m.features.filter(f => f.status === 'completed'));
  const inProgressFeatures = systemModulesData.flatMap(m => m.features.filter(f => f.status === 'in_progress'));
  const plannedFeatures = systemModulesData.flatMap(m => m.features.filter(f => f.status === 'planned'));
  const issueFeatures = systemModulesData.flatMap(m => m.features.filter(f => f.issues && f.issues.length > 0));

  const handleDevelop = (featureName: string, featureDescription: string, moduleName: string) => {
    const message = `طور الميزة التالية في نظام "${moduleName}": "${featureName}" - ${featureDescription}. قم بتحسينها وإضافة التفاصيل اللازمة لتكون جاهزة للاستخدام الفعلي في الناقل والمولد والمدور.`;
    triggerAIChat(message);
    toast.success(`🚀 جارٍ تطوير: ${featureName}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton />
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary/60 text-white">
              <Activity className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">حالة النظام</h1>
              <p className="text-muted-foreground">تقرير شامل ومباشر عن حالة المنصة</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/support')}>
              <Sparkles className="w-4 h-4 ml-2" />
              الدعم الفني
              <ExternalLink className="w-3 h-3 mr-2" />
            </Button>
          </div>
        </div>

        {/* Live Stats from Database */}
        <LiveStatsGrid stats={stats} isLoading={statsLoading} />

        {/* Overall Progress */}
        <OverallProgressCard
          overallProgress={overallProgress}
          completedCount={completedFeatures.length}
          inProgressCount={inProgressFeatures.length}
          plannedCount={plannedFeatures.length}
          issuesCount={issueFeatures.length}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" dir="rtl">
        <TabsList className="grid grid-cols-9 w-full">
          <TabsTrigger value="live-monitor" className="flex items-center gap-2">
            <Radio className="w-4 h-4" />
            <span className="hidden sm:inline">مراقبة مباشرة</span>
          </TabsTrigger>
          <TabsTrigger value="org-health" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">حالة الجهات</span>
          </TabsTrigger>
          <TabsTrigger value="engineer-vision" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            <span className="hidden sm:inline">رؤية المهندس</span>
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">نظرة عامة</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Network className="w-4 h-4" />
            <span className="hidden sm:inline">التكامل</span>
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-2">
            <Star className="w-4 h-4" />
            <span className="hidden sm:inline">المميزات</span>
          </TabsTrigger>
          <TabsTrigger value="issues" className="flex items-center gap-2">
            <Bug className="w-4 h-4" />
            <span className="hidden sm:inline">قيد التطوير</span>
          </TabsTrigger>
          <TabsTrigger value="future" className="flex items-center gap-2">
            <Rocket className="w-4 h-4" />
            <span className="hidden sm:inline">المستقبل</span>
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            <span className="hidden sm:inline">اقتراحات</span>
          </TabsTrigger>
        </TabsList>

        {/* Live Monitor Tab */}
        <TabsContent value="live-monitor" className="mt-6">
          <LiveHealthDashboard />
        </TabsContent>

        {/* Organizations Health Tab */}
        <TabsContent value="org-health" className="mt-6">
          <OrganizationsHealthTab />
        </TabsContent>

        {/* Engineer Vision Tab */}
        <TabsContent value="engineer-vision" className="mt-6">
          <EngineerVisionSection />
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {systemModulesData.map((module) => (
              <ModuleOverviewCard key={module.id} module={module} />
            ))}
          </div>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="w-5 h-5 text-primary" />
                  تحليل الربط والتكامل في النظام
                </CardTitle>
                <CardDescription>
                  تحليل مفصل لكيفية ترابط الجهات والشحنات والحسابات والتتبع والخرائط
                </CardDescription>
              </CardHeader>
              <CardContent>
                <IntegrationStatsGrid integrations={systemIntegrationsData} />
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {systemIntegrationsData.map((integration) => (
                    <IntegrationCard key={integration.id} integration={integration} />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-blue-500" />
                  تفاصيل الربط والعلاقات
                </CardTitle>
                <CardDescription>
                  اضغط على أي منظومة لرؤية تفاصيل الربط بين الجداول وتدفق البيانات
                </CardDescription>
              </CardHeader>
              <CardContent>
                <IntegrationDetailView integrations={systemIntegrationsData} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                المميزات المكتملة والفعالة
              </CardTitle>
              <CardDescription>جميع الميزات التي تعمل بكفاءة 100%</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <Accordion type="multiple" className="w-full">
                  {systemModulesData.map((module, idx) => (
                    <AccordionItem key={idx} value={`module-${idx}`}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                          <module.icon className="w-5 h-5 text-primary" />
                          <span>{module.name}</span>
                          <Badge variant="secondary" className="mr-2">
                            {module.features.filter(f => f.status === 'completed').length}/{module.features.length}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pt-2">
                          <StrengthsList strengths={module.strengths} />
                          <div className="space-y-2">
                            {module.features.filter(f => f.status === 'completed').map((feature, i) => {
                              const statusInfo = getStatusInfo(feature.status);
                              return (
                                <div key={i} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                                  <div className="flex items-center gap-2">
                                    <statusInfo.icon className={`w-4 h-4 ${statusInfo.color}`} />
                                    <span className="text-sm font-medium">{feature.name}</span>
                                  </div>
                                  <Badge variant="outline" className="bg-green-500/10 text-green-700">
                                    {feature.progress}%
                                  </Badge>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Issues / In Progress Tab */}
        <TabsContent value="issues" className="mt-6">
          <div className="grid gap-6">
            {/* Features in Progress */}
            <Card className="border-yellow-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-600">
                  <Clock className="w-5 h-5" />
                  الميزات قيد التطوير
                </CardTitle>
                <CardDescription>الميزات التي يتم العمل عليها حالياً</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {inProgressFeatures.map((feature, idx) => {
                    const module = systemModulesData.find(m => m.features.includes(feature));
                    return (
                      <div key={idx} className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                        <div className="flex items-center gap-3">
                          {module && <module.icon className="w-4 h-4 text-yellow-600" />}
                          <div>
                            <span className="font-medium">{feature.name}</span>
                            <p className="text-xs text-muted-foreground">{feature.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={feature.progress} className="w-20 h-2" />
                          <span className="text-sm font-medium min-w-[40px]">{feature.progress}%</span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-xs border-yellow-400 text-yellow-700 hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
                            onClick={() => handleDevelop(feature.name, feature.description, module?.name || '')}
                          >
                            <Wrench className="w-3 h-3" />
                            طوّر
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Weaknesses */}
            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <AlertTriangle className="w-5 h-5" />
                  نقاط التحسين المستقبلية
                </CardTitle>
                <CardDescription>مجالات يمكن تحسينها في الإصدارات القادمة</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-4">
                    {systemModulesData.filter(m => m.weaknesses.length > 0).map((module, idx) => (
                      <div key={idx} className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <module.icon className="w-5 h-5 text-muted-foreground" />
                          <h4 className="font-semibold">{module.name}</h4>
                        </div>
                        <ul className="space-y-1">
                          {module.weaknesses.map((weakness, i) => (
                            <li key={i} className="text-sm flex items-start gap-2 text-muted-foreground">
                              <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                              {weakness}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Future Development Tab */}
        <TabsContent value="future" className="mt-6">
          <div className="grid gap-6">
            {/* Vision Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {systemModulesData.map((module, idx) => (
                <Card key={idx} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary/60 text-white">
                        <module.icon className="w-5 h-5" />
                      </div>
                      <CardTitle className="text-base">{module.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Rocket className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <p>{module.futureVision}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Planned Features */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-500" />
                  الميزات المخططة
                </CardTitle>
                <CardDescription>الميزات التي سيتم تطويرها قريباً</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {plannedFeatures.map((feature, idx) => {
                    const module = systemModulesData.find(m => m.features.includes(feature));
                    return (
                      <div key={idx} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                        <div className="flex items-center gap-3">
                          {module && <module.icon className="w-4 h-4 text-blue-600" />}
                          <div>
                            <span className="font-medium">{feature.name}</span>
                            <p className="text-xs text-muted-foreground">{feature.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getPriorityVariant(feature.priority) as any}>
                            {feature.priority === 'high' ? 'أولوية عالية' : feature.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                          </Badge>
                          <Button
                            size="sm"
                            className="gap-1 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => handleDevelop(feature.name, feature.description, module?.name || '')}
                          >
                            <Rocket className="w-3 h-3" />
                            طوّر
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Suggestions Tab */}
        <TabsContent value="suggestions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                الاقتراحات والتوصيات
              </CardTitle>
              <CardDescription>توصيات لتحسين النظام وتطويره</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-4">
                  {systemModulesData.map((module, idx) => {
                    const featuresWithSuggestions = module.features.filter(f => f.suggestions && f.suggestions.length > 0);
                    if (featuresWithSuggestions.length === 0) return null;
                    
                    return (
                      <div key={idx} className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <module.icon className="w-5 h-5 text-primary" />
                          <h4 className="font-semibold">{module.name}</h4>
                        </div>
                        
                        <div className="space-y-3">
                          {featuresWithSuggestions.map((feature, i) => (
                            <div key={i} className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Award className="w-4 h-4 text-amber-600" />
                                <span className="font-medium text-sm">{feature.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {feature.progress}% مكتمل
                                </Badge>
                              </div>
                              <ul className="space-y-1">
                                {feature.suggestions?.map((suggestion, j) => (
                                  <li key={j} className="text-sm text-amber-700 dark:text-amber-400 flex items-start gap-2">
                                    <Lightbulb className="w-3 h-3 mt-1 shrink-0" />
                                    {suggestion}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {/* General Recommendations */}
                  <Card className="bg-gradient-to-r from-primary/5 to-secondary/5">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <RefreshCw className="w-5 h-5 text-primary" />
                        توصيات التطوير المستقبلي
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-2">
                          <Zap className="w-4 h-4 text-primary mt-0.5" />
                          <div>
                            <span className="font-medium">تحسين الأداء:</span>
                            <p className="text-sm text-muted-foreground">تطبيق lazy loading وتحسين bundle size لتسريع التحميل</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <Smartphone className="w-4 h-4 text-primary mt-0.5" />
                          <div>
                            <span className="font-medium">تطبيق موبايل:</span>
                            <p className="text-sm text-muted-foreground">تحويل المنصة لـ PWA للاستخدام الأمثل على الموبايل</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <Globe className="w-4 h-4 text-primary mt-0.5" />
                          <div>
                            <span className="font-medium">التوسع الإقليمي:</span>
                            <p className="text-sm text-muted-foreground">إضافة دعم للغة الإنجليزية والتوسع لدول الخليج</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <Lock className="w-4 h-4 text-primary mt-0.5" />
                          <div>
                            <span className="font-medium">شهادات الأمان:</span>
                            <p className="text-sm text-muted-foreground">الحصول على شهادة ISO 27001 وSOC 2 لتعزيز الثقة</p>
                          </div>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default SystemStatus;
