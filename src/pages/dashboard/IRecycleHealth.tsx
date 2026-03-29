import React from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Fingerprint, ScanFace, Mic, Bot, Eye
} from 'lucide-react';

import PPGTab from '@/components/health/PPGTab';
import FaceScanTab from '@/components/health/FaceScanTab';
import VoiceStressTab from '@/components/health/VoiceStressTab';
import HealthCoachTab from '@/components/health/HealthCoachTab';
import EyePostureTab from '@/components/health/EyePostureTab';

const IRecycleHealth = () => {
  return (
    <DashboardLayout>
      <div className="space-y-4 max-w-lg mx-auto">
        <BackButton />

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
            <Fingerprint className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">iRecycle Health</h1>
            <p className="text-xs text-muted-foreground">منظومة صحية ذكية متكاملة بتقنيات AI</p>
          </div>
        </div>

        <Tabs defaultValue="ppg" className="w-full" dir="rtl">
          <div className="overflow-x-auto scrollbar-hide -mx-3 px-3 pb-1">
            <TabsList className="inline-flex w-max gap-0.5 h-auto p-1">
              <TabsTrigger value="ppg" className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 whitespace-nowrap">
                <Fingerprint className="w-3.5 h-3.5 shrink-0" />
                البصمة الضوئية
              </TabsTrigger>
              <TabsTrigger value="face" className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 whitespace-nowrap">
                <ScanFace className="w-3.5 h-3.5 shrink-0" />
                مسح الوجه
              </TabsTrigger>
              <TabsTrigger value="voice" className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 whitespace-nowrap">
                <Mic className="w-3.5 h-3.5 shrink-0" />
                تحليل الصوت
              </TabsTrigger>
              <TabsTrigger value="coach" className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 whitespace-nowrap">
                <Bot className="w-3.5 h-3.5 shrink-0" />
                المدرب الصحي
              </TabsTrigger>
              <TabsTrigger value="eye" className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 whitespace-nowrap">
                <Eye className="w-3.5 h-3.5 shrink-0" />
                حارس العين
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="ppg" className="mt-4">
            <PPGTab />
          </TabsContent>
          <TabsContent value="face" className="mt-4">
            <FaceScanTab />
          </TabsContent>
          <TabsContent value="voice" className="mt-4">
            <VoiceStressTab />
          </TabsContent>
          <TabsContent value="coach" className="mt-4">
            <HealthCoachTab />
          </TabsContent>
          <TabsContent value="eye" className="mt-4">
            <EyePostureTab />
          </TabsContent>
        </Tabs>

        <p className="text-[10px] text-muted-foreground text-center pb-4">
          ⚠️ هذه الأدوات للأغراض التثقيفية فقط ولا تُغني عن الاستشارة الطبية المتخصصة
        </p>
      </div>
    </DashboardLayout>
  );
};

export default IRecycleHealth;
