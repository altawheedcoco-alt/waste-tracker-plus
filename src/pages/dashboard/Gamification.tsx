import React from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import GamificationDashboard from '@/components/gamification/GamificationDashboard';

const Gamification = () => (
  <DashboardLayout>
    <div className="space-y-4">
      <BackButton />
      <GamificationDashboard />
    </div>
  </DashboardLayout>
);

export default Gamification;
