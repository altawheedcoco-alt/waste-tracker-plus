/**
 * StationeryTemplates — Browse, preview, and print secure letterheads
 */
import { useState, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import BackButton from '@/components/ui/back-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Printer, Download, Eye, Lock, FileText, Award, Receipt, Shield, Crown } from 'lucide-react';
import { toast } from 'sonner';
import SecureLetterhead from '@/components/stationery/SecureLetterhead';
import { usePDFExport } from '@/hooks/usePDFExport';

const CATEGORY_ICONS: Record<string, any> = {
  letterhead: FileText,
  certificate: Award,
  invoice: Receipt,
  permit: Shield,
};

const CATEGORY_LABELS: Record<string, string> = {
  letterhead: 'ورق رسمي',
  certificate: 'شهادات',
  invoice: 'فواتير وإيصالات',
  permit: 'تصاريح وأذون',
};

const StationeryTemplates = () => {
  const { profile } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentContent, setDocumentContent] = useState('');
  const printRef = useRef<HTMLDivElement>(null);
  const { exportToPDF, isExporting } = usePDFExport({ filename: 'stationery', orientation: 'portrait', format: 'a4' });

  // Fetch templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['stationery-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stationery_templates')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  // Fetch subscription
  const { data: subscription } = useQuery({
    queryKey: ['stationery-subscription', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return null;
      const { data } = await supabase
        .from('stationery_subscriptions')
        .select('*, plan:stationery_plans(*)')
        .eq('organization_id', profile.organization_id)
        .eq('status', 'active')
        .maybeSingle();
      return data;
    },
    enabled: !!profile?.organization_id,
  });

  // Fetch org info
  const { data: org } = useQuery({
    queryKey: ['org-info', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return null;
      const { data } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', profile.organization_id)
        .single();
      return data;
    },
    enabled: !!profile?.organization_id,
  });

  const planTier = (subscription as any)?.plan?.plan_tier || 'free';
  const canAccessTemplate = (template: any) => {
    if (planTier === 'enterprise') return true;
    if (planTier === 'professional') return true;
    if (planTier === 'basic' && template.sort_order <= 6) return true;
    if (planTier === 'free' && template.sort_order <= 3) return true;
    return false;
  };

  const generateSerial = () => {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `STN-${yy}${mm}-${rand}`;
  };

  const generateVerificationCode = () => {
    return `VRF-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  };

  const handlePreview = (template: any) => {
    if (!canAccessTemplate(template)) {
      toast.error('يرجى ترقية باقتك للوصول لهذا القالب');
      return;
    }
    setSelectedTemplate(template);
    setPreviewOpen(true);
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html dir="rtl"><head>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Amiri:wght@400;700&display=swap" rel="stylesheet">
        <style>@page{size:A4;margin:0}body{margin:0;padding:0}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}</style>
      </head><body>${printRef.current.innerHTML}</body></html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
    logPrintUsage('print');
  };

  const handleDownloadPDF = () => {
    if (!printRef.current) return;
    exportToPDF(printRef.current, `stationery-${selectedTemplate?.name || 'document'}`);
    logPrintUsage('pdf_export');
  };

  const logPrintUsage = async (actionType: string) => {
    if (!profile?.organization_id || !selectedTemplate) return;
    try {
      await supabase.from('stationery_print_log').insert({
        organization_id: profile.organization_id,
        user_id: profile.id,
        template_id: selectedTemplate.id,
        subscription_id: (subscription as any)?.id || null,
        document_title: documentTitle || null,
        serial_number: generateSerial(),
        verification_code: generateVerificationCode(),
        action_type: actionType,
      });
    } catch (e) {
      console.error('Failed to log print:', e);
    }
  };

  const grouped = useMemo(() => {
    const groups: Record<string, any[]> = {};
    templates.forEach((t: any) => {
      if (!groups[t.category]) groups[t.category] = [];
      groups[t.category].push(t);
    });
    return groups;
  }, [templates]);

  const serial = useMemo(() => generateSerial(), [selectedTemplate]);
  const vCode = useMemo(() => generateVerificationCode(), [selectedTemplate]);

  return (
    <div className="space-y-6 p-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="w-7 h-7 text-primary" />
            المطبوعات الرسمية المؤمّنة
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            اختر قالب ورق رسمي مؤمّن بعلامات مائية وتشفير رقمي للطباعة
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={planTier === 'free' ? 'secondary' : 'default'} className="text-xs">
            {planTier === 'free' ? '🆓 مجاني' : planTier === 'basic' ? '⭐ أساسي' : planTier === 'professional' ? '💎 احترافي' : '👑 مؤسسي VIP'}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/dashboard/stationery-plans'}>
            <Crown className="w-4 h-4 ml-1" />
            ترقية الباقة
          </Button>
        </div>
      </div>

      {/* Templates by category */}
      <Tabs defaultValue="letterhead" dir="rtl">
        <TabsList className="grid w-full grid-cols-4">
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
            const Icon = CATEGORY_ICONS[key];
            return (
              <TabsTrigger key={key} value={key} className="gap-1 text-xs">
                <Icon className="w-3.5 h-3.5" />
                {label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {Object.entries(CATEGORY_LABELS).map(([key]) => (
          <TabsContent key={key} value={key}>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(grouped[key] || []).map((template: any) => {
                  const accessible = canAccessTemplate(template);
                  return (
                    <Card key={template.id} className={`relative overflow-hidden transition-all hover:shadow-lg ${!accessible ? 'opacity-60' : 'cursor-pointer'}`}>
                      {!accessible && (
                        <div className="absolute inset-0 bg-background/50 z-10 flex items-center justify-center">
                          <Badge variant="outline" className="gap-1 bg-background">
                            <Lock className="w-3 h-3" />
                            يتطلب ترقية
                          </Badge>
                        </div>
                      )}
                      {/* Color preview bar */}
                      <div className="h-2" style={{ background: `linear-gradient(90deg, ${template.accent_color}, ${template.guilloche_color || template.accent_color})` }} />
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center justify-between">
                          {template.name}
                          <div className="flex gap-1">
                            {template.show_guilloche && <Badge variant="outline" className="text-[9px] px-1">Guilloche</Badge>}
                            {template.show_sha256 && <Badge variant="outline" className="text-[9px] px-1">SHA-256</Badge>}
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-xs text-muted-foreground">{template.description}</p>
                        
                        {/* Security features indicators */}
                        <div className="flex flex-wrap gap-1">
                          {template.show_qr && <Badge className="text-[8px] px-1.5 py-0" variant="secondary">QR</Badge>}
                          {template.show_barcode && <Badge className="text-[8px] px-1.5 py-0" variant="secondary">باركود</Badge>}
                          {template.show_serial_number && <Badge className="text-[8px] px-1.5 py-0" variant="secondary">رقم تسلسلي</Badge>}
                          <Badge className="text-[8px] px-1.5 py-0" variant="secondary">علامة مائية</Badge>
                        </div>

                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1 text-xs" onClick={() => handlePreview(template)} disabled={!accessible}>
                            <Eye className="w-3.5 h-3.5 ml-1" />
                            معاينة
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-5xl max-h-[95vh] p-0">
          <DialogHeader className="p-4 border-b sticky top-0 bg-background z-20">
            <div className="flex items-center justify-between">
              <DialogTitle>{selectedTemplate?.name} — معاينة</DialogTitle>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="عنوان المستند (اختياري)"
                  value={documentTitle}
                  onChange={(e) => setDocumentTitle(e.target.value)}
                  className="w-48 h-8 text-xs"
                />
                <Button size="sm" variant="outline" onClick={handlePrint}>
                  <Printer className="w-4 h-4 ml-1" />
                  طباعة
                </Button>
                <Button size="sm" onClick={handleDownloadPDF} disabled={isExporting}>
                  <Download className="w-4 h-4 ml-1" />
                  PDF
                </Button>
              </div>
            </div>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(95vh-80px)]">
            <div className="p-4 bg-gray-100 flex justify-center">
              {selectedTemplate && org && (
                <SecureLetterhead
                  ref={printRef}
                  config={{
                    orgName: org.name || '',
                    orgNameEn: org.name_en || undefined,
                    orgLogo: org.logo_url || undefined,
                    orgAddress: org.address || undefined,
                    orgPhone: org.phone || undefined,
                    orgEmail: org.email || undefined,
                    orgCR: org.commercial_register || undefined,
                    orgTaxId: (org as any).tax_id || undefined,
                    accentColor: selectedTemplate.accent_color || '#1a365d',
                    borderStyle: selectedTemplate.border_style || 'double',
                    headerLayout: selectedTemplate.header_layout || 'centered',
                    showWatermark: true,
                    watermarkText: selectedTemplate.watermark_text || org.name || 'مستند رسمي',
                    watermarkOpacity: selectedTemplate.watermark_opacity || 0.06,
                    showGuilloche: selectedTemplate.show_guilloche || false,
                    guillocheColor: selectedTemplate.guilloche_color || '#16a34a',
                    showQR: true, // mandatory digital verification
                    showBarcode: true, // mandatory digital verification
                    showSerialNumber: true, // mandatory digital verification
                    showSHA256: selectedTemplate.show_sha256 || false,
                    serialNumber: serial,
                    verificationCode: vCode,
                    sha256Hash: selectedTemplate.show_sha256 ? 'a1b2c3d4e5f6789012345678abcdef90a1b2c3d4e5f6789012345678abcdef90' : undefined,
                    documentTitle: documentTitle || selectedTemplate.name,
                    documentDate: new Date().toLocaleDateString('ar-EG'),
                  }}
                >
                  {/* Sample content area */}
                  <div className="space-y-4 py-6 text-[11pt] leading-relaxed text-gray-700">
                    <Textarea
                      placeholder="اكتب محتوى المستند هنا..."
                      value={documentContent}
                      onChange={(e) => setDocumentContent(e.target.value)}
                      className="min-h-[300px] border-dashed border-2 text-sm resize-none bg-transparent"
                      dir="rtl"
                    />
                    {!documentContent && (
                      <div className="text-center text-gray-300 text-sm py-20">
                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>منطقة المحتوى — اكتب نص المستند أعلاه</p>
                      </div>
                    )}
                  </div>
                </SecureLetterhead>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StationeryTemplates;
