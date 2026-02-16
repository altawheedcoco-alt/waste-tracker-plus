import React from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import ShipmentInsurancePanel from '@/components/insurance/ShipmentInsurancePanel';

const SmartInsurance = () => (
  <DashboardLayout>
    <div className="space-y-4">
      <BackButton />
      <ShipmentInsurancePanel />
    </div>
  </DashboardLayout>
);

export default SmartInsurance;
