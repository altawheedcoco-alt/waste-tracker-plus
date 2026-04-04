import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { useDataPreloader } from '@/hooks/useDataPreloader';
import { offlineStorage } from '@/lib/offlineStorage';
import { cn } from '@/lib/utils';
import {
  Wifi,
  WifiOff,
  CloudOff,
  Cloud,
  Database,
  RefreshCw,
  Trash2,
  HardDrive,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Shield,
  ArrowDownToLine,
  Loader2,
  Signal,
  SignalLow,
  SignalMedium,
  SignalHigh,
  FileText,
  Activity,
} from 'lucide-react';
import { toast } from 'sonner';

interface StorageStats {
  pendingActions: number;
  cachedItems: number;
  drafts: number;
}

const OfflineMode = () => {
  const { isOnline, isSlowConnection, connectionType, effectiveType, downlink, rtt } = useNetworkStatus();
  const { isSyncing, pendingCount, lastSyncAt, errors, syncNow } = useOfflineSync();
  const [stats, setStats] = useState<StorageStats>({ pendingActions: 0, cachedItems: 0, drafts: 0 });
  const [storageUsage, setStorageUsage] = useState<{ used: number; quota: number } | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  

  const refreshStats = useCallback(async () => {
    try {
      const s = await offlineStorage.getStats();
      setStats(s);
    } catch (e) {
      console.error('Failed to get offline stats:', e);
    }
  }, []);

  useEffect(() => {
    refreshStats();
    const interval = setInterval(refreshStats, 5000);
    return () => clearInterval(interval);
  }, [refreshStats]);

  // Check storage quota
  useEffect(() => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then(est => {
        setStorageUsage({ used: est.usage || 0, quota: est.quota || 0 });
      });
    }
  }, [stats]);


  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      const deleted = await offlineStorage.cleanupExpiredCache();
      toast.success(`تم تنظيف ${deleted} عنصر منتهي الصلاحية`);
      await refreshStats();
    } catch (e) {
      toast.error('فشل في تنظيف الذاكرة المؤقتة');
    } finally {
      setIsClearing(false);
    }
  };

  const handleForceSync = async () => {
    if (pendingCount === 0) {
      toast.info('لا توجد عمليات معلقة للمزامنة');
      return;
    }
    syncNow();
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 بايت';
    const k = 1024;
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getSignalIcon = () => {
    if (!isOnline) return <WifiOff className="h-5 w-5" />;
    if (isSlowConnection) return <SignalLow className="h-5 w-5" />;
    if (effectiveType === '3g') return <SignalMedium className="h-5 w-5" />;
    return <SignalHigh className="h-5 w-5" />;
  };

  const getConnectionQuality = () => {
    if (!isOnline) return { label: 'غير متصل', color: 'text-destructive', bg: 'bg-destructive/10' };
    if (isSlowConnection) return { label: 'اتصال ضعيف', color: 'text-amber-500', bg: 'bg-amber-500/10' };
    if (effectiveType === '3g') return { label: 'اتصال متوسط', color: 'text-blue-500', bg: 'bg-blue-500/10' };
    return { label: 'اتصال ممتاز', color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
  };

  const quality = getConnectionQuality();
  const storagePercent = storageUsage ? (storageUsage.used / storageUsage.quota) * 100 : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6" dir="rtl">
        <BackButton />
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">وضع عدم الاتصال</h1>
            <p className="text-muted-foreground text-sm">
              إدارة البيانات المحلية والمزامنة والعمل بدون إنترنت
            </p>
          </div>
          <Badge
            variant={isOnline ? 'default' : 'destructive'}
            className="text-sm px-3 py-1 gap-1.5"
          >
            {isOnline ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
            {isOnline ? 'متصل' : 'غير متصل'}
          </Badge>
        </div>

        {/* Connection Status Card */}
        <Card className="overflow-hidden">
          <div className={cn('h-1.5', isOnline ? 'bg-emerald-500' : 'bg-destructive')} />
          <CardContent className="pt-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Connection Quality */}
              <div className={cn('rounded-xl p-4 text-center', quality.bg)}>
                <div className={cn('mx-auto mb-2', quality.color)}>
                  {getSignalIcon()}
                </div>
                <p className={cn('font-bold text-lg', quality.color)}>{quality.label}</p>
                <p className="text-xs text-muted-foreground mt-1">حالة الشبكة</p>
              </div>

              {/* Speed */}
              <div className="rounded-xl p-4 text-center bg-muted/50">
                <Zap className="h-5 w-5 mx-auto mb-2 text-primary" />
                <p className="font-bold text-lg">{downlink ? `${downlink} Mbps` : '—'}</p>
                <p className="text-xs text-muted-foreground mt-1">سرعة التنزيل</p>
              </div>

              {/* Latency */}
              <div className="rounded-xl p-4 text-center bg-muted/50">
                <Activity className="h-5 w-5 mx-auto mb-2 text-primary" />
                <p className="font-bold text-lg">{rtt ? `${rtt} ms` : '—'}</p>
                <p className="text-xs text-muted-foreground mt-1">زمن الاستجابة</p>
              </div>

              {/* Connection Type */}
              <div className="rounded-xl p-4 text-center bg-muted/50">
                <Signal className="h-5 w-5 mx-auto mb-2 text-primary" />
                <p className="font-bold text-lg">{effectiveType?.toUpperCase() || '—'}</p>
                <p className="text-xs text-muted-foreground mt-1">نوع الاتصال</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sync Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Cloud className="h-5 w-5 text-primary" />
                حالة المزامنة
              </CardTitle>
              <CardDescription>العمليات المعلقة والمزامنة التلقائية</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Pending Actions */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  {pendingCount > 0 ? (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  )}
                  <span className="text-sm font-medium">عمليات معلقة</span>
                </div>
                <Badge variant={pendingCount > 0 ? 'destructive' : 'secondary'}>
                  {pendingCount}
                </Badge>
              </div>

              {/* Last Sync */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">آخر مزامنة</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {lastSyncAt
                    ? new Date(lastSyncAt).toLocaleString('ar-EG', { 
                        hour: '2-digit', minute: '2-digit', second: '2-digit' 
                      })
                    : 'لم تتم بعد'}
                </span>
              </div>

              {/* Sync Errors */}
              {errors.length > 0 && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 space-y-1">
                  <p className="text-sm font-medium text-destructive">أخطاء المزامنة:</p>
                  {errors.map((err, i) => (
                    <p key={i} className="text-xs text-destructive/80">• {err}</p>
                  ))}
                </div>
              )}

              {/* Sync Button */}
              <Button
                onClick={handleForceSync}
                disabled={isSyncing || !isOnline || pendingCount === 0}
                className="w-full gap-2"
              >
                {isSyncing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {isSyncing ? 'جاري المزامنة...' : 'مزامنة الآن'}
              </Button>
            </CardContent>
          </Card>

          {/* Local Storage */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-primary" />
                التخزين المحلي
              </CardTitle>
              <CardDescription>البيانات المحفوظة على جهازك</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Storage Usage Bar */}
              {storageUsage && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">المساحة المستخدمة</span>
                    <span className="font-medium">
                      {formatBytes(storageUsage.used)} / {formatBytes(storageUsage.quota)}
                    </span>
                  </div>
                  <Progress value={storagePercent} className="h-2" />
                  <p className="text-xs text-muted-foreground text-left">
                    {storagePercent.toFixed(1)}% مستخدم
                  </p>
                </div>
              )}

              <Separator />

              {/* Storage Breakdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <CloudOff className="h-4 w-4 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">عمليات معلقة</p>
                      <p className="text-xs text-muted-foreground">تنتظر الاتصال</p>
                    </div>
                  </div>
                  <Badge variant="outline">{stats.pendingActions}</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Database className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">بيانات مؤقتة</p>
                      <p className="text-xs text-muted-foreground">للوصول السريع</p>
                    </div>
                  </div>
                  <Badge variant="outline">{stats.cachedItems}</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">المسودات</p>
                      <p className="text-xs text-muted-foreground">نماذج غير مكتملة</p>
                    </div>
                  </div>
                  <Badge variant="outline">{stats.drafts}</Badge>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={handleClearCache}
                disabled={isClearing}
                className="w-full gap-2"
              >
                {isClearing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                تنظيف الذاكرة المؤقتة
              </Button>
            </CardContent>
          </Card>
        </div>


        {/* How Offline Mode Works */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">كيف يعمل وضع عدم الاتصال؟</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  step: '١',
                  title: 'تخزين تلقائي',
                  desc: 'يتم حفظ البيانات والصفحات تلقائياً على جهازك أثناء التصفح',
                  icon: Database,
                  color: 'text-blue-500',
                },
                {
                  step: '٢',
                  title: 'عمل بلا انقطاع',
                  desc: 'عند انقطاع الاتصال، يمكنك الاستمرار في العمل والبيانات تُحفظ محلياً',
                  icon: CloudOff,
                  color: 'text-amber-500',
                },
                {
                  step: '٣',
                  title: 'مزامنة تلقائية',
                  desc: 'عند عودة الاتصال، تتم مزامنة جميع التغييرات تلقائياً مع السيرفر',
                  icon: RefreshCw,
                  color: 'text-emerald-500',
                },
                {
                  step: '٤',
                  title: 'حماية البيانات',
                  desc: 'بياناتك مشفرة ومحمية حتى في وضع عدم الاتصال',
                  icon: Shield,
                  color: 'text-purple-500',
                },
              ].map((item) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: parseInt(item.step) * 0.1 }}
                  className="text-center p-4 rounded-xl bg-muted/30 border border-border/50"
                >
                  <div className={cn('w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-3')}>
                    <item.icon className={cn('h-5 w-5', item.color)} />
                  </div>
                  <Badge variant="outline" className="mb-2">خطوة {item.step}</Badge>
                  <h3 className="font-semibold text-sm mt-2">{item.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default OfflineMode;
