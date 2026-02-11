import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Search, Package, Truck, Scale, Flame, DollarSign, Clock, CheckCircle, XCircle, FlaskConical, Mountain, FileCheck, Play, AlertTriangle, Lock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

import GateControlTab from '@/components/dashboard/disposal/mission-control/GateControlTab';
import LabTreatmentTab from '@/components/dashboard/disposal/mission-control/LabTreatmentTab';
import CompletionFinanceTab from '@/components/dashboard/disposal/mission-control/CompletionFinanceTab';
import LogisticsTab from '@/components/dashboard/disposal/mission-control/LogisticsTab';
import LandfillCellsTab from '@/components/dashboard/disposal/mission-control/LandfillCellsTab';
import ByProductsTab from '@/components/dashboard/disposal/mission-control/ByProductsTab';
import MROInventoryTab from '@/components/dashboard/disposal/mission-control/MROInventoryTab';
import EnvironmentalTab from '@/components/dashboard/disposal/mission-control/EnvironmentalTab';

const DisposalMissionControl = () => {
  const { organization } = useAuth();
  const [globalSearch, setGlobalSearch] = useState('');
  const [activeTab, setActiveTab] = useState('gate');

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
    enabled: !!organization?.id,
  });

  // Summary stats
  const { data: stats } = useQuery({
    queryKey: ['mc-summary-stats', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return { todayShipments: 0, totalWeight: 0, activeIncinerators: 0, pendingBalance: 0 };
      const today = new Date().toISOString().split('T')[0];
      
      const [opsRes, processingRes, completedRes] = await Promise.all([
        supabase.from('disposal_operations').select('id, quantity', { count: 'exact' }).eq('organization_id', organization.id).gte('created_at', today + 'T00:00:00'),
        supabase.from('disposal_operations').select('id, disposal_method').eq('organization_id', organization.id).eq('status', 'processing'),
        supabase.from('disposal_operations').select('id, cost').eq('organization_id', organization.id).eq('status', 'completed'),
      ]);

      return {
        todayShipments: opsRes.count || 0,
        totalWeight: (opsRes.data || []).reduce((a: number, o: any) => a + (o.quantity || 0), 0),
        activeIncinerators: (processingRes.data || []).filter((o: any) => o.disposal_method === 'incineration').length,
        pendingBalance: (completedRes.data || []).reduce((a: number, o: any) => a + (o.cost || 0), 0),
      };
    },
    enabled: !!organization?.id,
  });

  // Timeline - recent activity
  const { data: timeline = [] } = useQuery({
    queryKey: ['mc-timeline', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from('disposal_operations')
        .select('id, operation_number, waste_description, status, disposal_method, updated_at, receiving_officer')
        .eq('organization_id', organization.id)
        .order('updated_at', { ascending: false })
        .limit(8);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const getTimelineIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing': return <Flame className="w-4 h-4 text-amber-500" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusAr = (status: string) => {
    switch (status) {
      case 'pending': return 'بانتظار';
      case 'processing': return 'قيد المعالجة';
      case 'completed': return 'مكتمل';
      case 'rejected': return 'مرفوض';
      default: return status;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 p-4 md:p-6" dir="rtl">
        <BackButton />

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center shadow-lg">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">مركز القيادة — التخلص الآمن</h1>
              <p className="text-muted-foreground text-sm">{facility?.name || 'منشأة التخلص النهائي'}</p>
            </div>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="بحث (رقم شحنة، عميل، بيان...)"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="pr-10"
            />
          </div>
        </motion.div>

        {/* 4 Summary Cards - TOP */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'شحنات اليوم', value: stats?.todayShipments || 0, icon: Truck, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
            { label: 'إجمالي الأوزان (طن)', value: (stats?.totalWeight || 0).toFixed(1), icon: Scale, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' },
            { label: 'محارق نشطة', value: stats?.activeIncinerators || 0, icon: Flame, color: 'text-red-600 bg-red-100 dark:bg-red-900/30' },
            { label: 'الرصيد المعلق (ج.م)', value: (stats?.pendingBalance || 0).toLocaleString(), icon: DollarSign, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' },
          ].map((stat) => (
            <Card key={stat.label} className="p-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div className="text-right flex-1">
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </Card>
          ))}
        </motion.div>

        {/* 3-Screen Tabs - MIDDLE */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full flex h-auto gap-1 bg-muted/50 p-1.5 rounded-xl flex-wrap">
              <TabsTrigger value="gate" className="flex-1 gap-2 py-3 text-sm data-[state=active]:bg-red-500 data-[state=active]:text-white">
                🚪 الاستقبال
              </TabsTrigger>
              <TabsTrigger value="lab" className="flex-1 gap-2 py-3 text-sm data-[state=active]:bg-amber-500 data-[state=active]:text-white">
                🔬 المختبر
              </TabsTrigger>
              <TabsTrigger value="completion" className="flex-1 gap-2 py-3 text-sm data-[state=active]:bg-green-600 data-[state=active]:text-white">
                📜 الإغلاق
              </TabsTrigger>
              <TabsTrigger value="landfill" className="flex-1 gap-2 py-3 text-sm data-[state=active]:bg-emerald-700 data-[state=active]:text-white">
                ⛏️ خلايا الدفن
              </TabsTrigger>
              <TabsTrigger value="byproducts" className="flex-1 gap-2 py-3 text-sm data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                ♻️ مخلفات ثانوية
              </TabsTrigger>
              <TabsTrigger value="mro" className="flex-1 gap-2 py-3 text-sm data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                🔧 المخزن الفني
              </TabsTrigger>
              <TabsTrigger value="environmental" className="flex-1 gap-2 py-3 text-sm data-[state=active]:bg-teal-600 data-[state=active]:text-white">
                🌍 البيئة والانبعاثات
              </TabsTrigger>
              {facility?.owns_transport_fleet && (
                <TabsTrigger value="logistics" className="flex-1 gap-2 py-3 text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  🚛 النقل
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="gate" className="mt-4">
              <GateControlTab facilityId={facility?.id} organizationId={organization?.id} searchQuery={globalSearch} />
            </TabsContent>
            <TabsContent value="lab" className="mt-4">
              <LabTreatmentTab facilityId={facility?.id} organizationId={organization?.id} searchQuery={globalSearch} />
            </TabsContent>
            <TabsContent value="completion" className="mt-4">
              <CompletionFinanceTab facilityId={facility?.id} organizationId={organization?.id} searchQuery={globalSearch} />
            </TabsContent>
            <TabsContent value="landfill" className="mt-4">
              <LandfillCellsTab facilityId={facility?.id} organizationId={organization?.id} />
            </TabsContent>
            <TabsContent value="byproducts" className="mt-4">
              <ByProductsTab facilityId={facility?.id} organizationId={organization?.id} />
            </TabsContent>
            <TabsContent value="mro" className="mt-4">
              <MROInventoryTab facilityId={facility?.id} organizationId={organization?.id} />
            </TabsContent>
            <TabsContent value="environmental" className="mt-4">
              <EnvironmentalTab facilityId={facility?.id} facility={facility} />
            </TabsContent>
            {facility?.owns_transport_fleet && (
              <TabsContent value="logistics" className="mt-4">
                <LogisticsTab facilityId={facility?.id} organizationId={organization?.id} searchQuery={globalSearch} />
              </TabsContent>
            )}
          </Tabs>
        </motion.div>

        {/* Timeline - BOTTOM */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-5 h-5 text-muted-foreground" />
                آخر العمليات (سجل الشفافية)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {timeline.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">لا توجد عمليات حتى الآن</p>
                ) : (
                  timeline.map((op: any) => (
                    <div key={op.id} className="flex items-center gap-3 py-2 border-b last:border-b-0 border-border/50">
                      {getTimelineIcon(op.status)}
                      <div className="flex-1 text-right">
                        <span className="text-sm font-medium">{op.operation_number || op.id.slice(0, 8)}</span>
                        <span className="text-xs text-muted-foreground mr-2">{op.waste_description}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">{getStatusAr(op.status)}</Badge>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatDistanceToNow(new Date(op.updated_at), { locale: ar, addSuffix: true })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default DisposalMissionControl;
