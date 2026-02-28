import { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useConsultingOffice } from '@/hooks/useConsultingOffice';
import {
  FileText, CheckCircle2, Clock, Loader2,
  Pen, Stamp, Search, XCircle,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import { motion } from 'framer-motion';

const OfficeDocumentsPanel = memo(() => {
  const { office } = useConsultingOffice();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');

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

  const filtered = signatures.filter((s: any) => {
    const matchSearch = !search || (s.document_type || '').includes(search) || s.consultant?.full_name?.includes(search);
    const matchTab = tab === 'all' ||
      (tab === 'approved' && s.director_approval_status === 'approved') ||
      (tab === 'pending' && s.director_approval_status === 'pending') ||
      (tab === 'rejected' && s.director_approval_status === 'rejected');
    return matchSearch && matchTab;
  });

  const approvedDocs = signatures.filter((s: any) => s.director_approval_status === 'approved');
  const pendingDocs = signatures.filter((s: any) => s.director_approval_status === 'pending');
  const rejectedDocs = signatures.filter((s: any) => s.director_approval_status === 'rejected');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-primary" />المستندات والتقارير</CardTitle>
            <CardDescription>جميع المخرجات الموقعة والمعتمدة من المكتب</CardDescription>
          </div>
          <div className="relative w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="بحث..." className="pr-9 text-sm" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 rounded-lg border border-border bg-card">
            <p className="text-2xl font-bold">{signatures.length}</p>
            <p className="text-xs text-muted-foreground">الإجمالي</p>
          </div>
          <div className="text-center p-3 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
            <p className="text-2xl font-bold text-emerald-600">{approvedDocs.length}</p>
            <p className="text-xs text-muted-foreground">معتمد</p>
          </div>
          <div className="text-center p-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
            <p className="text-2xl font-bold text-amber-600">{pendingDocs.length}</p>
            <p className="text-xs text-muted-foreground">قيد المراجعة</p>
          </div>
          <div className="text-center p-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20">
            <p className="text-2xl font-bold text-destructive">{rejectedDocs.length}</p>
            <p className="text-xs text-muted-foreground">مرفوض</p>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="mb-4">
          <TabsList>
            <TabsTrigger value="all">الكل ({signatures.length})</TabsTrigger>
            <TabsTrigger value="approved">معتمد ({approvedDocs.length})</TabsTrigger>
            <TabsTrigger value="pending">قيد المراجعة ({pendingDocs.length})</TabsTrigger>
            <TabsTrigger value="rejected">مرفوض ({rejectedDocs.length})</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">لا توجد مستندات {search ? 'مطابقة' : 'بعد'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((sig: any, i: number) => (
              <motion.div key={sig.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  {sig.stamp_applied ? <Stamp className="w-4 h-4 text-primary" /> : <Pen className="w-4 h-4 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{sig.document_type || 'مستند'}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>{sig.consultant?.full_name}</span>
                    <span>•</span>
                    <span>{format(parseISO(sig.signed_at), 'dd MMM yyyy', { locale: ar })}</span>
                  </div>
                </div>
                <Badge variant={sig.director_approval_status === 'approved' ? 'default' : sig.director_approval_status === 'rejected' ? 'destructive' : 'secondary'} className="text-[9px] gap-0.5">
                  {sig.director_approval_status === 'approved' && <CheckCircle2 className="w-2.5 h-2.5" />}
                  {sig.director_approval_status === 'pending' && <Clock className="w-2.5 h-2.5" />}
                  {sig.director_approval_status === 'rejected' && <XCircle className="w-2.5 h-2.5" />}
                  {sig.director_approval_status === 'approved' ? 'معتمد' : sig.director_approval_status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                </Badge>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

OfficeDocumentsPanel.displayName = 'OfficeDocumentsPanel';
export default OfficeDocumentsPanel;
