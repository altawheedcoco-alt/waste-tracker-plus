import { useState } from 'react';
import { 
  Printer, Download, Send, FileText, Share2, Copy, 
  Mail, MessageSquare, Palette, FileDown, Award, Layout, Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import PrintThemeSelector from './PrintThemeSelector';
import LayoutTemplateSelector from './LayoutTemplateSelector';
import UnifiedDocumentPreview, { type DocumentOutputConfig } from './UnifiedDocumentPreview';
import { type PrintThemeId } from '@/lib/printThemes';
import { type LayoutTemplateId } from '@/lib/layoutTemplates';
import { usePDFExport } from '@/hooks/usePDFExport';
import { usePrintTracking } from '@/hooks/usePrintTracking';
import { toast } from 'sonner';

interface DocumentActionsToolbarProps {
  printRef: React.RefObject<HTMLDivElement>;
  documentTitle?: string;
  documentNumber?: string;
  documentType?: string;
  documentId?: string;
  entityType?: 'generator' | 'transporter' | 'recycler' | 'disposal';
  onSendEmail?: () => void;
  onSendWhatsApp?: () => void;
  onCreateCertificate?: () => void;
  onLayoutChange?: (layoutId: LayoutTemplateId) => void;
  showCertificateAction?: boolean;
  compact?: boolean;
  className?: string;
}

const DocumentActionsToolbar = ({
  printRef,
  documentTitle = 'مستند',
  documentNumber,
  documentType = 'document',
  documentId,
  entityType,
  onSendEmail,
  onSendWhatsApp,
  onCreateCertificate,
  onLayoutChange,
  showCertificateAction = false,
  compact = false,
  className = '',
}: DocumentActionsToolbarProps) => {
  const [themeOpen, setThemeOpen] = useState(false);
  const [layoutOpen, setLayoutOpen] = useState(false);
  const [unifiedOpen, setUnifiedOpen] = useState(false);
  const { exportToPDF, printWithTheme, printContent, isExporting } = usePDFExport({
    filename: documentTitle,
  });
  const { logPrint } = usePrintTracking();

  const handleQuickPrint = async () => {
    if (printRef.current) {
      printContent(printRef.current);
      await logPrint({ documentType, documentId, documentNumber, actionType: 'print' });
    }
  };

  const handleThemedPrint = async (themeId: PrintThemeId) => {
    if (printRef.current) {
      printWithTheme(printRef.current, themeId);
      await logPrint({ documentType, documentId, documentNumber, themeId, actionType: 'print' });
    }
  };

  const handleExportPDF = async () => {
    if (printRef.current) {
      exportToPDF(printRef.current, documentTitle);
      await logPrint({ documentType, documentId, documentNumber, actionType: 'pdf_export' });
    }
  };

  const handleLayoutSelect = (layoutId: LayoutTemplateId) => {
    onLayoutChange?.(layoutId);
  };

  const handleCopyContent = () => {
    if (printRef.current) {
      const text = printRef.current.innerText;
      navigator.clipboard.writeText(text);
      toast.success('تم نسخ المحتوى');
    }
  };

  const handleShareLink = () => {
    if (navigator.share) {
      navigator.share({
        title: documentTitle,
        text: `${documentTitle} - ${documentNumber || ''}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('تم نسخ الرابط');
    }
  };

  /** Unified preview → print */
  const handleUnifiedPrint = async (config: DocumentOutputConfig) => {
    if (printRef.current) {
      printWithTheme(printRef.current, config.themeId);
      await logPrint({ documentType, documentId, documentNumber, themeId: config.themeId, actionType: 'print' });
    }
  };

  /** Unified preview → export PDF */
  const handleUnifiedExportPDF = async (config: DocumentOutputConfig) => {
    if (printRef.current) {
      exportToPDF(printRef.current, documentTitle);
      await logPrint({ documentType, documentId, documentNumber, themeId: config.themeId, actionType: 'pdf_export' });
    }
  };

  if (compact) {
    return (
      <TooltipProvider>
        <div className={`flex items-center gap-1 ${className}`} dir="rtl">
          {/* Unified Preview Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="default" size="icon" onClick={() => setUnifiedOpen(true)} className="h-8 w-8">
                <Layers className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>معاينة شاملة</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={handleQuickPrint} className="h-8 w-8">
                <Printer className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>طباعة سريعة</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={() => setThemeOpen(true)} className="h-8 w-8">
                <Palette className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>اختيار تنسيق الطباعة</TooltipContent>
          </Tooltip>

          {onLayoutChange && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => setLayoutOpen(true)} className="h-8 w-8">
                  <Layout className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>تخطيط المستند</TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={handleExportPDF} disabled={isExporting} className="h-8 w-8">
                <FileDown className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>تصدير PDF</TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <Share2 className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>مشاركة</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {onSendEmail && (
                <DropdownMenuItem onClick={onSendEmail}>
                  <Mail className="h-4 w-4 ml-2" /> إرسال بريد إلكتروني
                </DropdownMenuItem>
              )}
              {onSendWhatsApp && (
                <DropdownMenuItem onClick={onSendWhatsApp}>
                  <MessageSquare className="h-4 w-4 ml-2" /> إرسال واتساب
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleShareLink}>
                <Share2 className="h-4 w-4 ml-2" /> مشاركة الرابط
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyContent}>
                <Copy className="h-4 w-4 ml-2" /> نسخ المحتوى
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {showCertificateAction && onCreateCertificate && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="default" size="icon" onClick={onCreateCertificate} className="h-8 w-8">
                  <Award className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>إصدار شهادة</TooltipContent>
            </Tooltip>
          )}

          <PrintThemeSelector
            open={themeOpen}
            onOpenChange={setThemeOpen}
            onSelect={handleThemedPrint}
            documentTitle={documentTitle}
            entityType={entityType}
          />
          {onLayoutChange && (
            <LayoutTemplateSelector
              open={layoutOpen}
              onOpenChange={setLayoutOpen}
              onSelect={handleLayoutSelect}
            />
          )}
          <UnifiedDocumentPreview
            open={unifiedOpen}
            onOpenChange={setUnifiedOpen}
            onPrint={handleUnifiedPrint}
            onExportPDF={handleUnifiedExportPDF}
            documentTitle={documentTitle}
            entityType={entityType}
          />
        </div>
      </TooltipProvider>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 p-3 bg-muted/30 rounded-lg border ${className}`} dir="rtl">
      {/* Unified Preview — Primary Action */}
      <Button size="sm" onClick={() => setUnifiedOpen(true)} className="gap-1.5">
        <Layers className="h-4 w-4" />
        معاينة شاملة
      </Button>

      <div className="h-6 w-px bg-border" />

      {/* Print Actions */}
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" onClick={handleQuickPrint} className="gap-1.5">
          <Printer className="h-4 w-4" />
          طباعة سريعة
        </Button>
        <Button variant="outline" size="sm" onClick={() => setThemeOpen(true)} className="gap-1.5">
          <Palette className="h-4 w-4" />
          أنماط الطباعة
          <Badge variant="secondary" className="text-[10px] px-1 py-0">16</Badge>
        </Button>
        {onLayoutChange && (
          <Button variant="outline" size="sm" onClick={() => setLayoutOpen(true)} className="gap-1.5">
            <Layout className="h-4 w-4" />
            تخطيط المستند
            <Badge variant="secondary" className="text-[10px] px-1 py-0">8</Badge>
          </Button>
        )}
      </div>

      <div className="h-6 w-px bg-border" />

      {/* Export Actions */}
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={isExporting} className="gap-1.5">
          <FileDown className="h-4 w-4" />
          تصدير PDF
        </Button>
        <Button variant="outline" size="sm" onClick={handleCopyContent} className="gap-1.5">
          <Copy className="h-4 w-4" />
          نسخ
        </Button>
      </div>

      <div className="h-6 w-px bg-border" />

      {/* Share Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Send className="h-4 w-4" />
            إرسال ومشاركة
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>قنوات الإرسال</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {onSendEmail && (
            <DropdownMenuItem onClick={onSendEmail}>
              <Mail className="h-4 w-4 ml-2" /> بريد إلكتروني
            </DropdownMenuItem>
          )}
          {onSendWhatsApp && (
            <DropdownMenuItem onClick={onSendWhatsApp}>
              <MessageSquare className="h-4 w-4 ml-2" /> واتساب
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleShareLink}>
            <Share2 className="h-4 w-4 ml-2" /> مشاركة الرابط
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Certificate Action */}
      {showCertificateAction && onCreateCertificate && (
        <>
          <div className="h-6 w-px bg-border" />
          <Button size="sm" onClick={onCreateCertificate} className="gap-1.5">
            <Award className="h-4 w-4" />
            إصدار شهادة
          </Button>
        </>
      )}

      <PrintThemeSelector
        open={themeOpen}
        onOpenChange={setThemeOpen}
        onSelect={handleThemedPrint}
        documentTitle={documentTitle}
        entityType={entityType}
      />
      {onLayoutChange && (
        <LayoutTemplateSelector
          open={layoutOpen}
          onOpenChange={setLayoutOpen}
          onSelect={handleLayoutSelect}
        />
      )}
      <UnifiedDocumentPreview
        open={unifiedOpen}
        onOpenChange={setUnifiedOpen}
        onPrint={handleUnifiedPrint}
        onExportPDF={handleUnifiedExportPDF}
        documentTitle={documentTitle}
        entityType={entityType}
      />
    </div>
  );
};

export default DocumentActionsToolbar;
