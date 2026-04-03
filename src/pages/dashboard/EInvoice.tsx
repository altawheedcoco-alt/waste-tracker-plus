import React from 'react';
import BackButton from '@/components/ui/back-button';
import EInvoiceSettings from '@/components/einvoice/EInvoiceSettings';

const EInvoice = () => (
    <div className="space-y-4">
      <BackButton />
      <EInvoiceSettings />
    </div>
);

export default EInvoice;
