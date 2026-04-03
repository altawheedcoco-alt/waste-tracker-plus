import React from 'react';
import BackButton from '@/components/ui/back-button';
import CollectionRequestManager from '@/components/portal/CollectionRequestManager';

const CollectionRequests = () => (
    <div className="space-y-4">
      <BackButton />
      <CollectionRequestManager />
    </div>
);

export default CollectionRequests;
