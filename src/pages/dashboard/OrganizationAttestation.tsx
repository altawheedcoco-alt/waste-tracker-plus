import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Eye, Loader2, Inbox, Send, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import AttestationDialog from '@/components/attestation/AttestationDialog';
import { useOrganizationAttestation, type AttestationData } from '@/hooks/useOrganizationAttestation';
import { supabase } from '@/integrations/supabase/client';

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

  const [activeTab, setActiveTab] = useState('issued');
  const [issuedAttestations, setIssuedAttestations] = useState<AttestationData[]>([]);
  const [receivedAttestations, setReceivedAttestations] = useState<RegulatoryAttestation[]>([]);
  const [loadingIssued, setLoadingIssued] = useState(true);
  const [loadingReceived, setLoadingReceived] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAttestation, setSelectedAttestation] = useState<AttestationData | null>(null);

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">سارية</Badge>;
      case 'revoked': return <Badge variant="destructive">ملغاة</Badge>;
      case 'expired': return <Badge variant="secondary">منتهية</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderEmptyState = (message: string) => (
    <div className="text-center py-12 space-y-3">
      <FileText className="h-12 w-12 mx-auto text-muted-foreground/30" />
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );

  const renderLoader = () => (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <BackButton />
        <div className="flex items-center justify-between">
          <div className="text-right">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              الإفادات الرسمية
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              إفاداتك الصادرة والواردة من الجهات الرقابية في مكان واحد
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
              <TabsTrigger value="issued" className="flex-1 gap-1.5 text-xs sm:text-sm">
                <Send className="w-4 h-4" />
                إفاداتي الصادرة
                {issuedAttestations.length > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px] mr-1">{issuedAttestations.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="received" className="flex-1 gap-1.5 text-xs sm:text-sm">
                <Inbox className="w-4 h-4" />
                إفادات واردة
                {receivedAttestations.length > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px] mr-1">{receivedAttestations.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

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
                      {renderEmptyState('لا توجد إفادات صادرة بعد')}
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
                    renderEmptyState('لا توجد إفادات واردة من جهات رقابية')
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
