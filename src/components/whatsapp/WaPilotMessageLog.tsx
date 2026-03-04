import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Search, Filter, MessageCircle, ArrowUpRight, ArrowDownLeft,
  CheckCircle2, XCircle, Clock, Eye, FileText, Phone, Building2,
  Calendar, Hash, AlertTriangle, Paperclip, Bot, ChevronLeft, ChevronRight, Users
} from 'lucide-react';

interface MessageLog {
  id: string;
  status: string | null;
  direction: string;
  message_type: string;
  created_at: string;
  organization_id: string | null;
  error_message: string | null;
  content: string | null;
  to_phone: string | null;
  from_phone: string | null;
  template_id: string | null;
  attachment_url: string | null;
  sent_by: string | null;
  meta_message_id: string | null;
  metadata: any;
  interactive_buttons: any;
  broadcast_group_id: string | null;
}

interface OrgInfo {
  id: string;
  name: string;
  name_en?: string | null;
}

interface Props {
  messages: MessageLog[];
  orgs: OrgInfo[];
  loading?: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  sent: { label: 'مُرسلة', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', icon: CheckCircle2 },
  delivered: { label: 'مُسلّمة', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300', icon: CheckCircle2 },
  failed: { label: 'فشلت', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300', icon: XCircle },
  pending: { label: 'قيد الانتظار', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', icon: Clock },
  read: { label: 'مقروءة', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', icon: Eye },
};

const TYPE_LABELS: Record<string, string> = {
  text: 'نصية',
  template: 'قالب',
  interactive: 'تفاعلية',
  image: 'صورة',
  document: 'مستند',
  otp: 'رمز تحقق',
  notification: 'إشعار',
  marketing: 'تسويقية',
};

const PAGE_SIZE = 25;

const WaPilotMessageLog = ({ messages, orgs, loading }: Props) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [directionFilter, setDirectionFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [selectedMessage, setSelectedMessage] = useState<MessageLog | null>(null);

  const orgMap = useMemo(() => new Map(orgs.map(o => [o.id, o])), [orgs]);

  const filteredMessages = useMemo(() => {
    let result = messages;
    if (statusFilter !== 'all') result = result.filter(m => m.status === statusFilter);
    if (directionFilter !== 'all') result = result.filter(m => m.direction === directionFilter);
    if (typeFilter !== 'all') result = result.filter(m => m.message_type === typeFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(m =>
        m.to_phone?.includes(q) ||
        m.from_phone?.includes(q) ||
        m.content?.toLowerCase().includes(q) ||
        m.error_message?.toLowerCase().includes(q) ||
        orgMap.get(m.organization_id || '')?.name?.toLowerCase().includes(q) ||
        orgMap.get(m.organization_id || '')?.name_en?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [messages, statusFilter, directionFilter, typeFilter, search, orgMap]);

  const totalPages = Math.ceil(filteredMessages.length / PAGE_SIZE);
  const pageMessages = filteredMessages.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const msgTypes = useMemo(() => [...new Set(messages.map(m => m.message_type))], [messages]);

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' }) +
      ' ' + date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getStatusBadge = (status: string | null) => {
    const cfg = STATUS_CONFIG[status || ''] || { label: status || 'غير محدد', color: 'bg-muted text-muted-foreground', icon: Hash };
    const Icon = cfg.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${cfg.color}`}>
        <Icon className="h-3 w-3" />{cfg.label}
      </span>
    );
  };

  return (
    <Card className="border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          سجل الرسائل التفصيلي
          <Badge variant="secondary" className="text-[10px] mr-auto">{filteredMessages.length} رسالة</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="بحث برقم الهاتف، المحتوى، أو الجهة..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              className="pr-9 h-8 text-xs"
            />
          </div>
          <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(0); }}>
            <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue placeholder="الحالة" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الحالات</SelectItem>
              <SelectItem value="sent">مُرسلة</SelectItem>
              <SelectItem value="delivered">مُسلّمة</SelectItem>
              <SelectItem value="failed">فشلت</SelectItem>
              <SelectItem value="pending">قيد الانتظار</SelectItem>
            </SelectContent>
          </Select>
          <Select value={directionFilter} onValueChange={v => { setDirectionFilter(v); setPage(0); }}>
            <SelectTrigger className="w-[110px] h-8 text-xs"><SelectValue placeholder="الاتجاه" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="outbound">صادرة</SelectItem>
              <SelectItem value="inbound">واردة</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={v => { setTypeFilter(v); setPage(0); }}>
            <SelectTrigger className="w-[110px] h-8 text-xs"><SelectValue placeholder="النوع" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الأنواع</SelectItem>
              {msgTypes.map(t => (
                <SelectItem key={t} value={t}>{TYPE_LABELS[t] || t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <ScrollArea className="h-[500px] rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="text-xs">
                <TableHead className="w-[40px] text-right">#</TableHead>
                <TableHead className="text-right">الاتجاه</TableHead>
                <TableHead className="text-right">الرقم</TableHead>
                <TableHead className="text-right">الجهة</TableHead>
                <TableHead className="text-right">النوع</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">المحتوى</TableHead>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={9} className="text-center py-10 text-muted-foreground">جاري التحميل...</TableCell></TableRow>
              ) : pageMessages.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-10 text-muted-foreground">لا توجد رسائل مطابقة</TableCell></TableRow>
              ) : pageMessages.map((msg, i) => {
                const org = orgMap.get(msg.organization_id || '');
                return (
                  <TableRow key={msg.id} className="text-xs cursor-pointer hover:bg-muted/50" onClick={() => setSelectedMessage(msg)}>
                    <TableCell className="font-mono text-muted-foreground">{page * PAGE_SIZE + i + 1}</TableCell>
                    <TableCell>
                      {msg.direction === 'outbound' ? (
                        <span className="inline-flex items-center gap-1 text-blue-600"><ArrowUpRight className="h-3 w-3" />صادرة</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-green-600"><ArrowDownLeft className="h-3 w-3" />واردة</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono" dir="ltr">{msg.direction === 'outbound' ? msg.to_phone : msg.from_phone || '—'}</TableCell>
                    <TableCell className="max-w-[120px] truncate">{org?.name || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">{TYPE_LABELS[msg.message_type] || msg.message_type}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(msg.status)}</TableCell>
                    <TableCell className="max-w-[180px] truncate text-muted-foreground">{msg.content || '—'}</TableCell>
                    <TableCell className="text-[10px] text-muted-foreground whitespace-nowrap">{formatDate(msg.created_at)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><Eye className="h-3 w-3" /></Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">صفحة {page + 1} من {totalPages}</span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="h-7 px-2" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                <ChevronRight className="h-3 w-3" />السابق
              </Button>
              <Button variant="outline" size="sm" className="h-7 px-2" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                التالي<ChevronLeft className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Message Detail Dialog */}
      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <MessageCircle className="h-4 w-4 text-primary" />
              تفاصيل الرسالة
            </DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-3 text-sm">
              {/* Status & Direction */}
              <div className="flex items-center gap-2 flex-wrap">
                {getStatusBadge(selectedMessage.status)}
                <Badge variant={selectedMessage.direction === 'outbound' ? 'default' : 'secondary'} className="text-xs">
                  {selectedMessage.direction === 'outbound' ? '↑ صادرة' : '↓ واردة'}
                </Badge>
                <Badge variant="outline" className="text-xs">{TYPE_LABELS[selectedMessage.message_type] || selectedMessage.message_type}</Badge>
              </div>

              {/* Key Details Grid */}
              <div className="grid grid-cols-2 gap-2">
                <DetailItem icon={Phone} label="إلى" value={selectedMessage.to_phone} dir="ltr" />
                <DetailItem icon={Phone} label="من" value={selectedMessage.from_phone} dir="ltr" />
                <DetailItem icon={Building2} label="الجهة" value={orgMap.get(selectedMessage.organization_id || '')?.name || '—'} />
                <DetailItem icon={Calendar} label="التاريخ" value={formatDate(selectedMessage.created_at)} />
                <DetailItem icon={Hash} label="معرّف الرسالة" value={selectedMessage.id.slice(0, 12) + '...'} dir="ltr" />
                {selectedMessage.meta_message_id && (
                  <DetailItem icon={Hash} label="Meta ID" value={selectedMessage.meta_message_id.slice(0, 16) + '...'} dir="ltr" />
                )}
                {selectedMessage.sent_by && (
                  <DetailItem icon={Bot} label="أُرسلت بواسطة" value={selectedMessage.sent_by === 'system' ? 'النظام تلقائياً' : selectedMessage.sent_by.slice(0, 12) + '...'} />
                )}
                {selectedMessage.template_id && (
                  <DetailItem icon={FileText} label="القالب" value={selectedMessage.template_id.slice(0, 12) + '...'} dir="ltr" />
                )}
              </div>

              {/* Content */}
              {selectedMessage.content && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">المحتوى:</p>
                  <div className="bg-muted/50 rounded-lg p-3 text-xs leading-relaxed whitespace-pre-wrap border max-h-[200px] overflow-y-auto">
                    {selectedMessage.content}
                  </div>
                </div>
              )}

              {/* Error */}
              {selectedMessage.error_message && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-xs">
                  <div className="flex items-center gap-1.5 text-destructive font-medium mb-1">
                    <AlertTriangle className="h-3.5 w-3.5" />سبب الفشل:
                  </div>
                  <p className="text-destructive/80">{selectedMessage.error_message}</p>
                </div>
              )}

              {/* Attachment */}
              {selectedMessage.attachment_url && (
                <div className="flex items-center gap-2 text-xs bg-muted/40 rounded-lg p-2 border">
                  <Paperclip className="h-3.5 w-3.5 text-primary" />
                  <a href={selectedMessage.attachment_url} target="_blank" rel="noopener noreferrer" className="text-primary underline truncate">
                    {selectedMessage.attachment_url}
                  </a>
                </div>
              )}

              {/* Interactive Buttons */}
              {selectedMessage.interactive_buttons && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">أزرار تفاعلية:</p>
                  <pre className="bg-muted/50 rounded-lg p-2 text-[10px] overflow-x-auto border font-mono" dir="ltr">
                    {JSON.stringify(selectedMessage.interactive_buttons, null, 2)}
                  </pre>
                </div>
              )}

              {/* Metadata */}
              {selectedMessage.metadata && Object.keys(selectedMessage.metadata).length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">بيانات إضافية:</p>
                  <pre className="bg-muted/50 rounded-lg p-2 text-[10px] overflow-x-auto border font-mono" dir="ltr">
                    {JSON.stringify(selectedMessage.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {/* Broadcast group */}
              {selectedMessage.broadcast_group_id && (
                <DetailItem icon={Users} label="مجموعة البث" value={selectedMessage.broadcast_group_id.slice(0, 12) + '...'} dir="ltr" />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

const DetailItem = ({ icon: Icon, label, value, dir }: { icon: typeof Phone; label: string; value?: string | null; dir?: string }) => (
  <div className="bg-muted/30 rounded-lg p-2 border space-y-0.5">
    <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Icon className="h-3 w-3" />{label}</p>
    <p className={`text-xs font-medium truncate ${!value || value === '—' ? 'text-muted-foreground' : ''}`} dir={dir}>{value || '—'}</p>
  </div>
);

export default WaPilotMessageLog;
