import { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useConsultantCoSigning } from '@/hooks/useConsultantCoSigning';
import {
  Pen, Stamp, ShieldCheck, Building2, Clock,
  CheckCircle2, XCircle, Loader2, FileText, Eye,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive'; icon: any }> = {
  approved: { label: 'معتمد', variant: 'default', icon: CheckCircle2 },
  pending: { label: 'قيد المراجعة', variant: 'secondary', icon: Clock },
  rejected: { label: 'مرفوض', variant: 'destructive', icon: XCircle },
};

const ConsultantSigningCenter = memo(() => {
  const { profile } = useAuth();
  const { consultantProfile, isInOffice, officeMemberships } = useConsultantCoSigning();
  const [tab, setTab] = useState('all');

  const { data: signatures = [], isLoading } = useQuery({
    queryKey: ['my-signatures', (consultantProfile as any)?.id],
    queryFn: async () => {
      if (!(consultantProfile as any)?.id) return [];
      const { data } = await supabase
        .from('consultant_document_signatures')
        .select('*')
        .eq('consultant_id', (consultantProfile as any).id)
        .order('signed_at', { ascending: false });
      return data || [];
    },
    enabled: !!(consultantProfile as any)?.id,
  });

  const pendingSigs = signatures.filter((s: any) => s.director_approval_status === 'pending');
  const approvedSigs = signatures.filter((s: any) => s.director_approval_status === 'approved' || !s.office_id);
  const rejectedSigs = signatures.filter((s: any) => s.director_approval_status === 'rejected');

  const filteredSigs = tab === 'pending' ? pendingSigs : tab === 'approved' ? approvedSigs : tab === 'rejected' ? rejectedSigs : signatures;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="flex items-center gap-2"><Pen className="w-5 h-5 text-primary" />مركز الاعتماد والتوقيع</CardTitle>
            <CardDescription>جميع توقيعاتك الرقمية وحالة اعتمادها</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isInOffice && (
              <Badge variant="outline" className="text-[10px] gap-1">
                <Building2 className="w-3 h-3" />{(officeMemberships[0] as any)?.office?.office_name || 'مكتب'}
              </Badge>
            )}
            <Badge variant="secondary" className="text-[10px]">{signatures.length} توقيع</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stamp & Signature Preview */}
        {consultantProfile && (
          <div className="flex items-center gap-6 p-4 rounded-xl border border-border bg-muted/30 mb-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-lg border-2 border-dashed border-primary/30 flex items-center justify-center bg-card">
                {(consultantProfile as any).signature_url ? (
                  <img src={(consultantProfile as any).signature_url} alt="التوقيع" className="max-w-full max-h-full object-contain" />
                ) : (
                  <Pen className="w-6 h-6 text-muted-foreground/30" />
                )}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">التوقيع</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-lg border-2 border-dashed border-primary/30 flex items-center justify-center bg-card">
                {(consultantProfile as any).stamp_url ? (
                  <img src={(consultantProfile as any).stamp_url} alt="الختم" className="max-w-full max-h-full object-contain" />
                ) : (
                  <Stamp className="w-6 h-6 text-muted-foreground/30" />
                )}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">الختم الشخصي</p>
            </div>
            <div className="flex-1 text-sm">
              <p className="font-bold">{(consultantProfile as any).full_name}</p>
              <p className="text-muted-foreground text-xs">{(consultantProfile as any).specialization || 'استشاري بيئي'}</p>
              <Badge variant="outline" className="text-[9px] mt-1 font-mono">{(consultantProfile as any).consultant_code || 'EC-XXXX'}</Badge>
            </div>
          </div>
        )}

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full justify-start gap-1">
            <TabsTrigger value="all" className="gap-1"><FileText className="w-3.5 h-3.5" />الكل ({signatures.length})</TabsTrigger>
            <TabsTrigger value="pending" className="gap-1"><Clock className="w-3.5 h-3.5" />قيد المراجعة ({pendingSigs.length})</TabsTrigger>
            <TabsTrigger value="approved" className="gap-1"><CheckCircle2 className="w-3.5 h-3.5" />معتمد ({approvedSigs.length})</TabsTrigger>
            <TabsTrigger value="rejected" className="gap-1"><XCircle className="w-3.5 h-3.5" />مرفوض ({rejectedSigs.length})</TabsTrigger>
          </TabsList>

          <div className="mt-4">
            {isLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : filteredSigs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Pen className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium">لا توجد توقيعات في هذا التصنيف</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSigs.map((sig: any) => {
                  const status = sig.director_approval_status ? statusConfig[sig.director_approval_status] : null;
                  return (
                    <div key={sig.id} className="flex items-start gap-3 p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        {sig.stamp_applied ? <Stamp className="w-5 h-5 text-primary" /> : <Pen className="w-5 h-5 text-primary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <p className="text-sm font-medium">{sig.document_type || 'مستند'}</p>
                          <span className="text-[10px] text-muted-foreground">
                            {format(parseISO(sig.signed_at), 'dd MMM yyyy HH:mm', { locale: ar })}
                          </span>
                        </div>
                        {sig.signed_as_role && <Badge variant="secondary" className="text-[9px] mt-1">{sig.signed_as_role}</Badge>}
                        {sig.solidarity_statement && (
                          <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">{sig.solidarity_statement}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {status && (
                            <Badge variant={status.variant} className="text-[9px] gap-0.5">
                              <status.icon className="w-2.5 h-2.5" />{status.label}
                            </Badge>
                          )}
                          {sig.office_stamp_applied && (
                            <Badge variant="default" className="text-[9px] gap-0.5"><Stamp className="w-2.5 h-2.5" />مختوم</Badge>
                          )}
                          {sig.signature_hash && (
                            <Badge variant="outline" className="text-[8px] font-mono">{sig.signature_hash.slice(0, 12)}...</Badge>
                          )}
                        </div>
                        {sig.director_notes && (
                          <p className="text-[10px] text-muted-foreground mt-1 p-1.5 rounded bg-muted/50">
                            <span className="font-medium">ملاحظة المدير:</span> {sig.director_notes}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
});

ConsultantSigningCenter.displayName = 'ConsultantSigningCenter';
export default ConsultantSigningCenter;
