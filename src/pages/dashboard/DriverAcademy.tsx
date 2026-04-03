import React from 'react';
import BackButton from '@/components/ui/back-button';
import DriverAcademyPanel from '@/components/academy/DriverAcademyPanel';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

const DriverAcademy = () => (
    <DashboardLayout>
    <div className="space-y-4">
      <BackButton />
      <DriverAcademyPanel />
    </div>
)</DashboardLayout>
));

export default DriverAcademy;
