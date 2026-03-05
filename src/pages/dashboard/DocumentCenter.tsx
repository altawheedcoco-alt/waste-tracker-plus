/**
 * مركز المستندات الموحد — Unified Document Center
 * قاعدة مركزية واحدة لجميع المستندات والتوقيعات والأختام والتحقق والأرشيف
 */
import { lazy, Suspense, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  FolderOpen, FileText, PenTool, QrCode, Shield, Archive,
  Printer, FileSignature, BadgeCheck, Receipt, FileCheck,
  Inbox, Send, Award, Layers, ScanLine, Building2,
  Download, Eye, Search, Filter, Plus, ArrowRight,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

// Lazy-load heavy sub-panels
const DocumentArchivePanel = lazy(() => import('@/components/document-center/DocumentArchivePanel'));
const SignaturesStampsPanel = lazy(() => import('@/components/document-center/SignaturesStampsPanel'));
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

const tabs = [
  { id: 'archive', icon: FolderOpen, labelAr: 'الأرشيف والمستندات', labelEn: 'Archive & Documents' },
  { id: 'signatures', icon: PenTool, labelAr: 'التوقيعات والأختام', labelEn: 'Signatures & Stamps' },
  { id: 'qr-barcode', icon: QrCode, labelAr: 'QR وباركود', labelEn: 'QR & Barcode' },
  { id: 'verification', icon: Shield, labelAr: 'التحقق والأمان', labelEn: 'Verification' },
  { id: 'print', icon: Printer, labelAr: 'الطباعة والتصدير', labelEn: 'Print & Export' },
  { id: 'contracts', icon: FileSignature, labelAr: 'العقود والاتفاقيات', labelEn: 'Contracts' },
  { id: 'certificates', icon: Award, labelAr: 'الشهادات', labelEn: 'Certificates' },
  { id: 'invoices', icon: Receipt, labelAr: 'الفواتير', labelEn: 'Invoices' },
  { id: 'templates', icon: Layers, labelAr: 'القوالب والنماذج', labelEn: 'Templates' },
];

const DocumentCenter = () => {
  const { language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'archive';
  const navigate = useNavigate();

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
                {language === 'ar' ? 'مركز المستندات' : 'Document Center'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {language === 'ar'
                  ? 'قاعدة مركزية موحدة لجميع المستندات والتوقيعات والأختام والتحقق'
                  : 'Unified hub for all documents, signatures, stamps & verification'}
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
                    {language === 'ar' ? tab.labelAr : tab.labelEn}
                  </TabsTrigger>
                );
              })}
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <div className="mt-4">
            <Suspense fallback={<PanelLoader />}>
              <TabsContent value="archive" className="mt-0"><DocumentArchivePanel /></TabsContent>
              <TabsContent value="signatures" className="mt-0"><SignaturesStampsPanel /></TabsContent>
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
