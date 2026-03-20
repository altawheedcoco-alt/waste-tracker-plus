import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Truck, Receipt, FileText, FileSignature, X, Loader2, 
  ArrowUpFromLine, ArrowDownToLine, Eye, Send, Calendar, 
  MapPin, Weight, Building2, FileCheck, Download, Pen,
  CheckCircle, Clock, AlertCircle
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

type Direction = 'outgoing' | 'incoming';

interface ResourceItem {
  id: string;
  resourceType: 'shipment' | 'invoice' | 'document' | 'signing_request';
  label: string;
  subtitle: string;
  status?: string;
  date?: string;
  extra?: Record<string, string | number | null>;
  raw: any;
}

interface PickedResource {
  type: string;
  data: any;
}

interface ChatResourcePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (resource: PickedResource) => void;
  initialTab?: Direction;
}

const DIRECTION_TABS: { key: Direction; label: string; icon: any }[] = [
  { key: 'outgoing', label: 'صادر', icon: ArrowUpFromLine },
  { key: 'incoming', label: 'وارد', icon: ArrowDownToLine },
];

const TYPE_ICONS: Record<string, any> = {
  shipment: Truck,
  invoice: Receipt,
  document: FileText,
  signing_request: FileSignature,
};

const TYPE_COLORS: Record<string, string> = {
  shipment: 'text-emerald-600 bg-emerald-500/10',
  invoice: 'text-blue-600 bg-blue-500/10',
  document: 'text-violet-600 bg-violet-500/10',
  signing_request: 'text-amber-600 bg-amber-500/10',
};

const TYPE_LABELS: Record<string, string> = {
  shipment: 'شحنة',
  invoice: 'فاتورة',
  document: 'مستند',
  signing_request: 'توقيع',
};

const STATUS_MAP: Record<string, { label: string; icon: any; color: string }> = {
  pending: { label: 'قيد الانتظار', icon: Clock, color: 'text-amber-600 bg-amber-500/10 border-amber-500/20' },
  in_transit: { label: 'قيد النقل', icon: Truck, color: 'text-blue-600 bg-blue-500/10 border-blue-500/20' },
  delivered: { label: 'تم التسليم', icon: CheckCircle, color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' },
  completed: { label: 'مكتملة', icon: CheckCircle, color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' },
  paid: { label: 'مدفوعة', icon: CheckCircle, color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' },
  overdue: { label: 'متأخرة', icon: AlertCircle, color: 'text-red-600 bg-red-500/10 border-red-500/20' },
  draft: { label: 'مسودة', icon: FileText, color: 'text-muted-foreground bg-muted border-border' },
  signed: { label: 'تم التوقيع', icon: FileCheck, color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' },
  requested: { label: 'بانتظار التوقيع', icon: Pen, color: 'text-amber-600 bg-amber-500/10 border-amber-500/20' },
  approved: { label: 'معتمدة', icon: CheckCircle, color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' },
  cancelled: { label: 'ملغاة', icon: X, color: 'text-red-600 bg-red-500/10 border-red-500/20' },
};

const DOC_TYPE_LABELS: Record<string, string> = {
  award_letter: 'خطاب ترسية',
  contract: 'عقد',
  correspondence: 'مراسلة',
  invoice: 'فاتورة',
  receipt: 'سند قبض',
  deposit_proof: 'إثبات إيداع',
  weight_slip: 'صورة وزنة',
  certificate: 'شهادة',
  license: 'رخصة',
  registration: 'سجل تجاري',
  other: 'أخرى',
};

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return null;
  try {
    return format(new Date(dateStr), 'dd MMM yyyy', { locale: ar });
  } catch {
    return null;
  }
};

const ChatResourcePicker = ({ isOpen, onClose, onSelect, initialTab = 'outgoing' }: ChatResourcePickerProps) => {
  const { organization } = useAuth();
  const navigate = useNavigate();
  const [direction, setDirection] = useState<Direction>(initialTab);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ResourceItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ResourceItem | null>(null);

  useEffect(() => {
    if (!isOpen || !organization?.id) return;
    setLoading(true);
    setSelectedItem(null);
    fetchAllByDirection(direction).then(data => {
      setItems(data);
      setLoading(false);
    });
  }, [isOpen, direction, organization?.id]);

  const fetchAllByDirection = async (dir: Direction): Promise<ResourceItem[]> => {
    if (!organization?.id) return [];
    const orgId = organization.id;
    const results: ResourceItem[] = [];

    try {
      // Fetch shipments with more fields
      const shipmentQuery = supabase
        .from('shipments')
        .select('id, shipment_number, status, waste_type, waste_description, generator_id, transporter_id, recycler_id, pickup_city, delivery_city, quantity, unit, created_at, pickup_date')
        .order('created_at', { ascending: false })
        .limit(30);

      if (dir === 'outgoing') {
        shipmentQuery.eq('generator_id', orgId);
      } else {
        shipmentQuery.or(`transporter_id.eq.${orgId},recycler_id.eq.${orgId}`);
      }

      const { data: shipments } = await shipmentQuery;
      shipments?.forEach(s => {
        results.push({
          id: s.id,
          resourceType: 'shipment',
          label: `شحنة #${s.shipment_number || s.id.slice(0, 8)}`,
          subtitle: s.waste_type || s.waste_description || '',
          status: s.status || undefined,
          date: s.pickup_date || s.created_at,
          extra: {
            origin: s.pickup_city,
            destination: s.delivery_city,
            weight: s.quantity,
            unit: s.unit,
          },
          raw: s,
        });
      });

      // Fetch invoices with more fields
      const invoiceQuery = supabase
        .from('invoices')
        .select('id, invoice_number, status, total_amount, currency, organization_id, partner_organization_id, due_date, created_at, invoice_type')
        .order('created_at', { ascending: false })
        .limit(30);

      if (dir === 'outgoing') {
        invoiceQuery.eq('organization_id', orgId);
      } else {
        invoiceQuery.eq('partner_organization_id', orgId);
      }

      const { data: invoices } = await invoiceQuery;
      invoices?.forEach(inv => {
        results.push({
          id: inv.id,
          resourceType: 'invoice',
          label: `فاتورة #${inv.invoice_number || inv.id.slice(0, 8)}`,
          subtitle: `${inv.total_amount?.toLocaleString() || '0'} ${inv.currency || 'EGP'}`,
          status: inv.status || undefined,
          date: inv.due_date || inv.created_at,
          extra: {
            type: inv.invoice_type,
            amount: inv.total_amount,
            dueDate: inv.due_date,
          },
          raw: inv,
        });
      });

      // Fetch documents with more fields
      const docQuery = supabase
        .from('entity_documents')
        .select('id, title, file_name, document_type, document_category, file_url, file_type, file_size, description, created_at, reference_number, document_date')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(30);

      const { data: docs } = await docQuery;
      docs?.forEach(d => {
        results.push({
          id: d.id,
          resourceType: 'document',
          label: d.title || d.file_name || 'مستند',
          subtitle: DOC_TYPE_LABELS[d.document_type] || d.document_type || d.document_category || '',
          date: d.document_date || d.created_at,
          extra: {
            fileUrl: d.file_url,
            fileType: d.file_type,
            fileSize: d.file_size,
            description: d.description,
            refNumber: d.reference_number,
            category: d.document_category,
          },
          raw: d,
        });
      });

      // Fetch signing requests with more fields
      const signQuery = supabase
        .from('document_signatures')
        .select('id, signer_name, document_type, status, created_at, timestamp_signed')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(30);

      const { data: signs } = await signQuery;
      signs?.forEach(s => {
        results.push({
          id: s.id,
          resourceType: 'signing_request',
          label: s.signer_name || 'طلب توقيع',
          subtitle: s.document_type || '',
          status: s.status || undefined,
          date: s.timestamp_signed || s.created_at,
          raw: s,
        });
      });
    } catch {
      // silent
    }

    return results;
  };

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(item =>
      item.label.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      (item.status || '').toLowerCase().includes(q)
    );
  }, [items, search]);

  const handleSelect = (item: ResourceItem) => {
    onSelect({ type: item.resourceType, data: item.raw });
    onClose();
  };

  const handlePreview = useCallback((item: ResourceItem) => {
    switch (item.resourceType) {
      case 'shipment':
        navigate(`/dashboard/shipments/${item.id}`);
        break;
      case 'invoice':
        navigate(`/dashboard/invoices`);
        break;
      case 'document':
        if (item.extra?.fileUrl) {
          window.open(item.extra.fileUrl as string, '_blank');
        }
        break;
      case 'signing_request':
        navigate(`/dashboard/signing-inbox`);
        break;
    }
    onClose();
  }, [navigate, onClose]);

  const formatFileSize = (bytes?: number | string | null) => {
    const num = typeof bytes === 'string' ? parseInt(bytes) : bytes;
    if (!num) return null;
    if (num < 1024) return `${num} B`;
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
    return `${(num / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderItemDetail = (item: ResourceItem) => {
    const Icon = TYPE_ICONS[item.resourceType] || FileText;
    const colorClass = TYPE_COLORS[item.resourceType] || 'text-muted-foreground bg-muted';
    const statusInfo = STATUS_MAP[item.status || ''];
    const dateStr = formatDate(item.date);

    return (
      <div className="space-y-3 p-3" dir="rtl">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', colorClass)}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground">{item.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{item.subtitle}</p>
          </div>
        </div>

        {/* Status + Type badges */}
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className="text-[10px]">
            {TYPE_LABELS[item.resourceType]}
          </Badge>
          {statusInfo && (
            <Badge variant="outline" className={cn('text-[10px]', statusInfo.color)}>
              {statusInfo.label}
            </Badge>
          )}
          {!statusInfo && item.status && (
            <Badge variant="outline" className="text-[10px]">{item.status}</Badge>
          )}
        </div>

        {/* Details grid */}
        <div className="space-y-1.5 text-xs">
          {dateStr && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-3 h-3 shrink-0" />
              <span>{dateStr}</span>
            </div>
          )}

          {/* Shipment-specific */}
          {item.resourceType === 'shipment' && (
            <>
              {(item.extra?.origin || item.extra?.destination) && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span>{item.extra.origin || '—'} ← {item.extra.destination || '—'}</span>
                </div>
              )}
              {item.extra?.weight && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Weight className="w-3 h-3 shrink-0" />
                  <span>{Number(item.extra.weight).toLocaleString()} {item.extra.unit || 'كجم'}</span>
                </div>
              )}
            </>
          )}

          {/* Invoice-specific */}
          {item.resourceType === 'invoice' && (
            <>
              {item.extra?.dueDate && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-3 h-3 shrink-0" />
                  <span>استحقاق: {formatDate(item.extra.dueDate as string)}</span>
                </div>
              )}
              {item.extra?.type && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Receipt className="w-3 h-3 shrink-0" />
                  <span>النوع: {item.extra.type}</span>
                </div>
              )}
            </>
          )}

          {/* Document-specific */}
          {item.resourceType === 'document' && (
            <>
              {item.extra?.refNumber && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileCheck className="w-3 h-3 shrink-0" />
                  <span>مرجع: {item.extra.refNumber}</span>
                </div>
              )}
              {item.extra?.description && (
                <p className="text-muted-foreground text-[11px] bg-muted/50 rounded-lg p-2 mt-1">
                  {String(item.extra.description).slice(0, 120)}
                  {String(item.extra.description).length > 120 ? '...' : ''}
                </p>
              )}
              {item.extra?.fileSize && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="w-3 h-3 shrink-0" />
                  <span>{formatFileSize(item.extra.fileSize)}</span>
                </div>
              )}
            </>
          )}
        </div>

        <Separator />

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-8 text-xs gap-1.5"
            onClick={() => handlePreview(item)}
          >
            <Eye className="w-3.5 h-3.5" />
            معاينة
          </Button>
          <Button
            size="sm"
            className="flex-1 h-8 text-xs gap-1.5"
            onClick={() => handleSelect(item)}
          >
            <Send className="w-3.5 h-3.5" />
            إرسال في الدردشة
          </Button>
        </div>

        {/* Extra action for documents */}
        {item.resourceType === 'document' && item.extra?.fileUrl && (
          <Button
            size="sm"
            variant="ghost"
            className="w-full h-7 text-[11px] gap-1.5 text-muted-foreground"
            asChild
          >
            <a href={item.extra.fileUrl as string} download target="_blank" rel="noopener">
              <Download className="w-3 h-3" />
              تحميل الملف
            </a>
          </Button>
        )}
      </div>
    );
  };

  const renderListItem = (item: ResourceItem) => {
    const Icon = TYPE_ICONS[item.resourceType] || FileText;
    const colorClass = TYPE_COLORS[item.resourceType] || 'text-muted-foreground bg-muted';
    const statusInfo = STATUS_MAP[item.status || ''];
    const dateStr = formatDate(item.date);
    const isSelected = selectedItem?.id === item.id;

    return (
      <button
        key={`${item.resourceType}-${item.id}`}
        className={cn(
          'w-full px-3 py-2.5 rounded-lg transition-colors text-right',
          isSelected ? 'bg-primary/10 ring-1 ring-primary/30' : 'hover:bg-muted'
        )}
        onClick={() => setSelectedItem(isSelected ? null : item)}
      >
        <div className="flex items-center gap-3">
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', colorClass)}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold truncate flex-1">{item.label}</p>
              {statusInfo && (
                <Badge variant="outline" className={cn('text-[9px] py-0 shrink-0', statusInfo.color)}>
                  {statusInfo.label}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-[10px] text-muted-foreground truncate flex-1">{item.subtitle}</p>
              {dateStr && (
                <span className="text-[9px] text-muted-foreground shrink-0">{dateStr}</span>
              )}
            </div>
            {/* Quick info line */}
            {item.resourceType === 'shipment' && item.extra?.origin && (
              <p className="text-[9px] text-muted-foreground/70 mt-0.5 truncate">
                📍 {item.extra.origin} ← {item.extra.destination || '—'}
                {item.extra.weight ? ` • ${Number(item.extra.weight).toLocaleString()} ${item.extra.unit || 'كجم'}` : ''}
              </p>
            )}
            {item.resourceType === 'document' && item.extra?.refNumber && (
              <p className="text-[9px] text-muted-foreground/70 mt-0.5 truncate">
                📋 مرجع: {item.extra.refNumber}
              </p>
            )}
          </div>
        </div>
      </button>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          className="absolute bottom-full mb-1 right-0 left-0 z-50 bg-popover border border-border rounded-xl shadow-lg overflow-hidden"
          style={{ maxHeight: '32rem' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              {selectedItem && (
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setSelectedItem(null)}>
                  <ArrowDownToLine className="w-3.5 h-3.5 rotate-90" />
                </Button>
              )}
              <span className="text-xs font-semibold text-muted-foreground">
                {selectedItem ? `📄 ${selectedItem.label}` : '📎 إرفاق مورد'}
              </span>
            </div>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onClose}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>

          {selectedItem ? (
            /* Detail View */
            <div className="max-h-80 overflow-y-auto scrollbar-thin">
              {renderItemDetail(selectedItem)}
            </div>
          ) : (
            <>
              {/* Direction Tabs */}
              <div className="flex border-b border-border">
                {DIRECTION_TABS.map(tab => {
                  const TabIcon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setDirection(tab.key)}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-colors border-b-2',
                        direction === tab.key
                          ? 'border-primary text-primary bg-primary/5'
                          : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      )}
                    >
                      <TabIcon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Search */}
              <div className="p-2 border-b border-border/50">
                <div className="relative">
                  <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="بحث في الشحنات والفواتير والمستندات..."
                    className="h-8 text-xs pr-8"
                    dir="rtl"
                  />
                </div>
              </div>

              {/* Items List */}
              <div className="max-h-64 overflow-y-auto scrollbar-thin">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-xs">لا توجد نتائج</div>
                ) : (
                  <div className="p-1">
                    <div className="px-3 py-1 text-[10px] text-muted-foreground">
                      {filteredItems.length} نتيجة — {direction === 'outgoing' ? 'صادر' : 'وارد'} • اضغط لعرض التفاصيل
                    </div>
                    {filteredItems.map(item => renderListItem(item))}
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatResourcePicker;
