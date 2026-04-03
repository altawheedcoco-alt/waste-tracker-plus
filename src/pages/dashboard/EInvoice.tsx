import React from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import EInvoiceSettings from '@/components/einvoice/EInvoiceSettings';

const EInvoice = () => (
  <DashboardLayout>
    <div className="space-y-4">
      <BackButton />
      <EInvoiceSettings />
    </div>
  </DashboardLayout>
);

export default EInvoice;
