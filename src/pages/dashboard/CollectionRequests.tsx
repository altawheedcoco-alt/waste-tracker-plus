import React from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import CollectionRequestManager from '@/components/portal/CollectionRequestManager';

const CollectionRequests = () => (
  <DashboardLayout>
    <div className="space-y-4">
      <BackButton />
      <CollectionRequestManager />
    </div>
  </DashboardLayout>
);

export default CollectionRequests;
