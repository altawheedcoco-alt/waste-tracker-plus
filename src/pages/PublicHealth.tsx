import React from 'react';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Fingerprint, ScanFace, Mic, Bot, Eye, BarChart3, Wind, Ear, Users, ArrowLeft, LogIn, Radio
} from 'lucide-react';
import PPGTab from '@/components/health/PPGTab';
import FaceScanTab from '@/components/health/FaceScanTab';
import VoiceStressTab from '@/components/health/VoiceStressTab';
import HealthCoachTab from '@/components/health/HealthCoachTab';
import HealthLiveTab from '@/components/health/HealthLiveTab';
import EyePostureTab from '@/components/health/EyePostureTab';
import BreathingTab from '@/components/health/BreathingTab';
import HearingSkinTab from '@/components/health/HearingSkinTab';

const PublicHealth = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border/60">
        <div className="container max-w-lg mx-auto flex items-center justify-between py-3 px-4">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            الرئيسية
          </Link>
          <div className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5 text-primary" />
            <span className="font-bold text-sm">iRecycle Health</span>
          </div>
          <Link to="/auth">
            <Button variant="outline" size="sm" className="text-[10px] h-7 gap-1">
              <LogIn className="h-3 w-3" />
              دخول
            </Button>
          </Link>
        </div>
      </div>

      <div className="container max-w-lg mx-auto px-4 py-4 space-y-4">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Fingerprint className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-xl font-bold">iRecycle Health</h1>
          <p className="text-xs text-muted-foreground mt-1">منظومة صحية ذكية متكاملة — 9 أدوات AI مجانية</p>
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
            </TabsList>
          </div>

          <TabsContent value="ppg" className="mt-4"><PPGTab /></TabsContent>
          <TabsContent value="face" className="mt-4"><FaceScanTab /></TabsContent>
          <TabsContent value="voice" className="mt-4"><VoiceStressTab /></TabsContent>
          <TabsContent value="breathing" className="mt-4"><BreathingTab /></TabsContent>
          <TabsContent value="hearing" className="mt-4"><HearingSkinTab /></TabsContent>
          <TabsContent value="eye" className="mt-4"><EyePostureTab /></TabsContent>
          <TabsContent value="coach" className="mt-4"><HealthCoachTab /></TabsContent>
        </Tabs>

        <div className="text-center space-y-3 pb-6">
          <p className="text-[10px] text-muted-foreground">
            ⚠️ هذه الأدوات للأغراض التثقيفية فقط ولا تُغني عن الاستشارة الطبية المتخصصة
          </p>
          <Link to="/auth">
            <Button variant="outline" size="sm" className="gap-2 text-xs">
              <LogIn className="h-3.5 w-3.5" />
              سجّل حساب لحفظ سجلك الصحي
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PublicHealth;
