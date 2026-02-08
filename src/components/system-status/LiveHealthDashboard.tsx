import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Clock,
  Database,
  Server,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  Package,
  Building2,
  Truck,
  FileText,
  Users,
  Headphones,
  FileCheck,
  Bell,
  CreditCard,
} from 'lucide-react';
import { useDynamicSystemHealth, DynamicModuleHealth } from '@/hooks/useDynamicSystemHealth';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

const moduleIcons: Record<string, any> = {
  shipments: Package,
  organizations: Building2,
  drivers: Truck,
  contracts: FileText,
  approvals: Users,
  support: Headphones,
  documents: FileCheck,
  invoices: CreditCard,
  notifications: Bell,
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'healthy':
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    case 'warning':
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    case 'critical':
      return <XCircle className="w-5 h-5 text-red-500" />;
    default:
      return <Clock className="w-5 h-5 text-gray-500" />;
  }
};

const getHealthTrend = (health: number) => {
  if (health >= 95) return { icon: TrendingUp, color: 'text-green-500', label: 'ممتاز' };
  if (health >= 80) return { icon: Minus, color: 'text-yellow-500', label: 'جيد' };
  return { icon: TrendingDown, color: 'text-red-500', label: 'يحتاج اهتمام' };
};

const ModuleHealthCard = ({ module }: { module: DynamicModuleHealth }) => {
  const Icon = moduleIcons[module.name] || Activity;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${
            module.status === 'healthy' ? 'bg-green-500/10' : 
            module.status === 'warning' ? 'bg-yellow-500/10' : 'bg-red-500/10'
          }`}>
            <Icon className={`w-4 h-4 ${
              module.status === 'healthy' ? 'text-green-500' : 
              module.status === 'warning' ? 'text-yellow-500' : 'text-red-500'
            }`} />
          </div>
          <span className="font-medium">{module.nameAr}</span>
        </div>
        <Badge 
          variant="outline" 
          className={`${
            module.status === 'healthy' ? 'border-green-500 text-green-500' : 
            module.status === 'warning' ? 'border-yellow-500 text-yellow-500' : 
            'border-red-500 text-red-500'
          }`}
        >
          {module.health}%
        </Badge>
      </div>
      
      <Progress 
        value={module.health} 
        className="h-2 mb-3"
      />
      
      {/* Live Metrics */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs mb-2">
        <div className="p-1.5 rounded bg-muted/50">
          <div className="font-bold">{module.metrics.total}</div>
          <div className="text-muted-foreground">الإجمالي</div>
        </div>
        <div className="p-1.5 rounded bg-green-500/10">
          <div className="font-bold text-green-600">{module.metrics.active}</div>
          <div className="text-muted-foreground">نشط</div>
        </div>
        {module.metrics.pending > 0 && (
          <div className="p-1.5 rounded bg-yellow-500/10">
            <div className="font-bold text-yellow-600">{module.metrics.pending}</div>
            <div className="text-muted-foreground">معلق</div>
          </div>
        )}
      </div>
      
      {module.issues && module.issues.length > 0 && (
        <div className="mt-2 space-y-1">
          {module.issues.map((issue, i) => (
            <p key={i} className="text-xs text-yellow-600 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {issue}
            </p>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export const LiveHealthDashboard = () => {
  const { data: health, isLoading, refetch } = useDynamicSystemHealth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast.success('تم تحديث حالة النظام بنجاح');
    } catch (error) {
      toast.error('فشل في تحديث حالة النظام');
    } finally {
      setIsRefreshing(false);
    }
  };

  const healthScore = health?.overallScore || 0;
  const trend = getHealthTrend(healthScore);
  const TrendIcon = trend.icon;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Live Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Activity className="w-6 h-6 text-primary" />
            <motion.span
              className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
          </div>
          <div>
            <h2 className="text-xl font-bold">مراقبة النظام المباشرة</h2>
            <p className="text-sm text-muted-foreground">
              {health?.lastUpdated 
                ? `آخر تحديث: ${formatDistanceToNow(health.lastUpdated, { addSuffix: true, locale: ar })}`
                : 'جاري التحميل...'
              }
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing || isLoading}
        >
          <RefreshCw className={`w-4 h-4 ml-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          تحديث الآن
        </Button>
      </div>

      {/* Main Health Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <Card className="overflow-hidden">
          <div className={`absolute inset-0 opacity-5 ${
            healthScore >= 90 ? 'bg-green-500' : healthScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'
          }`} />
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-muted/20"
                    />
                    <motion.circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      className={healthScore >= 90 ? 'text-green-500' : healthScore >= 70 ? 'text-yellow-500' : 'text-red-500'}
                      initial={{ strokeDasharray: '0 251.2' }}
                      animate={{ strokeDasharray: `${(healthScore / 100) * 251.2} 251.2` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold">{healthScore}%</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">صحة النظام الإجمالية</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <TrendIcon className={`w-4 h-4 ${trend.color}`} />
                    <span className={`text-sm ${trend.color}`}>{trend.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    بناءً على {health?.summary.totalChecks} موديول
                  </p>
                </div>
              </div>

              <div className="flex gap-6 text-center">
                <div>
                  <div className="flex items-center gap-1 text-green-500">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-2xl font-bold">{health?.summary.passedChecks || 0}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">سليمة</p>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-2xl font-bold">{health?.summary.warningChecks || 0}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">تحذيرات</p>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-red-500">
                    <XCircle className="w-4 h-4" />
                    <span className="text-2xl font-bold">{health?.summary.criticalChecks || 0}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">حرجة</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Infrastructure Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-500" />
              قاعدة البيانات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Badge variant={health?.infrastructure.database.status === 'connected' ? 'default' : 'destructive'}>
                {health?.infrastructure.database.status === 'connected' ? 'متصل' : 
                 health?.infrastructure.database.status === 'slow' ? 'بطيء' : 'مشكلة'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {health?.infrastructure.database.latency || 0}ms
              </span>
            </div>
            <Progress 
              value={Math.max(0, 100 - (health?.infrastructure.database.latency || 0) / 5)} 
              className="h-1 mt-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Server className="w-4 h-4 text-purple-500" />
              Edge Functions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Badge variant="default">
                {health?.infrastructure.edgeFunctions.deployed || 0} / {health?.infrastructure.edgeFunctions.total || 0}
              </Badge>
              <span className="text-sm text-muted-foreground">منشورة</span>
            </div>
            <Progress 
              value={(health?.infrastructure.edgeFunctions.deployed || 0) / (health?.infrastructure.edgeFunctions.total || 1) * 100} 
              className="h-1 mt-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              التحديث التلقائي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Badge variant="outline">
                <motion.span
                  className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                />
                نشط
              </Badge>
              <span className="text-sm text-muted-foreground">
                كل 30 ثانية
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modules Health Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            حالة الموديولات (بيانات حية)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {health?.modules && Object.entries(health.modules).map(([key, module], index) => (
                <ModuleHealthCard key={key} module={module} />
              ))}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Summary */}
      <Card className="bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            ملخص الإحصائيات الحية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {health?.modules && Object.entries(health.modules).slice(0, 6).map(([key, module]) => {
              const Icon = moduleIcons[key] || Activity;
              return (
                <div key={key} className="text-center p-3 rounded-lg bg-card border">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-2xl font-bold text-primary">{module.metrics.total}</p>
                  <p className="text-xs text-muted-foreground">{module.nameAr}</p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    {getStatusIcon(module.status)}
                    <span className="text-xs">{module.health}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
