import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Search, Package } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

import EntryValidationTab from '@/components/dashboard/disposal/mission-control/EntryValidationTab';
import OperationsTab from '@/components/dashboard/disposal/mission-control/OperationsTab';
import ManagementTab from '@/components/dashboard/disposal/mission-control/ManagementTab';
import EnvironmentalTab from '@/components/dashboard/disposal/mission-control/EnvironmentalTab';
import AuditLogTab from '@/components/dashboard/disposal/mission-control/AuditLogTab';

const DisposalMissionControl = () => {
  const { organization } = useAuth();
  const [globalSearch, setGlobalSearch] = useState('');
  const [activeTab, setActiveTab] = useState('entry');

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
              <p className="text-muted-foreground text-sm">{facility?.name || 'منشأة التخلص النهائي'} • المراقبة والتحكم الشامل</p>
            </div>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="بحث سريع (رقم شحنة، عميل، بيان...)"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="pr-10"
            />
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/50 p-1.5 rounded-xl">
              <TabsTrigger value="entry" className="flex-1 min-w-[120px] gap-1.5 data-[state=active]:bg-red-500 data-[state=active]:text-white">
                📥 الاستقبال
              </TabsTrigger>
              <TabsTrigger value="operations" className="flex-1 min-w-[120px] gap-1.5 data-[state=active]:bg-amber-500 data-[state=active]:text-white">
                ⚙️ المعالجة
              </TabsTrigger>
              <TabsTrigger value="management" className="flex-1 min-w-[120px] gap-1.5 data-[state=active]:bg-green-600 data-[state=active]:text-white">
                📋 الإدارة والمالية
              </TabsTrigger>
              <TabsTrigger value="environmental" className="flex-1 min-w-[120px] gap-1.5 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                🌍 المراقبة البيئية
              </TabsTrigger>
              <TabsTrigger value="audit" className="flex-1 min-w-[120px] gap-1.5 data-[state=active]:bg-slate-600 data-[state=active]:text-white">
                🔒 سجل التدقيق
              </TabsTrigger>
            </TabsList>

            <TabsContent value="entry" className="mt-4">
              <EntryValidationTab facilityId={facility?.id} organizationId={organization?.id} searchQuery={globalSearch} />
            </TabsContent>
            <TabsContent value="operations" className="mt-4">
              <OperationsTab facilityId={facility?.id} organizationId={organization?.id} searchQuery={globalSearch} />
            </TabsContent>
            <TabsContent value="management" className="mt-4">
              <ManagementTab facilityId={facility?.id} organizationId={organization?.id} searchQuery={globalSearch} />
            </TabsContent>
            <TabsContent value="environmental" className="mt-4">
              <EnvironmentalTab facilityId={facility?.id} facility={facility} />
            </TabsContent>
            <TabsContent value="audit" className="mt-4">
              <AuditLogTab organizationId={organization?.id} />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default DisposalMissionControl;
