import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Truck, Receipt, FileText, FileSignature, X, Loader2, ArrowUpFromLine, ArrowDownToLine } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type Direction = 'outgoing' | 'incoming';

interface ResourceItem {
  id: string;
  resourceType: 'shipment' | 'invoice' | 'document' | 'signing_request';
  label: string;
  subtitle: string;
  status?: string;
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
  shipment: 'text-emerald-600',
  invoice: 'text-blue-600',
  document: 'text-violet-600',
  signing_request: 'text-amber-600',
};

const ChatResourcePicker = ({ isOpen, onClose, onSelect, initialTab = 'outgoing' }: ChatResourcePickerProps) => {
  const { organization } = useAuth();
  const [direction, setDirection] = useState<Direction>(initialTab);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ResourceItem[]>([]);

  useEffect(() => {
    if (!isOpen || !organization?.id) return;
    setLoading(true);
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
      // Fetch shipments
      const shipmentQuery = supabase
        .from('shipments')
        .select('id, shipment_number, status, waste_type, generator_id, transporter_id, recycler_id')
        .order('created_at', { ascending: false })
        .limit(20);

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
          subtitle: s.waste_type || s.status || '',
          status: s.status,
          raw: s,
        });
      });

      // Fetch invoices
      const invoiceQuery = supabase
        .from('invoices')
        .select('id, invoice_number, status, total_amount, currency, organization_id, partner_organization_id')
        .order('created_at', { ascending: false })
        .limit(20);

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
          status: inv.status,
          raw: inv,
        });
      });

      // Fetch documents
      const docQuery = supabase
        .from('entity_documents')
        .select('id, title, file_name, document_type, document_category')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(20);

      const { data: docs } = await docQuery;
      docs?.forEach(d => {
        results.push({
          id: d.id,
          resourceType: 'document',
          label: d.title || d.file_name || 'مستند',
          subtitle: d.document_type || d.document_category || '',
          raw: d,
        });
      });

      // Fetch signing requests
      const signQuery = supabase
        .from('document_signatures')
        .select('id, signer_name, document_type, status')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(20);

      const { data: signs } = await signQuery;
      signs?.forEach(s => {
        results.push({
          id: s.id,
          resourceType: 'signing_request',
          label: s.signer_name || 'طلب توقيع',
          subtitle: s.document_type || '',
          status: s.status,
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

  const renderItem = (item: ResourceItem) => {
    const Icon = TYPE_ICONS[item.resourceType] || FileText;
    const color = TYPE_COLORS[item.resourceType] || 'text-muted-foreground';
    return (
      <div className="flex items-center gap-3">
        <Icon className={cn('w-4 h-4 shrink-0', color)} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">{item.label}</p>
          <p className="text-[10px] text-muted-foreground truncate">{item.subtitle}</p>
        </div>
        {item.status && (
          <Badge variant="outline" className="text-[9px] py-0 shrink-0">{item.status}</Badge>
        )}
      </div>
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
          style={{ maxHeight: '24rem' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
            <span className="text-xs font-semibold text-muted-foreground">📎 إرفاق مورد</span>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onClose}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Direction Tabs - 2 buttons */}
          <div className="flex border-b border-border">
            {DIRECTION_TABS.map(tab => {
              const Icon = tab.icon;
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
                  <Icon className="w-4 h-4" />
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
                placeholder="بحث..."
                className="h-8 text-xs pr-8"
                dir="rtl"
              />
            </div>
          </div>

          {/* Items */}
          <div className="max-h-52 overflow-y-auto scrollbar-thin">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-xs">لا توجد نتائج</div>
            ) : (
              <div className="p-1">
                <div className="px-3 py-1 text-[10px] text-muted-foreground">
                  {filteredItems.length} نتيجة — {direction === 'outgoing' ? 'صادر' : 'وارد'}
                </div>
                {filteredItems.map(item => (
                  <button
                    key={`${item.resourceType}-${item.id}`}
                    className="w-full px-3 py-2 rounded-lg hover:bg-muted transition-colors text-right"
                    onClick={() => handleSelect(item)}
                  >
                    {renderItem(item)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatResourcePicker;
