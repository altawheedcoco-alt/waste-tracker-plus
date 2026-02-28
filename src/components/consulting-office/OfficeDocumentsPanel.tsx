import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useConsultingOffice } from '@/hooks/useConsultingOffice';
import {
  FileText, ShieldCheck, CheckCircle2, Clock, Loader2,
  Pen, Stamp, Download, Eye,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';

const OfficeDocumentsPanel = memo(() => {
  const { office, members } = useConsultingOffice();

  const { data: signatures = [], isLoading } = useQuery({
    queryKey: ['office-all-signatures', office?.id],
    queryFn: async () => {
      if (!office?.id) return [];
      const { data } = await supabase
        .from('consultant_document_signatures')
        .select(`*, consultant:environmental_consultants(full_name, consultant_code)`)
        .eq('office_id', office.id)
        .order('signed_at', { ascending: false })
        .limit(100);
      return data || [];
    },
    enabled: !!office?.id,
  });

  const approvedDocs = signatures.filter((s: any) => s.director_approval_status === 'approved');
  const pendingDocs = signatures.filter((s: any) => s.director_approval_status === 'pending');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-primary" />المستندات والتقارير</CardTitle>
        <CardDescription>جميع المخرجات الموقعة والمعتمدة من المكتب</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 rounded-lg border border-border">
            <p className="text-2xl font-bold">{signatures.length}</p>
            <p className="text-xs text-muted-foreground">إجمالي المستندات</p>
          </div>
          <div className="text-center p-3 rounded-lg border border-border">
            <p className="text-2xl font-bold text-emerald-600">{approvedDocs.length}</p>
            <p className="text-xs text-muted-foreground">معتمد</p>
          </div>
          <div className="text-center p-3 rounded-lg border border-border">
            <p className="text-2xl font-bold text-amber-600">{pendingDocs.length}</p>
            <p className="text-xs text-muted-foreground">قيد المراجعة</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : signatures.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">لا توجد مستندات بعد</p>
          </div>
        ) : (
          <div className="space-y-3">
            {signatures.map((sig: any) => (
              <div key={sig.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  {sig.stamp_applied ? <Stamp className="w-4 h-4 text-primary" /> : <Pen className="w-4 h-4 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{sig.document_type || 'مستند'}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {sig.consultant?.full_name} — {format(parseISO(sig.signed_at), 'dd MMM yyyy', { locale: ar })}
                  </p>
                </div>
                <Badge variant={sig.director_approval_status === 'approved' ? 'default' : sig.director_approval_status === 'rejected' ? 'destructive' : 'secondary'} className="text-[9px]">
                  {sig.director_approval_status === 'approved' ? 'معتمد' : sig.director_approval_status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

OfficeDocumentsPanel.displayName = 'OfficeDocumentsPanel';
export default OfficeDocumentsPanel;
