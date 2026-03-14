import { useState, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  FileText, Search, Printer, Download, Send, Eye, ExternalLink,
  ChevronLeft, ChevronRight, FolderOpen, RefreshCw,
} from 'lucide-react';
import BackButton from '@/components/ui/back-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const PAGE_SIZE = 30;

const actionLabels: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  print: { label: 'طباعة', icon: Printer, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  pdf_export: { label: 'تصدير PDF', icon: Download, color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  email: { label: 'بريد', icon: Send, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  whatsapp: { label: 'واتساب', icon: Send, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  save: { label: 'حفظ', icon: FileText, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
};

const docTypeLabels: Record<string, string> = {
  shipment: 'شحنة',
  invoice: 'فاتورة',
  certificate: 'شهادة',
  contract: 'عقد',
  receipt: 'إيصال',
  report: 'تقرير',
  declaration: 'إقرار',
  tracking_form: 'نموذج تتبع',
  recycling_cert: 'شهادة تدوير',
  delivery_declaration: 'إقرار تسليم',
  award_letter: 'خطاب ترسية',
  work_order: 'أمر شغل',
};

const categoryLabels: Record<string, string> = {
  operations: 'عمليات',
  legal: 'قانونية',
  financial: 'مالية',
  compliance: 'امتثال',
  reports: 'تقارير',
};

const ManualOperations = () => {
  const { profile } = useAuth();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['manual-operations', profile?.organization_id, page, filterType, filterAction, filterCategory],
    queryFn: async () => {
      if (!profile?.organization_id) return { logs: [], count: 0 };

      let query = supabase
        .from('document_print_log')
        .select('*', { count: 'exact' })
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (filterType !== 'all') query = query.eq('document_type', filterType);
      if (filterAction !== 'all') query = query.eq('action_type', filterAction);
      if (filterCategory !== 'all') query = query.eq('document_category', filterCategory);

      const { data: logs, error, count } = await query;
      if (error) throw error;
      return { logs: logs || [], count: count || 0 };
    },
    enabled: !!profile?.organization_id,
  });

  const logs = data?.logs || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const filtered = useMemo(() => {
    if (!search) return logs;
    const s = search.toLowerCase();
    return logs.filter((log: any) =>
      log.print_tracking_code?.toLowerCase().includes(s) ||
      log.document_number?.toLowerCase().includes(s) ||
      log.printed_by_name?.toLowerCase().includes(s) ||
      log.description?.toLowerCase().includes(s) ||
      log.ai_summary?.toLowerCase().includes(s)
    );
  }, [logs, search]);

  const handleFilterChange = useCallback((setter: (v: string) => void) => (val: string) => {
    setter(val);
    setPage(0);
  }, []);

  const handleOpenFile = (url: string) => {
    if (!url) {
      toast.error('لا يوجد ملف مرفق لهذا السجل');
      return;
    }
    setPreviewUrl(url);
  };

  const handleDownload = (url: string, name: string) => {
    if (!url) {
      toast.error('لا يوجد ملف للتحميل');
      return;
    }
    const a = document.createElement('a');
    a.href = url;
    a.download = name || 'document.pdf';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = (url: string) => {
    if (!url) {
      toast.error('لا يوجد ملف للطباعة');
      return;
    }
    const w = window.open(url, '_blank');
    if (w) {
      w.addEventListener('load', () => w.print());
    }
  };

  // Stats
  const stats = useMemo(() => {
    const types = new Set(logs.map((l: any) => l.document_type));
    const withFile = logs.filter((l: any) => l.file_url).length;
    return { types: types.size, withFile, total: totalCount };
  }, [logs, totalCount]);

  return (
    <div className="space-y-3 sm:space-y-4" dir="rtl">
      <BackButton />
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shrink-0">
            <FolderOpen className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-bold text-foreground truncate">الأعمال اليدوية والمستندات</h1>
            <p className="text-[10px] sm:text-sm text-muted-foreground truncate">جميع المستندات المُنشأة والمطبوعة</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1 h-8 px-2 sm:px-3 shrink-0">
          <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">تحديث</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Card className="p-2 sm:p-3">
          <div className="text-lg sm:text-2xl font-bold text-foreground">{stats.total}</div>
          <div className="text-[9px] sm:text-xs text-muted-foreground">إجمالي السجلات</div>
        </Card>
        <Card className="p-2 sm:p-3">
          <div className="text-lg sm:text-2xl font-bold text-primary">{stats.withFile}</div>
          <div className="text-[9px] sm:text-xs text-muted-foreground">ملفات محفوظة</div>
        </Card>
        <Card className="p-2 sm:p-3">
          <div className="text-lg sm:text-2xl font-bold text-foreground">{stats.types}</div>
          <div className="text-[9px] sm:text-xs text-muted-foreground">أنواع المستندات</div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-3 sm:pt-4 space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="بحث برقم التتبع أو الوصف..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-9 h-8 sm:h-9 text-xs sm:text-sm"
              />
            </div>
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
              <Select value={filterType} onValueChange={handleFilterChange(setFilterType)}>
                <SelectTrigger className="w-[110px] sm:w-[140px] h-8 sm:h-9 text-xs sm:text-sm shrink-0">
                  <SelectValue placeholder="نوع المستند" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  {Object.entries(docTypeLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterAction} onValueChange={handleFilterChange(setFilterAction)}>
                <SelectTrigger className="w-[100px] sm:w-[130px] h-8 sm:h-9 text-xs sm:text-sm shrink-0">
                  <SelectValue placeholder="الإجراء" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  {Object.entries(actionLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterCategory} onValueChange={handleFilterChange(setFilterCategory)}>
                <SelectTrigger className="w-[100px] sm:w-[130px] h-8 sm:h-9 text-xs sm:text-sm shrink-0">
                  <SelectValue placeholder="التصنيف" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  {Object.entries(categoryLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">رمز التتبع</TableHead>
                  <TableHead className="text-right">النوع</TableHead>
                  <TableHead className="text-right">رقم المستند</TableHead>
                  <TableHead className="text-right">الوصف</TableHead>
                  <TableHead className="text-right">الإجراء</TableHead>
                  <TableHead className="text-right">بواسطة</TableHead>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-right">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      جاري التحميل...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      لا توجد سجلات
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((log: any) => {
                    const action = actionLabels[log.action_type] || actionLabels.print;
                    const ActionIcon = action.icon;
                    const hasFile = !!log.file_url;
                    return (
                      <TableRow key={log.id} className={hasFile ? '' : 'opacity-70'}>
                        <TableCell>
                          <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                            {log.print_tracking_code || '-'}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {docTypeLabels[log.document_type] || log.document_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm font-mono">
                          {log.document_number || '-'}
                        </TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate" title={log.description || log.ai_summary || ''}>
                          {log.description || log.ai_summary || '-'}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${action.color}`}>
                            <ActionIcon className="w-3 h-3" />
                            {action.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.printed_by_name || '-'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {log.created_at ? format(new Date(log.created_at), 'PPp', { locale: ar }) : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {hasFile && (
                              <>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  title="عرض"
                                  onClick={() => handleOpenFile(log.file_url)}
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  title="تحميل"
                                  onClick={() => handleDownload(log.file_url, `${log.document_type}-${log.document_number || log.print_tracking_code}.pdf`)}
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  title="طباعة"
                                  onClick={() => handlePrint(log.file_url)}
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </Button>
                              </>
                            )}
                            {!hasFile && (
                              <span className="text-xs text-muted-foreground">بدون ملف</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm text-muted-foreground">
                صفحة {page + 1} من {totalPages}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(p => p + 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>معاينة المستند</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => previewUrl && handleDownload(previewUrl, 'document.pdf')}>
                  <Download className="w-4 h-4 ml-1" />
                  تحميل
                </Button>
                <Button size="sm" variant="outline" onClick={() => previewUrl && handlePrint(previewUrl)}>
                  <Printer className="w-4 h-4 ml-1" />
                  طباعة
                </Button>
                <Button size="sm" variant="outline" onClick={() => previewUrl && window.open(previewUrl, '_blank')}>
                  <ExternalLink className="w-4 h-4 ml-1" />
                  فتح
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <iframe
              src={previewUrl}
              className="w-full h-full rounded-lg border"
              title="معاينة المستند"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManualOperations;
