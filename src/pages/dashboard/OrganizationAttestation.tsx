import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Eye, Loader2, Inbox, Send, Shield, QrCode, Hash, Fingerprint, Copy, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import AttestationDialog from '@/components/attestation/AttestationDialog';
import { useOrganizationAttestation, type AttestationData } from '@/hooks/useOrganizationAttestation';
import { supabase } from '@/integrations/supabase/client';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import { toast } from 'sonner';

interface RegulatoryAttestation {
  id: string;
  attestation_number: string;
  attestation_type: string;
  status: string;
  issued_at: string;
  valid_until: string;
  notes: string | null;
  regulator_organization_id: string;
  organization_data: any;
  regulator_org?: { name: string; name_en: string | null };
}

const OrganizationAttestation = () => {
  const { organization } = useAuth();
  const { fetchAttestations } = useOrganizationAttestation();

  const [activeTab, setActiveTab] = useState('identity');
  const [issuedAttestations, setIssuedAttestations] = useState<AttestationData[]>([]);
  const [receivedAttestations, setReceivedAttestations] = useState<RegulatoryAttestation[]>([]);
  const [loadingIssued, setLoadingIssued] = useState(true);
  const [loadingReceived, setLoadingReceived] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAttestation, setSelectedAttestation] = useState<AttestationData | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const loadIssued = async () => {
    setLoadingIssued(true);
    const data = await fetchAttestations();
    setIssuedAttestations(data);
    setLoadingIssued(false);
  };

  const loadReceived = async () => {
    if (!organization?.id) return;
    setLoadingReceived(true);
    const { data } = await supabase
      .from('regulatory_attestations')
      .select('*, regulator_org:organizations!regulatory_attestations_regulator_organization_id_fkey(name, name_en)')
      .eq('organization_id', organization.id)
      .order('created_at', { ascending: false });
    setReceivedAttestations((data || []) as unknown as RegulatoryAttestation[]);
    setLoadingReceived(false);
  };

  useEffect(() => {
    if (organization?.id) {
      loadIssued();
      loadReceived();
    }
  }, [organization?.id]);

  const handleView = (att: AttestationData) => {
    setSelectedAttestation(att);
    setDialogOpen(true);
  };

  const handleNew = () => {
    setSelectedAttestation(null);
    setDialogOpen(true);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('تم النسخ');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">سارية</Badge>;
      case 'revoked': return <Badge variant="destructive">ملغاة</Badge>;
      case 'expired': return <Badge variant="secondary">منتهية</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderLoader = () => (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );

  // Build QR data from org info
  const orgQrData = organization ? JSON.stringify({
    platform: 'iRecycle',
    type: 'org_identity',
    id: organization.id,
    name: (organization as any).name,
    code: (organization as any).digital_declaration_number || (organization as any).partner_code,
    url: `${window.location.origin}/qr-verify?type=organization&code=${(organization as any).digital_declaration_number || (organization as any).partner_code}`,
  }) : '';

  const declNumber = (organization as any)?.digital_declaration_number || '';
  const partnerCode = (organization as any)?.partner_code || '';
  const orgName = (organization as any)?.name || '';
  const orgType = (organization as any)?.organization_type || '';
  const signatureUrl = (organization as any)?.signature_url || '';
  const stampUrl = (organization as any)?.stamp_url || '';

  const orgTypeLabel: Record<string, string> = {
    generator: 'مولّد مخلفات',
    transporter: 'ناقل مخلفات',
    recycler: 'مدوّر مخلفات',
    disposal: 'تخلص نهائي',
    consultant: 'مستشار بيئي',
    consulting_office: 'مكتب استشارات',
    regulator: 'جهة رقابية',
    iso_body: 'جهة اعتماد',
    driver: 'سائق',
    admin: 'مدير نظام',
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <BackButton />
        <div className="flex items-center justify-between">
          <div className="text-right">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              الإفادات والهوية الرقمية
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              هوية التحقق الرقمية والإفادات الصادرة والواردة
            </p>
          </div>
          <Button onClick={handleNew} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            طلب إفادة جديدة
          </Button>
        </div>

        {organization?.id ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
            <TabsList className="w-full">
              <TabsTrigger value="identity" className="flex-1 gap-1.5 text-xs sm:text-sm">
                <Fingerprint className="w-4 h-4" />
                هوية التحقق
              </TabsTrigger>
              <TabsTrigger value="issued" className="flex-1 gap-1.5 text-xs sm:text-sm">
                <Send className="w-4 h-4" />
                إفاداتي
                {issuedAttestations.length > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px] mr-1">{issuedAttestations.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="received" className="flex-1 gap-1.5 text-xs sm:text-sm">
                <Inbox className="w-4 h-4" />
                واردة
                {receivedAttestations.length > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px] mr-1">{receivedAttestations.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Identity & Verification Tab */}
            <TabsContent value="identity" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Fingerprint className="h-5 w-5 text-primary" />
                    هوية التحقق الرقمية — تم إنشاؤها تلقائياً عند التسجيل
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Org Info Header */}
                  <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold">{orgName}</p>
                      <p className="text-sm text-muted-foreground">{orgTypeLabel[orgType] || orgType}</p>
                    </div>
                  </div>

                  {/* Verification Codes Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Declaration Number */}
                    <div className="p-4 rounded-lg border space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          رقم الإعلان الرقمي
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => copyToClipboard(declNumber, 'decl')}
                        >
                          {copiedField === 'decl' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </Button>
                      </div>
                      <p className="font-mono font-bold text-lg tracking-wider text-primary">{declNumber || '—'}</p>
                    </div>

                    {/* Partner Code */}
                    <div className="p-4 rounded-lg border space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          كود الشراكة الفريد
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => copyToClipboard(partnerCode, 'partner')}
                        >
                          {copiedField === 'partner' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </Button>
                      </div>
                      <p className="font-mono font-bold text-lg tracking-wider">{partnerCode || '—'}</p>
                    </div>
                  </div>

                  {/* QR Code & Barcode */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* QR Code */}
                    <div className="p-4 rounded-lg border flex flex-col items-center gap-3">
                      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <QrCode className="w-3 h-3" />
                        رمز QR للتحقق
                      </span>
                      {orgQrData ? (
                        <QRCodeSVG
                          value={orgQrData}
                          size={140}
                          level="M"
                          includeMargin
                          className="rounded"
                        />
                      ) : (
                        <div className="h-[140px] w-[140px] bg-muted rounded flex items-center justify-center">
                          <QrCode className="w-8 h-8 text-muted-foreground/30" />
                        </div>
                      )}
                      <p className="text-[10px] text-muted-foreground text-center">
                        امسح الرمز للتحقق من هوية المنظمة
                      </p>
                    </div>

                    {/* Barcode */}
                    <div className="p-4 rounded-lg border flex flex-col items-center gap-3">
                      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        باركود التعريف
                      </span>
                      {declNumber ? (
                        <Barcode
                          value={declNumber}
                          height={60}
                          width={1.5}
                          fontSize={11}
                          margin={5}
                          displayValue
                        />
                      ) : (
                        <div className="h-[80px] w-full bg-muted rounded flex items-center justify-center">
                          <FileText className="w-8 h-8 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Signature & Stamp */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg border flex flex-col items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">التوقيع الرسمي</span>
                      {signatureUrl ? (
                        <img src={signatureUrl} alt="التوقيع" className="max-h-16 object-contain" />
                      ) : (
                        <div className="h-16 w-full bg-muted/50 rounded flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">لم يُضف بعد — أضفه من ملف المنظمة</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4 rounded-lg border flex flex-col items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">الختم الرسمي</span>
                      {stampUrl ? (
                        <img src={stampUrl} alt="الختم" className="max-h-16 object-contain" />
                      ) : (
                        <div className="h-16 w-full bg-muted/50 rounded flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">لم يُضف بعد — أضفه من ملف المنظمة</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground text-center border-t pt-3">
                    ⚡ تم إنشاء هوية التحقق تلقائياً عند تسجيل المنظمة — يتم تضمين هذه الأكواد في كل مستند رسمي صادر
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Issued Attestations Tab */}
            <TabsContent value="issued" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    إفادات التسجيل والاعتماد الرقمي
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingIssued ? renderLoader() : issuedAttestations.length === 0 ? (
                    <div className="text-center py-10 space-y-4">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground/30" />
                      <p className="text-muted-foreground text-sm">لا توجد إفادات صادرة بعد</p>
                      <Button variant="outline" onClick={handleNew} className="gap-1.5">
                        <Plus className="h-4 w-4" />
                        طلب أول إفادة
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {issuedAttestations.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full flex items-center justify-center bg-primary/10">
                              <FileText className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                إفادة رقم: <span className="font-mono text-xs">{att.attestation_number}</span>
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(att.issued_at), 'dd MMMM yyyy - hh:mm a', { locale: ar })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(att.status)}
                            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => handleView(att)}>
                              <Eye className="h-3 w-3" />
                              عرض
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Received Attestations Tab */}
            <TabsContent value="received" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Inbox className="h-5 w-5 text-primary" />
                    إفادات واردة من الجهات الرقابية
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingReceived ? renderLoader() : receivedAttestations.length === 0 ? (
                    <div className="text-center py-10 space-y-3">
                      <Inbox className="h-12 w-12 mx-auto text-muted-foreground/30" />
                      <p className="text-muted-foreground text-sm">لا توجد إفادات واردة من جهات رقابية</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {receivedAttestations.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full flex items-center justify-center bg-primary/10">
                              <Shield className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                إفادة رقم: <span className="font-mono text-xs">{att.attestation_number}</span>
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>من: {att.regulator_org?.name || 'جهة رقابية'}</span>
                                <span>·</span>
                                <span>{format(new Date(att.issued_at), 'dd MMM yyyy', { locale: ar })}</span>
                              </div>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                صالحة حتى: {format(new Date(att.valid_until), 'dd MMM yyyy', { locale: ar })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(att.status)}
                            <Badge variant="outline" className="text-[10px]">
                              {att.attestation_type === 'registration_fee' ? 'رسوم تسجيل' :
                               att.attestation_type === 'license_renewal' ? 'تجديد ترخيص' :
                               att.attestation_type === 'compliance' ? 'امتثال' : att.attestation_type}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <p className="text-muted-foreground text-center py-8">يرجى اختيار منظمة أولاً</p>
        )}

        <AttestationDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) loadIssued();
          }}
          existingAttestation={selectedAttestation}
        />
      </div>
    </DashboardLayout>
  );
};

export default OrganizationAttestation;
