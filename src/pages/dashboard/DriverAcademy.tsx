import React from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import DriverAcademyPanel from '@/components/academy/DriverAcademyPanel';

const DriverAcademy = () => (
    <div className="space-y-4">
      <BackButton />
      <DriverAcademyPanel />
    </div>
);

export default DriverAcademy;
