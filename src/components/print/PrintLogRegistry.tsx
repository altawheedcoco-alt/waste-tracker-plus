import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  FileText, Search, Printer, Download, Send, Filter,
  Calendar, User, Hash, Eye, ChevronDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const actionLabels: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  print: { label: 'طباعة', icon: Printer, color: 'bg-blue-100 text-blue-700' },
  pdf_export: { label: 'تصدير PDF', icon: Download, color: 'bg-green-100 text-green-700' },
  email: { label: 'بريد', icon: Send, color: 'bg-purple-100 text-purple-700' },
  whatsapp: { label: 'واتساب', icon: Send, color: 'bg-emerald-100 text-emerald-700' },
  save: { label: 'حفظ', icon: FileText, color: 'bg-amber-100 text-amber-700' },
};

const docTypeLabels: Record<string, string> = {
  shipment: 'شحنة',
  invoice: 'فاتورة',
  certificate: 'شهادة',
  contract: 'عقد',
  receipt: 'إيصال',
  report: 'تقرير',
};

const PrintLogRegistry = () => {
  const { profile } = useAuth();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterAction, setFilterAction] = useState<string>('all');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['print-logs', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      const { data, error } = await supabase
        .from('document_print_log' as any)
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!profile?.organization_id,
  });

  const filtered = useMemo(() => {
    return logs.filter((log: any) => {
      const matchSearch = !search || 
        log.print_tracking_code?.toLowerCase().includes(search.toLowerCase()) ||
        log.document_number?.toLowerCase().includes(search.toLowerCase()) ||
        log.printed_by_name?.toLowerCase().includes(search.toLowerCase()) ||
        log.printed_by_employee_code?.toLowerCase().includes(search.toLowerCase());
      const matchType = filterType === 'all' || log.document_type === filterType;
      const matchAction = filterAction === 'all' || log.action_type === filterAction;
      return matchSearch && matchType && matchAction;
    });
  }, [logs, search, filterType, filterAction]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5 text-primary" />
            سجل المطبوعات والمستندات
          </CardTitle>
          <Badge variant="outline">{logs.length} سجل</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="بحث برقم التتبع أو رقم المستند أو الاسم..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-9"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="نوع المستند" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              {Object.entries(docTypeLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterAction} onValueChange={setFilterAction}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="نوع الإجراء" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              {Object.entries(actionLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">رمز التتبع</TableHead>
                <TableHead className="text-right">نوع المستند</TableHead>
                <TableHead className="text-right">رقم المستند</TableHead>
                <TableHead className="text-right">الإجراء</TableHead>
                <TableHead className="text-right">بواسطة</TableHead>
                <TableHead className="text-right">كود الموظف</TableHead>
                <TableHead className="text-right">التاريخ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    جاري التحميل...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    لا توجد سجلات
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((log: any) => {
                  const action = actionLabels[log.action_type] || actionLabels.print;
                  const ActionIcon = action.icon;
                  return (
                    <TableRow key={log.id}>
                      <TableCell>
                        <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                          {log.print_tracking_code}
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
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${action.color}`}>
                          <ActionIcon className="w-3 h-3" />
                          {action.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.printed_by_name || '-'}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                          {log.printed_by_employee_code || '-'}
                        </code>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {log.created_at ? format(new Date(log.created_at), 'PPp', { locale: ar }) : '-'}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default PrintLogRegistry;
