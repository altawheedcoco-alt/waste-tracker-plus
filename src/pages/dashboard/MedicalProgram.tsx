import React, { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Stethoscope, FileCheck, Syringe, AlertTriangle, Biohazard, 
  Activity, Users, ShieldCheck, TrendingUp, Heart
} from 'lucide-react';
import { useMedicalStats } from '@/hooks/useMedicalProgram';
import MedicalExaminationsTab from '@/components/medical/MedicalExaminationsTab';
import MedicalCertificatesTab from '@/components/medical/MedicalCertificatesTab';
import VaccinationsTab from '@/components/medical/VaccinationsTab';
import InjuriesTab from '@/components/medical/InjuriesTab';
import HazardousExposureTab from '@/components/medical/HazardousExposureTab';
import IoTMedicalTab from '@/components/medical/IoTMedicalTab';

const MedicalProgram = () => {
  const { data: stats, isLoading } = useMedicalStats();
  const [activeTab, setActiveTab] = useState('examinations');

  const kpis = [
    { label: 'الفحوصات', value: stats?.totalExams || 0, sub: `${stats?.completedExams || 0} مكتمل`, icon: Stethoscope, color: 'text-blue-600 bg-blue-100' },
    { label: 'الشهادات الفعالة', value: stats?.activeCerts || 0, sub: `من ${stats?.totalCertificates || 0}`, icon: FileCheck, color: 'text-emerald-600 bg-emerald-100' },
    { label: 'التطعيمات', value: stats?.totalVaccinations || 0, sub: 'إجمالي', icon: Syringe, color: 'text-purple-600 bg-purple-100' },
    { label: 'الإصابات', value: stats?.totalInjuries || 0, sub: `${stats?.severeInjuries || 0} خطيرة`, icon: AlertTriangle, color: 'text-red-600 bg-red-100' },
    { label: 'التعرض للمواد', value: stats?.totalExposures || 0, sub: `${stats?.highExposures || 0} عالي`, icon: Biohazard, color: 'text-amber-600 bg-amber-100' },
    { label: 'اللائقين طبياً', value: stats?.fitEmployees || 0, sub: 'موظف', icon: ShieldCheck, color: 'text-green-600 bg-green-100' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <BackButton />
        
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center shadow-lg">
            <Heart className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">البرنامج الطبي الشامل</h1>
            <p className="text-xs text-muted-foreground">إدارة الصحة المهنية والفحوصات والتطعيمات</p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-2">
          {kpis.map((kpi, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-3 text-center">
                <div className={`w-8 h-8 rounded-xl ${kpi.color} flex items-center justify-center mx-auto mb-1.5`}>
                  <kpi.icon className="h-4 w-4" />
                </div>
                <p className="text-lg font-bold">{kpi.value}</p>
                <p className="text-[10px] font-medium text-foreground">{kpi.label}</p>
                <p className="text-[9px] text-muted-foreground">{kpi.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3 h-auto gap-1 bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="examinations" className="text-[10px] py-1.5 gap-1 data-[state=active]:bg-background rounded-lg">
              <Stethoscope className="h-3 w-3" />
              الفحوصات
            </TabsTrigger>
            <TabsTrigger value="certificates" className="text-[10px] py-1.5 gap-1 data-[state=active]:bg-background rounded-lg">
              <FileCheck className="h-3 w-3" />
              الشهادات
            </TabsTrigger>
            <TabsTrigger value="vaccinations" className="text-[10px] py-1.5 gap-1 data-[state=active]:bg-background rounded-lg">
              <Syringe className="h-3 w-3" />
              التطعيمات
            </TabsTrigger>
          </TabsList>

          <TabsList className="w-full grid grid-cols-3 h-auto gap-1 bg-muted/50 p-1 rounded-xl mt-1">
            <TabsTrigger value="injuries" className="text-[10px] py-1.5 gap-1 data-[state=active]:bg-background rounded-lg">
              <AlertTriangle className="h-3 w-3" />
              الإصابات
            </TabsTrigger>
            <TabsTrigger value="exposure" className="text-[10px] py-1.5 gap-1 data-[state=active]:bg-background rounded-lg">
              <Biohazard className="h-3 w-3" />
              التعرض
            </TabsTrigger>
            <TabsTrigger value="iot" className="text-[10px] py-1.5 gap-1 data-[state=active]:bg-background rounded-lg">
              <Activity className="h-3 w-3" />
              IoT طبي
            </TabsTrigger>
          </TabsList>

          <TabsContent value="examinations"><MedicalExaminationsTab /></TabsContent>
          <TabsContent value="certificates"><MedicalCertificatesTab /></TabsContent>
          <TabsContent value="vaccinations"><VaccinationsTab /></TabsContent>
          <TabsContent value="injuries"><InjuriesTab /></TabsContent>
          <TabsContent value="exposure"><HazardousExposureTab /></TabsContent>
          <TabsContent value="iot"><IoTMedicalTab /></TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default MedicalProgram;
