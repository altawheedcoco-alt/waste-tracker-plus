import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSupportAnalytics } from '@/hooks/useSupportAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  Ticket,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Users,
  ThumbsUp,
  RefreshCw,
  Loader2,
  BarChart3,
  PieChartIcon,
} from 'lucide-react';
import { subDays, subMonths, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';

const COLORS = {
  primary: 'hsl(var(--primary))',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  muted: '#6b7280',
};

const STATUS_COLORS = {
  open: '#3b82f6',
  in_progress: '#f59e0b',
  waiting_response: '#f97316',
  resolved: '#22c55e',
  closed: '#6b7280',
};

const PRIORITY_COLORS = {
  low: '#22c55e',
  medium: '#3b82f6',
  high: '#f59e0b',
  urgent: '#ef4444',
};

const dateRangeOptions = [
  { value: '7d', label: 'آخر 7 أيام' },
  { value: '30d', label: 'آخر 30 يوم' },
  { value: 'month', label: 'هذا الشهر' },
  { value: '3m', label: 'آخر 3 أشهر' },
];

const SupportAnalyticsDashboard = () => {
  const [dateRangeKey, setDateRangeKey] = useState('30d');

  const getDateRange = () => {
    const now = new Date();
    switch (dateRangeKey) {
      case '7d':
        return { start: subDays(now, 7), end: now };
      case '30d':
        return { start: subDays(now, 30), end: now };
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case '3m':
        return { start: subMonths(now, 3), end: now };
      default:
        return { start: subDays(now, 30), end: now };
    }
  };

  const {
    stats,
    callsByDirection,
    ticketsByStatus,
    ticketsByPriority,
    dailyTrends,
    categoryDistribution,
    isLoading,
    refetch,
  } = useSupportAnalytics(getDateRange());

  const statusData = [
    { name: 'مفتوحة', value: ticketsByStatus.open, color: STATUS_COLORS.open },
    { name: 'قيد المعالجة', value: ticketsByStatus.in_progress, color: STATUS_COLORS.in_progress },
    { name: 'انتظار الرد', value: ticketsByStatus.waiting_response, color: STATUS_COLORS.waiting_response },
    { name: 'تم الحل', value: ticketsByStatus.resolved, color: STATUS_COLORS.resolved },
    { name: 'مغلقة', value: ticketsByStatus.closed, color: STATUS_COLORS.closed },
  ].filter(d => d.value > 0);

  const priorityData = [
    { name: 'منخفضة', value: ticketsByPriority.low, color: PRIORITY_COLORS.low },
    { name: 'متوسطة', value: ticketsByPriority.medium, color: PRIORITY_COLORS.medium },
    { name: 'عالية', value: ticketsByPriority.high, color: PRIORITY_COLORS.high },
    { name: 'عاجلة', value: ticketsByPriority.urgent, color: PRIORITY_COLORS.urgent },
  ].filter(d => d.value > 0);

  const directionData = [
    { name: 'واردة', value: callsByDirection.inbound, color: COLORS.info },
    { name: 'صادرة', value: callsByDirection.outbound, color: COLORS.success },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">تحليلات الدعم الفني</h2>
          <p className="text-muted-foreground">إحصائيات المكالمات والتذاكر والأداء</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRangeKey} onValueChange={setDateRangeKey}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dateRangeOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي المكالمات</p>
                  <p className="text-3xl font-bold">{stats.totalCalls}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Phone className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <Badge variant="outline" className="text-blue-600">
                  <PhoneIncoming className="h-3 w-3 ml-1" />
                  {callsByDirection.inbound} واردة
                </Badge>
                <Badge variant="outline" className="text-green-600">
                  <PhoneOutgoing className="h-3 w-3 ml-1" />
                  {callsByDirection.outbound} صادرة
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي التذاكر</p>
                  <p className="text-3xl font-bold">{stats.totalTickets}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Ticket className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <Badge variant="outline" className="text-orange-600">
                  <Clock className="h-3 w-3 ml-1" />
                  {stats.openTickets} مفتوحة
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">التذاكر المحلولة</p>
                  <p className="text-3xl font-bold">{stats.resolvedTickets}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-2">
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  {stats.totalTickets > 0 
                    ? Math.round((stats.resolvedTickets / stats.totalTickets) * 100) 
                    : 0}% معدل الحل
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">رضا العملاء</p>
                  <p className="text-3xl font-bold">{Math.round(stats.satisfactionRate)}%</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <ThumbsUp className="h-6 w-6 text-amber-600" />
                </div>
              </div>
              <div className="mt-2">
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 transition-all"
                    style={{ width: `${stats.satisfactionRate}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">
            <TrendingUp className="h-4 w-4 ml-2" />
            الاتجاهات
          </TabsTrigger>
          <TabsTrigger value="distribution">
            <PieChartIcon className="h-4 w-4 ml-2" />
            التوزيع
          </TabsTrigger>
          <TabsTrigger value="categories">
            <BarChart3 className="h-4 w-4 ml-2" />
            التصنيفات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">اتجاهات المكالمات والتذاكر</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyTrends}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="calls" 
                      name="المكالمات"
                      stroke={COLORS.info} 
                      strokeWidth={2}
                      dot={{ fill: COLORS.info }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="tickets" 
                      name="التذاكر"
                      stroke={COLORS.warning} 
                      strokeWidth={2}
                      dot={{ fill: COLORS.warning }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution">
          <div className="grid md:grid-cols-3 gap-4">
            {/* Tickets by Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">التذاكر حسب الحالة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  {statusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      لا توجد بيانات
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  {statusData.map((item, idx) => (
                    <Badge key={idx} variant="outline" style={{ borderColor: item.color, color: item.color }}>
                      {item.name}: {item.value}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tickets by Priority */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">التذاكر حسب الأولوية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  {priorityData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={priorityData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {priorityData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      لا توجد بيانات
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  {priorityData.map((item, idx) => (
                    <Badge key={idx} variant="outline" style={{ borderColor: item.color, color: item.color }}>
                      {item.name}: {item.value}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Calls by Direction */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">المكالمات حسب الاتجاه</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  {directionData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={directionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {directionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      لا توجد بيانات
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  {directionData.map((item, idx) => (
                    <Badge key={idx} variant="outline" style={{ borderColor: item.color, color: item.color }}>
                      {item.name}: {item.value}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">الكلمات المفتاحية من المكالمات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {categoryDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryDistribution} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" className="text-xs" />
                      <YAxis type="category" dataKey="category" className="text-xs" width={100} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="count" name="التكرار" fill={COLORS.primary} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mb-2 opacity-50" />
                    <p>لا توجد كلمات مفتاحية مسجلة</p>
                    <p className="text-xs">سجّل مكالمات وحللها لرؤية الكلمات المفتاحية</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Urgent Tickets Alert */}
      {ticketsByPriority.urgent > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-red-700 dark:text-red-400">
                    يوجد {ticketsByPriority.urgent} تذاكر عاجلة تحتاج اهتمام فوري
                  </p>
                  <p className="text-sm text-red-600/80">
                    يرجى مراجعة التذاكر العاجلة والرد عليها في أقرب وقت
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default SupportAnalyticsDashboard;
