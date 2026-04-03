import React from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import OHSReportPanel from '@/components/ohs/OHSReportPanel';

const OHSReports = () => (
  <DashboardLayout>
    <div className="space-y-4">
      <BackButton />
      <OHSReportPanel />
    </div>
  </DashboardLayout>
);

export default OHSReports;
