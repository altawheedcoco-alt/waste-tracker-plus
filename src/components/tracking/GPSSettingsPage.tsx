import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Radio, Settings, Plug, Activity, Car, FileText } from 'lucide-react';
import GPSDeviceManager from './GPSDeviceManager';
import GPSDeviceRegistration from './GPSDeviceRegistration';
import GPSConnectionTester from './GPSConnectionTester';
import GPSProtocolGuide from './GPSProtocolGuide';
import GPSVehicleBinding from './GPSVehicleBinding';
import GPSTrackingDashboard from './GPSTrackingDashboard';

const GPSSettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('devices');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Radio className="w-7 h-7 text-primary" />
            إعدادات GPS السيارات
          </h1>
          <p className="text-muted-foreground mt-1">
            ربط وإدارة أجهزة GPS المثبتة في السيارات للتتبع المباشر
          </p>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 h-auto p-1">
          <TabsTrigger value="devices" className="flex items-center gap-2 py-3">
            <Radio className="w-4 h-4" />
            <span className="hidden md:inline">الأجهزة</span>
          </TabsTrigger>
          <TabsTrigger value="register" className="flex items-center gap-2 py-3">
            <Settings className="w-4 h-4" />
            <span className="hidden md:inline">تسجيل جهاز</span>
          </TabsTrigger>
          <TabsTrigger value="binding" className="flex items-center gap-2 py-3">
            <Car className="w-4 h-4" />
            <span className="hidden md:inline">ربط بالسيارات</span>
          </TabsTrigger>
          <TabsTrigger value="connection" className="flex items-center gap-2 py-3">
            <Plug className="w-4 h-4" />
            <span className="hidden md:inline">اختبار الاتصال</span>
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex items-center gap-2 py-3">
            <Activity className="w-4 h-4" />
            <span className="hidden md:inline">لوحة التتبع</span>
          </TabsTrigger>
          <TabsTrigger value="guide" className="flex items-center gap-2 py-3">
            <FileText className="w-4 h-4" />
            <span className="hidden md:inline">دليل الربط</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="devices" className="space-y-4">
          <GPSDeviceManager />
        </TabsContent>

        <TabsContent value="register" className="space-y-4">
          <GPSDeviceRegistration />
        </TabsContent>

        <TabsContent value="binding" className="space-y-4">
          <GPSVehicleBinding />
        </TabsContent>

        <TabsContent value="connection" className="space-y-4">
          <GPSConnectionTester />
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-4">
          <GPSTrackingDashboard />
        </TabsContent>

        <TabsContent value="guide" className="space-y-4">
          <GPSProtocolGuide />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GPSSettingsPage;
