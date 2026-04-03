import React from 'react';
import BackButton from '@/components/ui/back-button';
import CustomerPortalSettings from '@/components/portal/CustomerPortalSettings';

const CustomerPortal = () => (
    <div className="space-y-4">
      <BackButton />
      <CustomerPortalSettings />
    </div>
);

export default CustomerPortal;
