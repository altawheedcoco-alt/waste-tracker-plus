/**
 * مركز المستندات الموحد — Unified Document Center
 * قاعدة مركزية واحدة لجميع المستندات والتوقيعات والأختام والتحقق والأرشيف
 */
import { lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  FolderOpen, PenTool, QrCode, Shield, Printer, FileSignature,
  Award, Receipt, Layers, Brain, Workflow, Archive, Inbox, Upload,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

// Lazy-load panels
const RegistryPanel = lazy(() => import('@/components/document-center/RegistryPanel'));
const SmartArchivePanel = lazy(() => import('@/components/document-center/SmartArchivePanel'));
const AdvancedDocumentUploadPanel = lazy(() => import('@/components/document-center/AdvancedDocumentUploadPanel'));
const DocumentArchivePanel = lazy(() => import('@/components/document-center/DocumentArchivePanel'));
const SignaturesStampsPanel = lazy(() => import('@/components/document-center/SignaturesStampsPanel'));
const OCRScannerPanel = lazy(() => import('@/components/digitization/OCRScannerPanel'));
const WorkflowAutomationPanel = lazy(() => import('@/components/digitization/WorkflowAutomationPanel'));
const AdvancedSignatureVerification = lazy(() => import('@/components/digitization/AdvancedSignatureVerification'));
const QRBarcodePanel = lazy(() => import('@/components/document-center/QRBarcodePanel'));
const VerificationPanel = lazy(() => import('@/components/document-center/VerificationPanel'));
const PrintCenterPanel = lazy(() => import('@/components/document-center/PrintCenterPanel'));
const ContractsPanel = lazy(() => import('@/components/document-center/ContractsPanel'));
const CertificatesPanel = lazy(() => import('@/components/document-center/CertificatesPanel'));
const InvoicesPanel = lazy(() => import('@/components/document-center/InvoicesPanel'));
const TemplatesPanel = lazy(() => import('@/components/document-center/TemplatesPanel'));

const PanelLoader = () => (
  <div className="flex items-center justify-center py-12">
    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const getDocCenterTabs = (t: (key: string) => string) => [
  { id: 'registry', icon: Shield, label: 'السجل المركزي' },
  { id: 'smart-archive', icon: Brain, label: 'الأرشفة الذكية' },
  { id: 'upload', icon: Upload, label: t('docCenter.uploadDocuments') },
  { id: 'archive', icon: FolderOpen, label: t('docCenter.archiveDocs') },
  { id: 'signatures', icon: PenTool, label: t('docCenter.signaturesStamps') },
  { id: 'ocr-scanner', icon: Brain, label: 'الماسح الذكي OCR' },
  { id: 'workflow', icon: Workflow, label: 'أتمتة سير العمل' },
  { id: 'advanced-verify', icon: Shield, label: 'تحقق متقدم' },
  { id: 'qr-barcode', icon: QrCode, label: t('docCenter.qrBarcode') },
  { id: 'verification', icon: Shield, label: t('docCenter.verification') },
  { id: 'print', icon: Printer, label: t('docCenter.printExport') },
  { id: 'contracts', icon: FileSignature, label: t('docCenter.contracts') },
  { id: 'certificates', icon: Award, label: t('docCenter.certificates') },
  { id: 'invoices', icon: Receipt, label: t('docCenter.invoices') },
  { id: 'templates', icon: Layers, label: t('docCenter.templates') },
];

const DocumentCenter = () => {
  const { t, language } = useLanguage();
  const tabs = getDocCenterTabs(t);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'registry';

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <DashboardLayout>
      <div className="space-y-4" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton />
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <FolderOpen className="w-6 h-6 text-primary" />
                {t('docCenter.title')}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t('docCenter.subtitle')}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <ScrollArea className="w-full" dir="rtl">
            <TabsList className="inline-flex h-11 w-max gap-1 bg-muted/60 p-1 rounded-xl">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="gap-1.5 text-xs whitespace-nowrap data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg px-3"
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <div className="mt-4">
            <Suspense fallback={<PanelLoader />}>
              <TabsContent value="registry" className="mt-0"><RegistryPanel /></TabsContent>
              <TabsContent value="smart-archive" className="mt-0"><SmartArchivePanel /></TabsContent>
              <TabsContent value="upload" className="mt-0"><AdvancedDocumentUploadPanel /></TabsContent>
              <TabsContent value="archive" className="mt-0"><DocumentArchivePanel /></TabsContent>
              <TabsContent value="signatures" className="mt-0"><SignaturesStampsPanel /></TabsContent>
              <TabsContent value="ocr-scanner" className="mt-0"><OCRScannerPanel /></TabsContent>
              <TabsContent value="workflow" className="mt-0"><WorkflowAutomationPanel /></TabsContent>
              <TabsContent value="advanced-verify" className="mt-0"><AdvancedSignatureVerification /></TabsContent>
              <TabsContent value="qr-barcode" className="mt-0"><QRBarcodePanel /></TabsContent>
              <TabsContent value="verification" className="mt-0"><VerificationPanel /></TabsContent>
              <TabsContent value="print" className="mt-0"><PrintCenterPanel /></TabsContent>
              <TabsContent value="contracts" className="mt-0"><ContractsPanel /></TabsContent>
              <TabsContent value="certificates" className="mt-0"><CertificatesPanel /></TabsContent>
              <TabsContent value="invoices" className="mt-0"><InvoicesPanel /></TabsContent>
              <TabsContent value="templates" className="mt-0"><TemplatesPanel /></TabsContent>
            </Suspense>
          </div>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default DocumentCenter;
