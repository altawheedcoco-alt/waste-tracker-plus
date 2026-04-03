import React from 'react';
import BackButton from '@/components/ui/back-button';
import CollectionRequestManager from '@/components/portal/CollectionRequestManager';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

const CollectionRequests = () => (
    <DashboardLayout>
    <div className="space-y-4">
      <BackButton />
      <CollectionRequestManager />
    </div>
)</DashboardLayout>
));

export default CollectionRequests;
