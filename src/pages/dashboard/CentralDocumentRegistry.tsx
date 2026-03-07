import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  FileText, Search, ArrowRight, Filter, Clock, CheckCircle2,
  AlertCircle, PenTool, Stamp, Eye, Download, ExternalLink,
  Building2, FileCheck, FileClock, FileX, Archive, Shield
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

const CentralDocumentRegistry = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('registry');

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
    <DashboardLayout>
      <div className="p-4 sm:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowRight className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary" />
                السجل المركزي للوثائق
              </h1>
              <p className="text-xs text-muted-foreground">سجل شامل لكافة المستندات والوثائق مع التوقيعات والأختام</p>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {kpiCards.map((kpi, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                    <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-black">{kpi.value}</p>
                    <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="registry" className="gap-1.5">
              <FileText className="w-3.5 h-3.5" /> سجل الوثائق
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-1.5">
              <PenTool className="w-3.5 h-3.5" /> توقيعاتي المعلقة
              {pendingSignatures.length > 0 && (
                <Badge className="h-4 min-w-4 rounded-full text-[9px] px-1 bg-destructive text-destructive-foreground">
                  {pendingSignatures.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Registry Tab */}
          <TabsContent value="registry" className="space-y-3">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="بحث بالعنوان أو رقم المستند..."
                  className="pr-9 h-9"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-36 h-9">
                  <SelectValue placeholder="التصنيف" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل التصنيفات</SelectItem>
                  {Object.entries(DOC_CATEGORY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 h-9">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الحالات</SelectItem>
                  {Object.entries(DOC_STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Document List */}
            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {isLoading ? (
                  <p className="text-center py-12 text-muted-foreground text-sm">جاري التحميل...</p>
                ) : documents.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-medium">لا توجد مستندات</p>
                    <p className="text-xs mt-1">المستندات ستظهر هنا تلقائياً عند إنشائها من أي مكان في المنصة</p>
                  </div>
                ) : (
                  documents.map((doc, i) => {
                    const sc = statusConfig[doc.status] || statusConfig.draft;
                    const StatusIcon = sc.icon;
                    return (
                      <motion.div
                        key={doc.id}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.02 }}
                      >
                        <Card className="hover:shadow-sm transition-shadow cursor-pointer">
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                <div className={`w-10 h-10 rounded-lg ${sc.bg} flex items-center justify-center shrink-0`}>
                                  <StatusIcon className={`w-5 h-5 ${sc.color}`} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <h3 className="text-sm font-semibold truncate">{doc.title}</h3>
                                    <Badge variant="outline" className="text-[9px] shrink-0">
                                      {doc.document_number}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Badge className={`text-[9px] h-4 ${sc.bg} ${sc.color} border-0`}>
                                      {DOC_STATUS_LABELS[doc.status as keyof typeof DOC_STATUS_LABELS] || doc.status}
                                    </Badge>
                                    <Badge variant="secondary" className="text-[9px] h-4">
                                      {DOC_CATEGORY_LABELS[doc.category as keyof typeof DOC_CATEGORY_LABELS] || doc.category}
                                    </Badge>
                                    {doc.total_signatures_required > 0 && (
                                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                        <PenTool className="w-3 h-3" />
                                        {doc.total_signatures_completed}/{doc.total_signatures_required}
                                      </span>
                                    )}
                                    {(doc.party_organization_ids?.length || 0) > 0 && (
                                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                        <Building2 className="w-3 h-3" />
                                        {doc.party_organization_ids.length} جهات
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                {doc.file_url && (
                                  <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                                      <Eye className="w-3.5 h-3.5" />
                                    </a>
                                  </Button>
                                )}
                                <span className="text-[10px] text-muted-foreground">
                                  {format(new Date(doc.created_at), 'dd/MM/yy', { locale: ar })}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Pending Signatures Tab */}
          <TabsContent value="pending" className="space-y-3">
            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {pendingSignatures.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-20 text-emerald-500" />
                    <p className="text-sm font-medium">لا توجد توقيعات معلقة</p>
                    <p className="text-xs mt-1">أنت محدّث! لا توجد مستندات تنتظر توقيعك</p>
                  </div>
                ) : (
                  pendingSignatures.map((sig: any, i: number) => (
                    <motion.div
                      key={sig.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <Card className="border-amber-200 dark:border-amber-800/30 bg-amber-50/30 dark:bg-amber-900/5">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
                                {sig.action_type === 'stamp' ? (
                                  <Stamp className="w-5 h-5 text-amber-600" />
                                ) : (
                                  <PenTool className="w-5 h-5 text-amber-600" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <h3 className="text-sm font-semibold truncate">
                                  {sig.document?.title || 'مستند'}
                                </h3>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-[9px]">
                                    {sig.document?.document_number}
                                  </Badge>
                                  <Badge className="text-[9px] h-4 bg-amber-100 text-amber-700 border-0">
                                    {sig.action_type === 'sign' ? 'توقيع' : sig.action_type === 'stamp' ? 'ختم' : sig.action_type === 'approve' ? 'اعتماد' : 'شهادة'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700">
                                <PenTool className="w-3.5 h-3.5 ml-1" />
                                وقّع الآن
                              </Button>
                              <span className="text-[10px] text-muted-foreground">
                                {format(new Date(sig.created_at), 'dd/MM', { locale: ar })}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default CentralDocumentRegistry;
