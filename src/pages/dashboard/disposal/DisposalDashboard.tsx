import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Factory, 
  Truck, 
  FileCheck, 
  BarChart3, 
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Package,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const DisposalDashboard = () => {
  const navigate = useNavigate();
  const { organization } = useAuth();

  // Fetch disposal facility linked to this organization
  const { data: facility } = useQuery({
    queryKey: ['disposal-facility', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      const { data } = await supabase
        .from('disposal_facilities')
        .select('*')
        .eq('organization_id', organization.id)
        .single();
      return data;
    },
    enabled: !!organization?.id
  });

  // Fetch operations stats
  const { data: operationsStats } = useQuery({
    queryKey: ['disposal-operations-stats', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      const { data } = await supabase
        .from('disposal_operations')
        .select('status, quantity')
        .eq('organization_id', organization.id);
      
      const stats = {
        total: data?.length || 0,
        pending: data?.filter(o => o.status === 'pending').length || 0,
        processing: data?.filter(o => o.status === 'processing').length || 0,
        completed: data?.filter(o => o.status === 'completed').length || 0,
        totalQuantity: data?.reduce((acc, o) => acc + (Number(o.quantity) || 0), 0) || 0
      };
      return stats;
    },
    enabled: !!organization?.id
  });

  // Fetch incoming requests
  const { data: incomingRequests } = useQuery({
    queryKey: ['disposal-incoming-requests', facility?.id],
    queryFn: async () => {
      if (!facility?.id) return [];
      const { data } = await supabase
        .from('disposal_incoming_requests')
        .select(`
          *,
          requesting_organization:organizations!disposal_incoming_requests_requesting_organization_id_fkey(name)
        `)
        .eq('disposal_facility_id', facility.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!facility?.id
  });

  const quickActions = [
    { 
      title: 'تسجيل عملية جديدة', 
      icon: Package, 
      color: 'from-red-500 to-orange-600',
      path: '/dashboard/disposal/operations/new'
    },
    { 
      title: 'الطلبات الواردة', 
      icon: Truck, 
      color: 'from-blue-500 to-cyan-600',
      path: '/dashboard/disposal/incoming-requests',
      badge: incomingRequests?.length
    },
    { 
      title: 'إصدار شهادة تخلص', 
      icon: FileCheck, 
      color: 'from-green-500 to-emerald-600',
      path: '/dashboard/disposal/certificates/new'
    },
    { 
      title: 'التقارير والإحصائيات', 
      icon: BarChart3, 
      color: 'from-purple-500 to-violet-600',
      path: '/dashboard/disposal/reports'
    },
  ];

  const statsCards = [
    {
      title: 'إجمالي العمليات',
      value: operationsStats?.total || 0,
      icon: Package,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'قيد المعالجة',
      value: operationsStats?.processing || 0,
      icon: Clock,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10'
    },
    {
      title: 'مكتملة',
      value: operationsStats?.completed || 0,
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    {
      title: 'إجمالي الكميات (طن)',
      value: operationsStats?.totalQuantity?.toFixed(1) || 0,
      icon: TrendingUp,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    },
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
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg">
              <Factory className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">لوحة تحكم جهة التخلص النهائي</h1>
              <p className="text-muted-foreground">
                {facility?.name || 'إدارة عمليات التخلص من المخلفات الخطرة'}
              </p>
            </div>
          </div>

          {facility && (
            <div className="flex items-center gap-2">
              <Badge variant={facility.is_verified ? 'default' : 'secondary'} className="gap-1">
                <Shield className="w-3 h-3" />
                {facility.is_verified ? 'منشأة معتمدة' : 'قيد التحقق'}
              </Badge>
              <Badge variant="outline">
                {facility.facility_type === 'landfill' ? 'مدفن' : 
                 facility.facility_type === 'incinerator' ? 'محرقة' : 
                 facility.facility_type === 'treatment' ? 'معالجة' : facility.facility_type}
              </Badge>
            </div>
          )}
        </motion.div>

        {/* Facility Capacity */}
        {facility && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  السعة التشغيلية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>نسبة الامتلاء الحالية</span>
                  <span className="font-bold">{facility.current_fill_percentage || 0}%</span>
                </div>
                <Progress 
                  value={facility.current_fill_percentage || 0} 
                  className="h-3"
                />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">السعة الكلية:</span>
                    <span className="font-medium mr-1">{facility.total_capacity_tons || '-'} طن</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">السعة اليومية:</span>
                    <span className="font-medium mr-1">{facility.daily_capacity_tons || '-'} طن</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">سعر الطن:</span>
                    <span className="font-medium mr-1">{facility.price_per_ton || '-'} {facility.currency}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">التقييم:</span>
                    <span className="font-medium mr-1">{facility.eeaa_rating || '-'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statsCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + index * 0.05 }}
            >
              <Card 
                className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 relative overflow-hidden group"
                onClick={() => navigate(action.path)}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                <CardContent className="pt-6 text-center">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mx-auto mb-3 shadow-lg`}>
                    <action.icon className="w-7 h-7 text-white" />
                  </div>
                  <p className="font-medium text-sm">{action.title}</p>
                  {action.badge && action.badge > 0 && (
                    <Badge variant="destructive" className="absolute top-2 left-2">
                      {action.badge}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Pending Requests */}
        {incomingRequests && incomingRequests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">طلبات التخلص الواردة</CardTitle>
                  <CardDescription>طلبات جديدة تنتظر الموافقة</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/disposal/incoming-requests')}>
                  عرض الكل
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {incomingRequests.map((request: any) => (
                    <div key={request.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                          <AlertTriangle className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                          <p className="font-medium">{request.waste_description || request.waste_type}</p>
                          <p className="text-sm text-muted-foreground">
                            {request.requesting_organization?.name} • {request.estimated_quantity} {request.unit}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          request.priority === 'urgent' ? 'destructive' :
                          request.priority === 'high' ? 'default' : 'secondary'
                        }>
                          {request.priority === 'urgent' ? 'عاجل' :
                           request.priority === 'high' ? 'مهم' : 'عادي'}
                        </Badge>
                        <Button size="sm" variant="ghost">عرض</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DisposalDashboard;
