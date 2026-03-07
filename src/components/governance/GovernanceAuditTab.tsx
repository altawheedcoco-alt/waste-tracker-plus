import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGovernanceAudit } from '@/hooks/useGovernance';
import { Loader2, Search, ScrollText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const ACTION_LABELS: Record<string, string> = {
  create: 'إنشاء',
  update: 'تعديل',
  delete: 'حذف',
  approve: 'موافقة',
  reject: 'رفض',
  login: 'تسجيل دخول',
  export: 'تصدير',
  permission_change: 'تغيير صلاحية',
};

const SEVERITY_COLORS: Record<string, string> = {
  info: 'bg-blue-100 text-blue-800',
  warning: 'bg-amber-100 text-amber-800',
  critical: 'bg-red-100 text-red-800',
};

const RESOURCE_LABELS: Record<string, string> = {
  shipment: 'شحنة',
  invoice: 'فاتورة',
  contract: 'عقد',
  payment: 'دفعة',
  employee: 'موظف',
  role: 'دور',
  workflow: 'سلسلة موافقات',
  settings: 'إعدادات',
};

export default function GovernanceAuditTab() {
  const { entries, isLoading } = useGovernanceAudit();
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');

  const filtered = entries.filter(e => {
    if (search && !(e.user_name?.includes(search) || e.resource_title?.includes(search) || e.resource_type?.includes(search))) return false;
    if (filterAction !== 'all' && e.action_type !== filterAction) return false;
    if (filterSeverity !== 'all' && e.severity !== filterSeverity) return false;
    return true;
  });

  const exportCSV = () => {
    const headers = 'التاريخ,المستخدم,الإجراء,النوع,التفاصيل,الخطورة\n';
    const rows = filtered.map(e =>
      `${format(new Date(e.created_at), 'yyyy-MM-dd HH:mm')},${e.user_name || ''},${ACTION_LABELS[e.action_type] || e.action_type},${RESOURCE_LABELS[e.resource_type] || e.resource_type},${e.resource_title || ''},${e.severity}`
    ).join('\n');
    const blob = new Blob(['\uFEFF' + headers + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-trail-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <ScrollText className="w-5 h-5" />
          سجل التدقيق الشامل
        </h3>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="w-4 h-4 ml-1" /> تصدير CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pr-9" placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="w-36"><SelectValue placeholder="الإجراء" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الإجراءات</SelectItem>
            {Object.entries(ACTION_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterSeverity} onValueChange={setFilterSeverity}>
          <SelectTrigger className="w-32"><SelectValue placeholder="الخطورة" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="info">معلوماتي</SelectItem>
            <SelectItem value="warning">تحذير</SelectItem>
            <SelectItem value="critical">حرج</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground">{filtered.length} سجل</p>

      {filtered.length === 0 && (
        <Card><CardContent className="py-8 text-center text-muted-foreground">لا توجد سجلات تدقيق</CardContent></Card>
      )}

      <div className="space-y-1">
        {filtered.map(e => (
          <div key={e.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">{e.user_name || 'نظام'}</span>
                <Badge variant="outline" className="text-xs">{ACTION_LABELS[e.action_type] || e.action_type}</Badge>
                <Badge variant="outline" className="text-xs">{RESOURCE_LABELS[e.resource_type] || e.resource_type}</Badge>
                <Badge variant="outline" className={`text-xs ${SEVERITY_COLORS[e.severity]}`}>{e.severity}</Badge>
              </div>
              {e.resource_title && <p className="text-xs text-muted-foreground mt-0.5 truncate">{e.resource_title}</p>}
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {format(new Date(e.created_at), 'dd MMM yyyy HH:mm', { locale: ar })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
