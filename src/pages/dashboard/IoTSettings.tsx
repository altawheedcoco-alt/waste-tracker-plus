import React from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import IoTDashboard from '@/components/iot/IoTDashboard';

const IoTSettings = () => (
    <div className="space-y-4">
      <BackButton />
      <IoTDashboard />
    </div>
);

export default IoTSettings;
