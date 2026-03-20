import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Truck, Receipt, FileText, FileSignature, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type ResourceType = 'shipments' | 'invoices' | 'documents' | 'signing';

interface PickedResource {
  type: string;
  data: any;
}

interface ChatResourcePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (resource: PickedResource) => void;
  initialTab?: ResourceType;
}

const TABS: { key: ResourceType; label: string; icon: any }[] = [
  { key: 'shipments', label: 'شحنات', icon: Truck },
  { key: 'invoices', label: 'فواتير', icon: Receipt },
  { key: 'documents', label: 'مستندات', icon: FileText },
  { key: 'signing', label: 'توقيعات', icon: FileSignature },
];

const ChatResourcePicker = ({ isOpen, onClose, onSelect, initialTab = 'shipments' }: ChatResourcePickerProps) => {
  const { organization } = useAuth();
  const [activeTab, setActiveTab] = useState<ResourceType>(initialTab);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (!isOpen || !organization?.id) return;
    setLoading(true);
    fetchItems(activeTab).then(data => {
      setItems(data);
      setLoading(false);
    });
  }, [isOpen, activeTab, organization?.id]);

  const fetchItems = async (tab: ResourceType) => {
    if (!organization?.id) return [];
    try {
      switch (tab) {
        case 'shipments': {
          const { data } = await supabase
            .from('shipments')
            .select('id, shipment_number, status, waste_type, origin_city, destination_city, weight')
            .or(`generator_id.eq.${organization.id},transporter_id.eq.${organization.id},recycler_id.eq.${organization.id}`)
            .order('created_at', { ascending: false })
            .limit(30);
          return data || [];
        }
        case 'invoices': {
          const { data } = await supabase
            .from('invoices')
            .select('id, invoice_number, status, total_amount, currency, due_date')
            .eq('organization_id', organization.id)
            .order('created_at', { ascending: false })
            .limit(30);
          return data || [];
        }
        case 'documents': {
          const { data } = await supabase
            .from('entity_documents')
            .select('id, document_name, document_type, file_url, status')
            .eq('organization_id', organization.id)
            .order('created_at', { ascending: false })
            .limit(30);
          return data || [];
        }
        case 'signing': {
          const { data } = await supabase
            .from('document_signatures')
            .select('id, signer_name, document_type, status, shipment_id')
            .eq('organization_id', organization.id)
            .order('created_at', { ascending: false })
            .limit(30);
          return data || [];
        }
        default:
          return [];
      }
    } catch {
      return [];
    }
  };

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(item => JSON.stringify(item).toLowerCase().includes(q));
  }, [items, search]);

  const handleSelect = (item: any) => {
    const typeMap: Record<ResourceType, string> = {
      shipments: 'shipment',
      invoices: 'invoice',
      documents: 'document',
      signing: 'signing_request',
    };
    onSelect({ type: typeMap[activeTab], data: item });
    onClose();
  };

  const renderItem = (item: any) => {
    switch (activeTab) {
      case 'shipments':
        return (
          <div className="flex items-center gap-3">
            <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">شحنة #{item.shipment_number || item.id.slice(0, 8)}</p>
              <p className="text-[10px] text-muted-foreground">{item.waste_type || item.status}</p>
            </div>
            <Badge variant="outline" className="text-[9px] py-0 shrink-0">{item.status}</Badge>
          </div>
        );
      case 'invoices':
        return (
          <div className="flex items-center gap-3">
            <Receipt className="w-4 h-4 text-blue-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">#{item.invoice_number || item.id.slice(0, 8)}</p>
              <p className="text-[10px] text-muted-foreground">{item.total_amount?.toLocaleString()} {item.currency || 'EGP'}</p>
            </div>
            <Badge variant="outline" className="text-[9px] py-0 shrink-0">{item.status}</Badge>
          </div>
        );
      case 'documents':
        return (
          <div className="flex items-center gap-3">
            <FileText className="w-4 h-4 text-violet-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{item.document_name || 'مستند'}</p>
              <p className="text-[10px] text-muted-foreground">{item.document_type}</p>
            </div>
          </div>
        );
      case 'signing':
        return (
          <div className="flex items-center gap-3">
            <FileSignature className="w-4 h-4 text-amber-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{item.signer_name || 'طلب توقيع'}</p>
              <p className="text-[10px] text-muted-foreground">{item.document_type}</p>
            </div>
            <Badge variant="outline" className="text-[9px] py-0 shrink-0">{item.status}</Badge>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          className="absolute bottom-full mb-1 right-0 left-0 z-50 bg-popover border border-border rounded-xl shadow-lg overflow-hidden"
          style={{ maxHeight: '22rem' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
            <span className="text-xs font-semibold text-muted-foreground">📎 إرفاق مورد</span>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onClose}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors border-b-2',
                    activeTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
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
          <div className="max-h-48 overflow-y-auto scrollbar-thin">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-xs">لا توجد نتائج</div>
            ) : (
              <div className="p-1">
                <div className="px-3 py-1 text-[10px] text-muted-foreground">{filteredItems.length} نتيجة</div>
                {filteredItems.map(item => (
                  <button
                    key={item.id}
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
