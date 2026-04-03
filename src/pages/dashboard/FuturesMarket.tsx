import React from 'react';
import BackButton from '@/components/ui/back-button';
import TransportFuturesPanel from '@/components/futures/TransportFuturesPanel';

const FuturesMarket = () => (
    <div className="space-y-4">
      <BackButton />
      <TransportFuturesPanel />
    </div>
);

export default FuturesMarket;
