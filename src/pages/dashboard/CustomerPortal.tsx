import React from 'react';
import BackButton from '@/components/ui/back-button';
import CustomerPortalSettings from '@/components/portal/CustomerPortalSettings';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

const CustomerPortal = () => (
    <DashboardLayout>
    <div className="space-y-4">
      <BackButton />
      <CustomerPortalSettings />
    </div>
)</DashboardLayout>
));

export default CustomerPortal;
