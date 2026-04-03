import React from 'react';
import BackButton from '@/components/ui/back-button';
import OHSReportPanel from '@/components/ohs/OHSReportPanel';

const OHSReports = () => (
    <div className="space-y-4">
      <BackButton />
      <OHSReportPanel />
    </div>
);

export default OHSReports;
