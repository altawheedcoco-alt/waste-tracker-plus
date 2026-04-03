import React from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import TransportFuturesPanel from '@/components/futures/TransportFuturesPanel';

const FuturesMarket = () => (
  <DashboardLayout>
    <div className="space-y-4">
      <BackButton />
      <TransportFuturesPanel />
    </div>
  </DashboardLayout>
);

export default FuturesMarket;
