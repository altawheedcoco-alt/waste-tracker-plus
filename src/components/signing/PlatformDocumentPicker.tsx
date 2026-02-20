import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Truck, FileText, ScrollText, Award, Shield, Search, Loader2, CheckCircle2
} from 'lucide-react';

export interface PlatformDocument {
  id: string;
  title: string;
  type: 'shipment' | 'invoice' | 'contract' | 'award_letter' | 'certificate';
  date: string;
  status?: string;
  fileUrl?: string | null;
  relatedShipmentId?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (doc: PlatformDocument) => void;
}

export default function PlatformDocumentPicker({ open, onOpenChange, onSelect }: Props) {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('shipment');

  const { data: shipments, isLoading: loadingShipments } = useQuery({
    queryKey: ['picker-shipments', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase
        .from('shipments')
        .select('id, shipment_number, waste_type, status, created_at')
        .or(`generator_id.eq.${orgId},transporter_id.eq.${orgId},recycler_id.eq.${orgId}`)
        .order('created_at', { ascending: false })
        .limit(50);
      return (data || []).map((d: any) => ({
        id: d.id,
        title: `شحنة ${d.shipment_number || ''} - ${d.waste_type || ''}`.trim(),
        type: 'shipment' as const,
        date: d.created_at,
        status: d.status,
        relatedShipmentId: d.id,
      }));
    },
    enabled: open && !!orgId,
  });

  const { data: invoices, isLoading: loadingInvoices } = useQuery({
    queryKey: ['picker-invoices', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase
        .from('invoices')
        .select('id, invoice_number, total_amount, status, created_at')
        .or(`organization_id.eq.${orgId},partner_organization_id.eq.${orgId}`)
        .order('created_at', { ascending: false })
        .limit(50);
      return (data || []).map((d: any) => ({
        id: d.id,
        title: `فاتورة ${d.invoice_number || ''} - ${d.total_amount ? d.total_amount + ' ج.م' : ''}`.trim(),
        type: 'invoice' as const,
        date: d.created_at,
        status: d.status,
      }));
    },
    enabled: open && !!orgId,
  });

  const { data: contracts, isLoading: loadingContracts } = useQuery({
    queryKey: ['picker-contracts', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase
        .from('contracts')
        .select('id, contract_number, title, status, attachment_url, created_at')
        .or(`organization_id.eq.${orgId},partner_organization_id.eq.${orgId}`)
        .order('created_at', { ascending: false })
        .limit(50);
      return (data || []).map((d: any) => ({
        id: d.id,
        title: `عقد ${d.contract_number || ''} - ${d.title || ''}`.trim(),
        type: 'contract' as const,
        date: d.created_at,
        status: d.status,
        fileUrl: d.attachment_url,
      }));
    },
    enabled: open && !!orgId,
  });

  const { data: awardLetters, isLoading: loadingAwards } = useQuery({
    queryKey: ['picker-awards', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase
        .from('award_letters')
        .select('id, letter_number, title, status, attachment_url, created_at')
        .or(`organization_id.eq.${orgId},partner_organization_id.eq.${orgId}`)
        .order('created_at', { ascending: false })
        .limit(50);
      return (data || []).map((d: any) => ({
        id: d.id,
        title: `خطاب ترسية ${d.letter_number || ''} - ${d.title || ''}`.trim(),
        type: 'award_letter' as const,
        date: d.created_at,
        status: d.status,
        fileUrl: d.attachment_url,
      }));
    },
    enabled: open && !!orgId,
  });

  const { data: entityDocs, isLoading: loadingEntity } = useQuery({
    queryKey: ['picker-entity-docs', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase
        .from('entity_documents')
        .select('id, document_name, document_type, file_url, created_at')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(50);
      return (data || []).map((d: any) => ({
        id: d.id,
        title: `${d.document_name || d.document_type || 'مستند'}`.trim(),
        type: 'certificate' as const,
        date: d.created_at,
        fileUrl: d.file_url,
      }));
    },
    enabled: open && !!orgId,
  });

  const tabConfig = [
    { key: 'shipment', label: 'الشحنات', icon: Truck, data: shipments, loading: loadingShipments },
    { key: 'invoice', label: 'الفواتير', icon: FileText, data: invoices, loading: loadingInvoices },
    { key: 'contract', label: 'العقود', icon: ScrollText, data: contracts, loading: loadingContracts },
    { key: 'award_letter', label: 'خطابات الترسية', icon: Award, data: awardLetters, loading: loadingAwards },
    { key: 'certificate', label: 'الشهادات', icon: Shield, data: entityDocs, loading: loadingEntity },
  ];

  const currentTab = tabConfig.find(t => t.key === tab);
  const filtered = (currentTab?.data || []).filter(d =>
    !search || d.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" /> اختيار مستند من المنصة
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="بحث..."
            className="pr-9 text-right"
          />
        </div>

        <Tabs value={tab} onValueChange={setTab} dir="rtl">
          <TabsList className="w-full grid grid-cols-5 text-xs">
            {tabConfig.map(t => (
              <TabsTrigger key={t.key} value={t.key} className="gap-1 text-xs px-1">
                <t.icon className="w-3 h-3" />
                <span className="hidden sm:inline">{t.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {tabConfig.map(t => (
            <TabsContent key={t.key} value={t.key} className="mt-2">
              {t.loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  لا توجد مستندات
                </div>
              ) : (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {filtered.map(doc => (
                      <button
                        key={doc.id}
                        onClick={() => {
                          onSelect(doc as PlatformDocument);
                          onOpenChange(false);
                          setSearch('');
                        }}
                        className="w-full text-right p-3 rounded-lg border hover:bg-muted/50 transition-colors flex items-center gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{doc.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(doc.date).toLocaleDateString('ar-EG')}
                          </p>
                        </div>
                        {'status' in doc && doc.status && (
                          <Badge variant="secondary" className="text-xs flex-shrink-0">
                            {doc.status}
                          </Badge>
                        )}
                        {'fileUrl' in doc && doc.fileUrl && (
                          <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
