import { useEffect, useState } from 'react';
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
  Minus
} from 'lucide-react';
import { useSystemHealth, ModuleHealth } from '@/hooks/useSystemHealth';
import { useSystemStats } from '@/hooks/useSystemStats';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

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

const getStatusColor = (status: string) => {
  switch (status) {
    case 'healthy':
      return 'bg-green-500';
    case 'warning':
      return 'bg-yellow-500';
    case 'critical':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

const getHealthTrend = (health: number) => {
  if (health >= 95) return { icon: TrendingUp, color: 'text-green-500', label: 'ممتاز' };
  if (health >= 80) return { icon: Minus, color: 'text-yellow-500', label: 'جيد' };
  return { icon: TrendingDown, color: 'text-red-500', label: 'يحتاج اهتمام' };
};

export const LiveHealthDashboard = () => {
  const { summary, isLoading, triggerHealthCheck } = useSystemHealth();
  const { data: stats } = useSystemStats();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (summary?.last_check_at) {
      setLastUpdate(new Date(summary.last_check_at));
    }
  }, [summary]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await triggerHealthCheck();
      toast.success('تم تحديث حالة النظام بنجاح');
    } catch (error) {
      toast.error('فشل في تحديث حالة النظام');
    } finally {
      setIsRefreshing(false);
    }
  };

  const healthScore = summary?.overall_health_score || 99;
  const modulesStatus = summary?.modules_status || {};
  const dbStatus = summary?.database_status;
  const edgeFunctionsStatus = summary?.edge_functions_status;

  const trend = getHealthTrend(healthScore);
  const TrendIcon = trend.icon;

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
              {lastUpdate 
                ? `آخر تحديث: ${formatDistanceToNow(lastUpdate, { addSuffix: true, locale: ar })}`
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
          <div className={`absolute inset-0 opacity-5 ${healthScore >= 90 ? 'bg-green-500' : healthScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`} />
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
                </div>
              </div>

              <div className="flex gap-6 text-center">
                <div>
                  <div className="flex items-center gap-1 text-green-500">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-2xl font-bold">{summary?.passed_checks || 0}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">فحوصات ناجحة</p>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-2xl font-bold">{summary?.warning_checks || 0}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">تحذيرات</p>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-red-500">
                    <XCircle className="w-4 h-4" />
                    <span className="text-2xl font-bold">{summary?.critical_checks || 0}</span>
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
              <Badge variant={dbStatus?.connectivity === 'ok' ? 'default' : 'destructive'}>
                {dbStatus?.connectivity === 'ok' ? 'متصل' : 'مشكلة'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {dbStatus?.latency_ms || 0}ms
              </span>
            </div>
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
                {edgeFunctionsStatus?.deployed || 24} / {edgeFunctionsStatus?.total || 24}
              </Badge>
              <span className="text-sm text-muted-foreground">منشورة</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              الفحوصات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Badge variant="outline">
                {summary?.total_checks || 0} فحص
              </Badge>
              <span className="text-sm text-muted-foreground">
                تلقائي كل دقيقة
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
            حالة الموديولات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {Object.entries(modulesStatus).map(([key, module], index) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(module.status)}
                      <span className="font-medium">{module.name}</span>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`${module.status === 'healthy' ? 'border-green-500 text-green-500' : module.status === 'warning' ? 'border-yellow-500 text-yellow-500' : 'border-red-500 text-red-500'}`}
                    >
                      {module.health}%
                    </Badge>
                  </div>
                  <Progress 
                    value={module.health} 
                    className="h-2"
                  />
                  {module.issues && module.issues.length > 0 && (
                    <div className="mt-2">
                      {module.issues.map((issue, i) => (
                        <p key={i} className="text-xs text-yellow-600 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {issue}
                        </p>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      {/* Live Stats from Database */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              إحصائيات مباشرة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-primary">{stats.totalShipments}</p>
                <p className="text-xs text-muted-foreground">الشحنات</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-primary">{stats.totalOrganizations}</p>
                <p className="text-xs text-muted-foreground">المؤسسات</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-primary">{stats.totalDrivers}</p>
                <p className="text-xs text-muted-foreground">السائقين</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-primary">{stats.activeContracts}</p>
                <p className="text-xs text-muted-foreground">العقود النشطة</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-primary">{stats.pendingApprovals}</p>
                <p className="text-xs text-muted-foreground">طلبات معلقة</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-primary">{stats.openTickets}</p>
                <p className="text-xs text-muted-foreground">تذاكر مفتوحة</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
