import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, ShieldAlert, ShieldCheck, AlertTriangle,
  Activity, Key, UserX, TrendingUp, Filter,
  RefreshCw, Download
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  useSecuritySummary, 
  useSecurityEvents,
  SecurityEventType,
  SecuritySeverity,
  eventTypeLabels
} from '@/hooks/useSecurityEvents';
import { SecurityEventsList } from './SecurityEventsList';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface SecurityDashboardProps {
  organizationId?: string;
}

export const SecurityDashboard = memo(function SecurityDashboard({
  organizationId,
}: SecurityDashboardProps) {
  const { profile } = useAuth();
  const [days, setDays] = useState(7);
  const [severityFilter, setSeverityFilter] = useState<SecuritySeverity | 'all'>('all');
  const [eventTypeFilter, setEventTypeFilter] = useState<SecurityEventType | 'all'>('all');
  
  const { data: summary, isLoading: summaryLoading, refetch } = useSecuritySummary(
    organizationId || profile?.organization_id || undefined,
    days
  );
  
  const stats = [
    {
      title: 'إجمالي الأحداث',
      value: summary?.total_events || 0,
      icon: Activity,
      color: 'text-blue-500',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      title: 'أحداث حرجة',
      value: summary?.critical_events || 0,
      icon: ShieldAlert,
      color: 'text-red-500',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      highlight: (summary?.critical_events || 0) > 0,
    },
    {
      title: 'أحداث مشبوهة',
      value: summary?.suspicious_events || 0,
      icon: AlertTriangle,
      color: 'text-orange-500',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      highlight: (summary?.suspicious_events || 0) > 0,
    },
    {
      title: 'غير محلولة',
      value: summary?.unresolved_events || 0,
      icon: Shield,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      highlight: (summary?.unresolved_events || 0) > 0,
    },
    {
      title: 'محاولات دخول فاشلة',
      value: summary?.login_failures || 0,
      icon: UserX,
      color: 'text-purple-500',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    },
    {
      title: 'أحداث API',
      value: summary?.api_key_events || 0,
      icon: Key,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    },
  ];
  
  const filters = {
    severity: severityFilter !== 'all' ? severityFilter : undefined,
    eventType: eventTypeFilter !== 'all' ? eventTypeFilter : undefined,
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 text-white">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">مراقبة الأمان</h1>
            <p className="text-muted-foreground">تتبع الأحداث الأمنية والتنبيهات</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">آخر 24 ساعة</SelectItem>
              <SelectItem value="7">آخر 7 أيام</SelectItem>
              <SelectItem value="30">آخر 30 يوم</SelectItem>
              <SelectItem value="90">آخر 90 يوم</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className={cn(
              "transition-all",
              stat.highlight && "ring-2 ring-red-500/50"
            )}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg", stat.bgColor)}>
                    <stat.icon className={cn("w-5 h-5", stat.color)} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      
      {/* Events Tabs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                سجل الأحداث الأمنية
              </CardTitle>
              <CardDescription>
                جميع الأحداث الأمنية المسجلة في النظام
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select 
                value={severityFilter} 
                onValueChange={(v) => setSeverityFilter(v as SecuritySeverity | 'all')}
              >
                <SelectTrigger className="w-[120px]">
                  <Filter className="w-4 h-4 ml-2" />
                  <SelectValue placeholder="الأهمية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="critical">حرج</SelectItem>
                  <SelectItem value="high">عالي</SelectItem>
                  <SelectItem value="medium">متوسط</SelectItem>
                  <SelectItem value="low">منخفض</SelectItem>
                </SelectContent>
              </Select>
              <Select 
                value={eventTypeFilter} 
                onValueChange={(v) => setEventTypeFilter(v as SecurityEventType | 'all')}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="نوع الحدث" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الأنواع</SelectItem>
                  <SelectItem value="login_failed">فشل تسجيل الدخول</SelectItem>
                  <SelectItem value="login_success">تسجيل دخول ناجح</SelectItem>
                  <SelectItem value="suspicious_activity">نشاط مشبوه</SelectItem>
                  <SelectItem value="api_key_created">إنشاء مفتاح API</SelectItem>
                  <SelectItem value="password_change">تغيير كلمة المرور</SelectItem>
                  <SelectItem value="2fa_enabled">تفعيل 2FA</SelectItem>
                  <SelectItem value="2fa_disabled">إلغاء 2FA</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" dir="rtl">
            <TabsList className="mb-4">
              <TabsTrigger value="all" className="gap-2">
                <Activity className="w-4 h-4" />
                الكل
              </TabsTrigger>
              <TabsTrigger value="suspicious" className="gap-2">
                <AlertTriangle className="w-4 h-4" />
                مشبوهة
                {(summary?.unresolved_events || 0) > 0 && (
                  <Badge variant="destructive" className="mr-1 h-5 px-1.5">
                    {summary?.unresolved_events}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="resolved" className="gap-2">
                <ShieldCheck className="w-4 h-4" />
                محلولة
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              <SecurityEventsList filters={filters} />
            </TabsContent>
            
            <TabsContent value="suspicious">
              <SecurityEventsList 
                filters={{ 
                  ...filters, 
                  isSuspicious: true, 
                  isResolved: false 
                }} 
              />
            </TabsContent>
            
            <TabsContent value="resolved">
              <SecurityEventsList 
                filters={{ 
                  ...filters, 
                  isResolved: true 
                }} 
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
});
