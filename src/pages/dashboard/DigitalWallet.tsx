import React from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import DigitalWalletPanel from '@/components/wallet/DigitalWalletPanel';

const DigitalWallet = () => (
  <DashboardLayout>
    <div className="space-y-4">
      <BackButton />
      <DigitalWalletPanel />
    </div>
  </DashboardLayout>
);

export default DigitalWallet;
