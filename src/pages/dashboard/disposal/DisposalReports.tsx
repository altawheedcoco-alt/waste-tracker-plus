import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Package,
  Calendar,
  Download,
  FileText,
  PieChart,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];

const DisposalReports = () => {
  const { organization } = useAuth();
  const [period, setPeriod] = useState('month');

  // Fetch operations for stats
  const { data: operations } = useQuery({
    queryKey: ['disposal-operations-report', organization?.id, period],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      const { data } = await supabase
        .from('disposal_operations')
        .select('*')
        .eq('organization_id', organization.id)
        .order('disposal_date', { ascending: false });

      return data || [];
    },
    enabled: !!organization?.id
  });

  // Calculate stats
  const stats = {
    totalOperations: operations?.length || 0,
    totalQuantity: operations?.reduce((acc, o) => acc + (Number(o.quantity) || 0), 0) || 0,
    completedOperations: operations?.filter(o => o.status === 'completed').length || 0,
    totalRevenue: operations?.reduce((acc, o) => acc + (Number(o.cost) || 0), 0) || 0
  };

  // Group by disposal method
  const methodData = operations?.reduce((acc: any[], op) => {
    const method = op.disposal_method || 'غير محدد';
    const existing = acc.find(m => m.name === method);
    if (existing) {
      existing.value += Number(op.quantity) || 0;
    } else {
      acc.push({ name: getMethodLabel(method), value: Number(op.quantity) || 0 });
    }
    return acc;
  }, []) || [];

  // Group by waste type
  const wasteTypeData = operations?.reduce((acc: any[], op) => {
    const type = op.waste_type || 'غير محدد';
    const existing = acc.find(m => m.name === type);
    if (existing) {
      existing.quantity += Number(op.quantity) || 0;
    } else {
      acc.push({ name: type, quantity: Number(op.quantity) || 0 });
    }
    return acc;
  }, []).slice(0, 6) || [];

  function getMethodLabel(method: string) {
    switch (method) {
      case 'landfill': return 'دفن صحي';
      case 'incineration': return 'حرق';
      case 'chemical_treatment': return 'معالجة كيميائية';
      case 'biological_treatment': return 'معالجة بيولوجية';
      default: return method;
    }
  }

  const summaryCards = [
    {
      title: 'إجمالي العمليات',
      value: stats.totalOperations,
      icon: Package,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'إجمالي الكميات',
      value: `${stats.totalQuantity.toFixed(1)} طن`,
      icon: TrendingUp,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    {
      title: 'العمليات المكتملة',
      value: stats.completedOperations,
      icon: Activity,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    },
    {
      title: 'إجمالي الإيرادات',
      value: `${stats.totalRevenue.toLocaleString()} ج.م`,
      icon: BarChart3,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10'
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 md:p-6" dir="rtl">
        <BackButton />

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">التقارير والإحصائيات</h1>
              <p className="text-muted-foreground text-sm">تحليل شامل لعمليات التخلص</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">هذا الأسبوع</SelectItem>
                <SelectItem value="month">هذا الشهر</SelectItem>
                <SelectItem value="quarter">هذا الربع</SelectItem>
                <SelectItem value="year">هذا العام</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              تصدير
            </Button>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {summaryCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{card.title}</p>
                      <p className="text-2xl font-bold mt-1">{card.value}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl ${card.bgColor} flex items-center justify-center`}>
                      <card.icon className={`w-6 h-6 ${card.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Disposal Methods Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  توزيع طرق التخلص
                </CardTitle>
                <CardDescription>الكميات حسب طريقة التخلص</CardDescription>
              </CardHeader>
              <CardContent>
                {methodData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPie>
                      <Pie
                        data={methodData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {methodData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPie>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    لا توجد بيانات كافية
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Waste Types Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  أنواع المخلفات
                </CardTitle>
                <CardDescription>الكميات حسب نوع المخلف</CardDescription>
              </CardHeader>
              <CardContent>
                {wasteTypeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={wasteTypeData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip />
                      <Bar dataKey="quantity" fill="#ef4444" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    لا توجد بيانات كافية
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Environmental Compliance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">تقارير الامتثال البيئي</CardTitle>
              <CardDescription>تقارير جاهزة للتقديم للجهات الرقابية</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="pt-6 text-center">
                    <FileText className="w-10 h-10 mx-auto text-red-500 mb-3" />
                    <h4 className="font-medium">تقرير شهري للمدفن</h4>
                    <p className="text-sm text-muted-foreground mt-1">تقرير الكميات والعمليات</p>
                    <Button variant="outline" size="sm" className="mt-3 gap-2">
                      <Download className="w-4 h-4" />
                      تحميل
                    </Button>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="pt-6 text-center">
                    <FileText className="w-10 h-10 mx-auto text-amber-500 mb-3" />
                    <h4 className="font-medium">تقرير البيئة EEAA</h4>
                    <p className="text-sm text-muted-foreground mt-1">تقرير للجهاز التنفيذي</p>
                    <Button variant="outline" size="sm" className="mt-3 gap-2">
                      <Download className="w-4 h-4" />
                      تحميل
                    </Button>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="pt-6 text-center">
                    <FileText className="w-10 h-10 mx-auto text-green-500 mb-3" />
                    <h4 className="font-medium">تقرير الاستدامة</h4>
                    <p className="text-sm text-muted-foreground mt-1">تقرير البصمة البيئية</p>
                    <Button variant="outline" size="sm" className="mt-3 gap-2">
                      <Download className="w-4 h-4" />
                      تحميل
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default DisposalReports;
