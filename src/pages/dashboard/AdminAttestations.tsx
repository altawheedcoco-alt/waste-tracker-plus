import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { FileText, Eye, Search, Loader2, Ban } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import AttestationDialog from '@/components/attestation/AttestationDialog';
import type { AttestationData } from '@/hooks/useOrganizationAttestation';
import { toast } from 'sonner';

const AdminAttestations = () => {
  const [attestations, setAttestations] = useState<AttestationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAttestation, setSelectedAttestation] = useState<AttestationData | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('organization_attestations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching attestations:', error);
      toast.error('فشل في جلب الإفادات');
    }
    setAttestations((data || []) as unknown as AttestationData[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleRevoke = async (id: string) => {
    const { error } = await supabase
      .from('organization_attestations')
      .update({ status: 'revoked', revoked_at: new Date().toISOString(), revoked_reason: 'إلغاء بواسطة مدير النظام' } as any)
      .eq('id', id);

    if (error) {
      toast.error('فشل في إلغاء الإفادة');
    } else {
      toast.success('تم إلغاء الإفادة');
      fetchAll();
    }
  };

  const filtered = attestations.filter(a =>
    !search.trim() ||
    a.organization_name.toLowerCase().includes(search.toLowerCase()) ||
    a.attestation_number.toLowerCase().includes(search.toLowerCase()) ||
    a.verification_code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <BackButton />
        <div className="flex items-center justify-between">
          <div className="text-right">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              إدارة الإفادات - مدير النظام
            </h1>
            <p className="text-muted-foreground text-sm">عرض وإدارة جميع إفادات التسجيل والاعتماد الرقمي للجهات</p>
          </div>
          <Badge variant="outline" className="text-sm">
            {attestations.length} إفادة
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث باسم الجهة أو رقم الإفادة..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pr-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">لا توجد إفادات</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full flex items-center justify-center bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{att.organization_name}</p>
                        <p className="text-xs text-muted-foreground">
                          <span className="font-mono">{att.attestation_number}</span>
                          {' · '}
                          {format(new Date(att.issued_at), 'dd MMM yyyy', { locale: ar })}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          كود التحقق: <span className="font-mono font-bold">{att.verification_code}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={att.status === 'active' ? 'default' : 'destructive'}>
                        {att.status === 'active' ? 'سارية' : 'ملغاة'}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAttestation(att);
                          setDialogOpen(true);
                        }}
                      >
                        <Eye className="ml-1 h-3.5 w-3.5" />
                        عرض
                      </Button>
                      {att.status === 'active' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRevoke(att.id)}
                        >
                          <Ban className="ml-1 h-3.5 w-3.5" />
                          إلغاء
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <AttestationDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) fetchAll();
          }}
          existingAttestation={selectedAttestation}
        />
      </div>
    </DashboardLayout>
  );
};

export default AdminAttestations;
