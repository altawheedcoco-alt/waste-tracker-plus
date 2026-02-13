import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Radio, Settings, Plug, Activity, Car, FileText, HelpCircle, History } from 'lucide-react';
import GPSDeviceManager from './GPSDeviceManager';
import GPSDeviceRegistration from './GPSDeviceRegistration';
import GPSConnectionTester from './GPSConnectionTester';
import GPSProtocolGuide from './GPSProtocolGuide';
import GPSVehicleBinding from './GPSVehicleBinding';
import GPSTrackingDashboard from './GPSTrackingDashboard';
import GPSHelpGuideDialog from './GPSHelpGuideDialog';
import VehicleMovementLog from './VehicleMovementLog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

const GPSSettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('devices');
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Radio className="w-7 h-7 text-primary" />
            {t('tracking.title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('tracking.subtitle')}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <GPSHelpGuideDialog
            trigger={
              <Button variant="outline" className="gap-2">
                <HelpCircle className="w-4 h-4" />
                {t('tracking.connectionGuide')}
              </Button>
            }
          />
          <VehicleMovementLog
            trigger={
              <Button variant="default" className="gap-2">
                <History className="w-4 h-4" />
                {t('tracking.movementLog')}
              </Button>
            }
          />
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 h-auto p-1">
          <TabsTrigger value="devices" className="flex items-center gap-2 py-3">
            <Radio className="w-4 h-4" />
            <span className="hidden md:inline">{t('tracking.devices')}</span>
          </TabsTrigger>
          <TabsTrigger value="register" className="flex items-center gap-2 py-3">
            <Settings className="w-4 h-4" />
            <span className="hidden md:inline">{t('tracking.registerDevice')}</span>
          </TabsTrigger>
          <TabsTrigger value="binding" className="flex items-center gap-2 py-3">
            <Car className="w-4 h-4" />
            <span className="hidden md:inline">{t('tracking.vehicleBinding')}</span>
          </TabsTrigger>
          <TabsTrigger value="connection" className="flex items-center gap-2 py-3">
            <Plug className="w-4 h-4" />
            <span className="hidden md:inline">{t('tracking.connectionTest')}</span>
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex items-center gap-2 py-3">
            <Activity className="w-4 h-4" />
            <span className="hidden md:inline">{t('tracking.trackingDashboard')}</span>
          </TabsTrigger>
          <TabsTrigger value="guide" className="flex items-center gap-2 py-3">
            <FileText className="w-4 h-4" />
            <span className="hidden md:inline">{t('tracking.connectionGuide')}</span>
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
