/**
 * لوحة السجل المركزي — مضمنة داخل مركز المستندات الموحد
 * Wraps CentralDocumentRegistry content without DashboardLayout
 */
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  FileText, Search, Filter, Clock, CheckCircle2,
  AlertCircle, PenTool, Eye, Download, ExternalLink,
  Building2, FileCheck, FileClock, FileX, Archive, Shield, Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import {
  useDocumentRegistry, useMyPendingSignatures,
  DOC_CATEGORY_LABELS, DOC_STATUS_LABELS
} from '@/hooks/useDocumentRegistry';
import { motion } from 'framer-motion';

const statusConfig: Record<string, { icon: any; color: string; bg: string }> = {
  draft: { icon: FileText, color: 'text-muted-foreground', bg: 'bg-muted' },
  pending_signatures: { icon: FileClock, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/20' },
  partially_signed: { icon: PenTool, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/20' },
  fully_signed: { icon: FileCheck, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/20' },
  archived: { icon: Archive, color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-900/20' },
  expired: { icon: FileX, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/20' },
  revoked: { icon: AlertCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
};

const RegistryPanel = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const { documents, isLoading, stats } = useDocumentRegistry({
    category: categoryFilter,
    status: statusFilter,
    search,
  });

  const { data: pendingSignatures = [] } = useMyPendingSignatures();

  const kpiCards = [
    { label: 'إجمالي المستندات', value: stats.total, icon: FileText, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'بانتظار التوقيع', value: stats.pending + stats.partial, icon: FileClock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'مكتمل التوقيع', value: stats.completed, icon: FileCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'توقيعاتي المعلقة', value: pendingSignatures.length, icon: PenTool, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  ];

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpiCards.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${kpi.color}`} />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{kpi.value}</p>
                    <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex-1 relative min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="بحث بالعنوان أو الرقم..." value={search} onChange={e => setSearch(e.target.value)} className="pr-9" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-32"><SelectValue placeholder="الفئة" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            {Object.entries(DOC_CATEGORY_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32"><SelectValue placeholder="الحالة" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            {Object.entries(DOC_STATUS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Pending Signatures Alert */}
      {pendingSignatures.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PenTool className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium">لديك {pendingSignatures.length} توقيعات معلقة</span>
              </div>
              <Button size="sm" variant="outline" onClick={() => navigate('/dashboard/signing-inbox')} className="gap-1">
                صندوق التوقيعات <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : documents.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">
          <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>لا توجد مستندات في السجل</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {documents.map((doc: any) => {
            const st = statusConfig[doc.status] || statusConfig.draft;
            const StIcon = st.icon;
            return (
              <Card key={doc.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg ${st.bg} flex items-center justify-center shrink-0`}>
                    <StIcon className={`w-4 h-4 ${st.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.title}</p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      {doc.document_number && <span>{doc.document_number}</span>}
                      <span>{DOC_CATEGORY_LABELS[doc.category] || doc.category}</span>
                      <span>{format(new Date(doc.created_at), 'dd/MM/yyyy', { locale: ar })}</span>
                    </div>
                  </div>
                  <Badge className={`${st.bg} ${st.color} text-[10px]`}>
                    {DOC_STATUS_LABELS[doc.status] || doc.status}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RegistryPanel;
