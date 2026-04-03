import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Recycle, FileCheck, Network, BarChart3, Brain } from 'lucide-react';
import BackButton from '@/components/ui/back-button';
import DPPManager from '@/components/circular-economy/DPPManager';
import SymbiosisNetwork from '@/components/circular-economy/SymbiosisNetwork';
import CircularityDashboard from '@/components/circular-economy/CircularityDashboard';
import AIMatchingPanel from '@/components/circular-economy/AIMatchingPanel';

const CircularEconomy = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background p-4 md:p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        <BackButton />
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <Recycle className="w-7 h-7 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">منظومة الاقتصاد الدوار</h1>
            <p className="text-sm text-muted-foreground">Circular Economy System - تتبع دورة حياة المواد والتكافل الصناعي</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="dashboard" className="gap-1.5 text-xs">
              <BarChart3 className="w-4 h-4" />
              لوحة الدائرية
            </TabsTrigger>
            <TabsTrigger value="dpp" className="gap-1.5 text-xs">
              <FileCheck className="w-4 h-4" />
              جواز المنتج
            </TabsTrigger>
            <TabsTrigger value="symbiosis" className="gap-1.5 text-xs">
              <Network className="w-4 h-4" />
              التكافل الصناعي
            </TabsTrigger>
            <TabsTrigger value="ai-matching" className="gap-1.5 text-xs">
              <Brain className="w-4 h-4" />
              المطابقة الذكية
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-4">
            <CircularityDashboard />
          </TabsContent>
          <TabsContent value="dpp" className="mt-4">
            <DPPManager />
          </TabsContent>
          <TabsContent value="symbiosis" className="mt-4">
            <SymbiosisNetwork />
          </TabsContent>
          <TabsContent value="ai-matching" className="mt-4">
            <AIMatchingPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CircularEconomy;
