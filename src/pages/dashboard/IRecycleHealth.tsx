import React from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Fingerprint, ScanFace, Mic, Bot, Eye, BarChart3, Wind, Ear, Users, Radio
} from 'lucide-react';
import PPGTab from '@/components/health/PPGTab';
import FaceScanTab from '@/components/health/FaceScanTab';
import VoiceStressTab from '@/components/health/VoiceStressTab';
import HealthCoachTab from '@/components/health/HealthCoachTab';
import HealthLiveTab from '@/components/health/HealthLiveTab';
import EyePostureTab from '@/components/health/EyePostureTab';
import HealthHistoryTab from '@/components/health/HealthHistoryTab';
import BreathingTab from '@/components/health/BreathingTab';
import HearingSkinTab from '@/components/health/HearingSkinTab';
import TeamHealthTab from '@/components/health/TeamHealthTab';

const IRecycleHealth = () => {
  return (
    <DashboardLayout>
      <div className="space-y-4 max-w-lg mx-auto">
        <BackButton />

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
            <Fingerprint className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">iRecycle Health</h1>
            <p className="text-xs text-muted-foreground">منظومة صحية ذكية متكاملة — 9 أدوات AI</p>
          </div>
        </div>

        <Tabs defaultValue="ppg" className="w-full" dir="rtl">
          <div className="overflow-x-auto scrollbar-hide -mx-3 px-3 pb-1">
            <TabsList className="inline-flex w-max gap-0.5 h-auto p-1">
              <TabsTrigger value="ppg" className="flex items-center gap-1 text-[9px] px-2 py-1.5 whitespace-nowrap">
                <Fingerprint className="w-3 h-3 shrink-0" />البصمة
              </TabsTrigger>
              <TabsTrigger value="face" className="flex items-center gap-1 text-[9px] px-2 py-1.5 whitespace-nowrap">
                <ScanFace className="w-3 h-3 shrink-0" />الوجه
              </TabsTrigger>
              <TabsTrigger value="voice" className="flex items-center gap-1 text-[9px] px-2 py-1.5 whitespace-nowrap">
                <Mic className="w-3 h-3 shrink-0" />الصوت
              </TabsTrigger>
              <TabsTrigger value="breathing" className="flex items-center gap-1 text-[9px] px-2 py-1.5 whitespace-nowrap">
                <Wind className="w-3 h-3 shrink-0" />التنفس
              </TabsTrigger>
              <TabsTrigger value="hearing" className="flex items-center gap-1 text-[9px] px-2 py-1.5 whitespace-nowrap">
                <Ear className="w-3 h-3 shrink-0" />السمع/الجلد
              </TabsTrigger>
              <TabsTrigger value="eye" className="flex items-center gap-1 text-[9px] px-2 py-1.5 whitespace-nowrap">
                <Eye className="w-3 h-3 shrink-0" />العين
              </TabsTrigger>
              <TabsTrigger value="coach" className="flex items-center gap-1 text-[9px] px-2 py-1.5 whitespace-nowrap">
                <Bot className="w-3 h-3 shrink-0" />المدرب
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-1 text-[9px] px-2 py-1.5 whitespace-nowrap">
                <BarChart3 className="w-3 h-3 shrink-0" />السجل
              </TabsTrigger>
              <TabsTrigger value="team" className="flex items-center gap-1 text-[9px] px-2 py-1.5 whitespace-nowrap">
                <Users className="w-3 h-3 shrink-0" />الفريق
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="ppg" className="mt-4"><PPGTab /></TabsContent>
          <TabsContent value="face" className="mt-4"><FaceScanTab /></TabsContent>
          <TabsContent value="voice" className="mt-4"><VoiceStressTab /></TabsContent>
          <TabsContent value="breathing" className="mt-4"><BreathingTab /></TabsContent>
          <TabsContent value="hearing" className="mt-4"><HearingSkinTab /></TabsContent>
          <TabsContent value="eye" className="mt-4"><EyePostureTab /></TabsContent>
          <TabsContent value="coach" className="mt-4"><HealthCoachTab /></TabsContent>
          <TabsContent value="history" className="mt-4"><HealthHistoryTab /></TabsContent>
          <TabsContent value="team" className="mt-4"><TeamHealthTab /></TabsContent>
        </Tabs>

        <p className="text-[10px] text-muted-foreground text-center pb-4">
          ⚠️ هذه الأدوات للأغراض التثقيفية فقط ولا تُغني عن الاستشارة الطبية المتخصصة
        </p>
      </div>
    </DashboardLayout>
  );
};

export default IRecycleHealth;
