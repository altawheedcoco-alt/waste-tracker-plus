import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Printer, 
  Download, 
  BookOpen, 
  Package, 
  ChevronDown,
  Eye,
  Loader2,
  Filter,
} from 'lucide-react';
import { useDocumentService } from '@/hooks/useDocumentService';
import AccountLedgerPrint from './AccountLedgerPrint';
import ShipmentsAccountPrint from './ShipmentsAccountPrint';
import AccountLedgerFilterDialog from './AccountLedgerFilterDialog';
import { LedgerEntry } from './AccountLedger';
import { createRoot } from 'react-dom/client';

interface PrintExportActionsProps {
  partnerName: string;
  partnerType: string;
  ledgerEntries: LedgerEntry[];
  shipments: any[];
  organizationName?: string;
}

export default function PrintExportActions({
  partnerName,
  partnerType,
  ledgerEntries,
  shipments,
  organizationName,
}: PrintExportActionsProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const { downloadPDF, previewPDF, print, isProcessing } = useDocumentService({
    filename: `كشف-حساب-${partnerName}`,
    orientation: 'portrait',
  });

  const renderAndExport = async (
    Component: React.FC<any>,
    props: any,
    action: 'print' | 'pdf' | 'preview',
    filename: string
  ) => {
    setIsPrinting(true);
    
    try {
      // Create a temporary container
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      document.body.appendChild(container);

      // Render the component
      const root = createRoot(container);
      
      await new Promise<void>((resolve) => {
        root.render(<Component {...props} />);
        setTimeout(resolve, 100); // Wait for render
      });

      const element = container.firstChild as HTMLElement;

      if (action === 'print') {
        print(element);
      } else if (action === 'pdf') {
        await downloadPDF(element, { customFilename: filename });
      } else if (action === 'preview') {
        await previewPDF(element);
      }

      // Cleanup
      root.unmount();
      document.body.removeChild(container);
    } catch (error) {
      console.error('Print/Export error:', error);
    } finally {
      setIsPrinting(false);
    }
  };

  const handleLedgerAction = (action: 'print' | 'pdf' | 'preview') => {
    renderAndExport(
      AccountLedgerPrint,
      {
        partnerName,
        partnerType,
        entries: ledgerEntries,
        organizationName,
      },
      action,
      `كشف-حساب-${partnerName}`
    );
  };

  const handleShipmentsAction = (action: 'print' | 'pdf' | 'preview') => {
    renderAndExport(
      ShipmentsAccountPrint,
      {
        partnerName,
        partnerType,
        shipments,
        organizationName,
      },
      action,
      `شحنات-${partnerName}`
    );
  };

  const isLoading = isPrinting || isProcessing;

  return (
    <div className="flex items-center gap-2">
      {/* Filter Dialog - Advanced */}
      <AccountLedgerFilterDialog
        entries={ledgerEntries}
        partnerName={partnerName}
        partnerType={partnerType}
        organizationName={organizationName}
        trigger={
          <Button variant="outline" size="sm" className="gap-2" disabled={isLoading}>
            <Filter className="h-4 w-4" />
            فلترة وطباعة
          </Button>
        }
      />

      {/* Ledger Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
            كشف الحساب
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={() => handleLedgerAction('preview')} className="gap-2">
            <Eye className="h-4 w-4" />
            معاينة
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleLedgerAction('print')} className="gap-2">
            <Printer className="h-4 w-4" />
            طباعة
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleLedgerAction('pdf')} className="gap-2">
            <Download className="h-4 w-4" />
            تحميل PDF
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Shipments Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
            الشحنات
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={() => handleShipmentsAction('preview')} className="gap-2">
            <Eye className="h-4 w-4" />
            معاينة
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShipmentsAction('print')} className="gap-2">
            <Printer className="h-4 w-4" />
            طباعة
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleShipmentsAction('pdf')} className="gap-2">
            <Download className="h-4 w-4" />
            تحميل PDF
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
