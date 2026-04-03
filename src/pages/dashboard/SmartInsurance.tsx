import React from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import ShipmentInsurancePanel from '@/components/insurance/ShipmentInsurancePanel';

const SmartInsurance = () => (
    <div className="space-y-4">
      <BackButton />
      <ShipmentInsurancePanel />
    </div>
);

export default SmartInsurance;
