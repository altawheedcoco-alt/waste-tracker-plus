import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Eye, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import AttestationDialog from './AttestationDialog';
import { useOrganizationAttestation, type AttestationData } from '@/hooks/useOrganizationAttestation';

interface AttestationTabContentProps {
  organizationId: string;
}

const AttestationTabContent = ({ organizationId }: AttestationTabContentProps) => {
  const { fetchAttestations } = useOrganizationAttestation();
  const [attestations, setAttestations] = useState<AttestationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAttestation, setSelectedAttestation] = useState<AttestationData | null>(null);

  const loadAttestations = async () => {
    setLoading(true);
    const data = await fetchAttestations();
    setAttestations(data);
    setLoading(false);
  };

  useEffect(() => {
    loadAttestations();
  }, [organizationId]);

  const handleView = (att: AttestationData) => {
    setSelectedAttestation(att);
    setDialogOpen(true);
  };

  const handleNew = () => {
    setSelectedAttestation(null);
    setDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            إفادات التسجيل والاعتماد الرقمي
          </CardTitle>
          <Button onClick={handleNew} size="sm">
            <Plus className="ml-2 h-4 w-4" />
            طلب إفادة جديدة
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : attestations.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground">لا توجد إفادات صادرة بعد</p>
            <Button variant="outline" onClick={handleNew}>
              <Plus className="ml-2 h-4 w-4" />
              طلب أول إفادة
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {attestations.map((att) => (
              <div
                key={att.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">إفادة رقم: <span className="font-mono">{att.attestation_number}</span></p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(att.issued_at), 'dd MMMM yyyy - hh:mm a', { locale: ar })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={att.status === 'active' ? 'default' : 'destructive'}>
                    {att.status === 'active' ? 'سارية' : 'ملغاة'}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={() => handleView(att)}>
                    <Eye className="ml-1 h-3.5 w-3.5" />
                    عرض
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <AttestationDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) loadAttestations();
          }}
          existingAttestation={selectedAttestation}
        />
      </CardContent>
    </Card>
  );
};

export default AttestationTabContent;
