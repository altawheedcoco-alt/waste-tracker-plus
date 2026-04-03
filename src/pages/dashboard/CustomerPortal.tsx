import React from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import CustomerPortalSettings from '@/components/portal/CustomerPortalSettings';

const CustomerPortal = () => (
  <DashboardLayout>
    <div className="space-y-4">
      <BackButton />
      <CustomerPortalSettings />
    </div>
  </DashboardLayout>
);

export default CustomerPortal;
