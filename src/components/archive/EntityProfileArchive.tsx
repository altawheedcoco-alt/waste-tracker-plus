import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  FileText, FileCheck, Receipt, Truck, Recycle, Factory,
  Download, Eye, Clock, Building2, ArrowUpDown, Printer,
  FolderOpen, Inbox, Send as SendIcon, FileArchive, Scale, Briefcase, Bell,
  Weight, Banknote, Image, Info, Tag, ExternalLink, Search, Upload,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ar as arLocale } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import EntityDocumentUpload from './EntityDocumentUpload';
import { getDocumentDescription, getDocumentCategory, CATEGORY_LABELS } from '@/lib/documentDescriptions';

interface ArchiveDoc {
  id: string;
  title: string;
  type: string;
  date: string;
  source: 'issued' | 'received' | 'sent' | 'system' | 'auto';
  fileUrl?: string;
  referenceId?: string;
  trackingCode?: string;
  issuedBy?: string;
  senderName?: string;
  recipientName?: string;
  status?: string;
  signed?: boolean;
  amount?: number;
  description?: string;
  dedupKey: string;
}

interface EntityProfileArchiveProps {
  partnerId?: string;
  externalPartnerId?: string;
  partnerName: string;
}

const DOC_TYPES: Record<string, { label: string; icon: typeof FileText; color: string }> = {
  certificate: { label: 'شهادات إعادة التدوير', icon: Recycle, color: 'text-emerald-600' },
  receipt: { label: 'إيصالات', icon: Receipt, color: 'text-blue-600' },
  shipment: { label: 'مستندات الشحنات', icon: Truck, color: 'text-amber-600' },
  disposal_certificate: { label: 'شهادات التخلص', icon: Factory, color: 'text-red-600' },
  contract: { label: 'العقود', icon: FileCheck, color: 'text-purple-600' },
  invoice: { label: 'الفواتير', icon: FileText, color: 'text-indigo-600' },
  declaration: { label: 'الإقرارات', icon: FileText, color: 'text-orange-600' },
  award_letter: { label: 'خطابات الترسية', icon: Briefcase, color: 'text-teal-600' },
  recycling_report: { label: 'تقارير إعادة التدوير', icon: Recycle, color: 'text-green-600' },
  weight_record: { label: 'سجلات الأوزان', icon: Weight, color: 'text-cyan-600' },
  weighbridge_photo: { label: 'صور الميزان', icon: Image, color: 'text-sky-600' },
  deposit: { label: 'الإيداعات', icon: Banknote, color: 'text-lime-600' },
  entity_document: { label: 'مستندات مرفوعة', icon: FileArchive, color: 'text-rose-600' },
  other: { label: 'أخرى', icon: FileText, color: 'text-muted-foreground' },
};

export default function EntityProfileArchive({
  partnerId,
  externalPartnerId,
  partnerName,
}: EntityProfileArchiveProps) {
  const { profile, organization } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [sortDesc, setSortDesc] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  const orgId = profile?.organization_id;
  const targetId = partnerId; // partner organization id

  // ─── 1. Shared documents (received from this partner) ───
  const { data: receivedDocs = [], isLoading: l1 } = useQuery({
    queryKey: ['entity-archive-received', orgId, targetId],
    queryFn: async () => {
      if (!orgId || !targetId) return [];
      const { data, error } = await supabase.from('shared_documents')
        .select('*, sender_org:organizations!shared_documents_sender_organization_id_fkey(name)')
        .eq('recipient_organization_id', orgId)
        .eq('sender_organization_id', targetId)
        .order('created_at', { ascending: false }).limit(300);
      if (error) throw error;
      return (data || []).map((d: any): ArchiveDoc => ({
        id: d.id, title: d.document_title || 'مستند مستلم', type: d.reference_type || 'other', date: d.created_at, source: 'received',
        status: d.status, senderName: d.sender_org?.name, signed: !!d.signed_at, fileUrl: d.file_url, referenceId: d.reference_id, dedupKey: `shared-recv-${d.id}`,
      }));
    },
    enabled: !!orgId && !!targetId,
  });

  // ─── 2. Shared documents (sent to this partner) ───
  const { data: sentDocs = [], isLoading: l2 } = useQuery({
    queryKey: ['entity-archive-sent', orgId, targetId],
    queryFn: async () => {
      if (!orgId || !targetId) return [];
      const { data, error } = await supabase.from('shared_documents')
        .select('*, recipient_org:organizations!shared_documents_recipient_organization_id_fkey(name)')
        .eq('sender_organization_id', orgId)
        .eq('recipient_organization_id', targetId)
        .order('created_at', { ascending: false }).limit(300);
      if (error) throw error;
      return (data || []).map((d: any): ArchiveDoc => ({
        id: d.id, title: d.document_title || 'مستند مرسل', type: d.reference_type || 'other', date: d.created_at, source: 'sent',
        status: d.status, recipientName: d.recipient_org?.name, signed: !!d.signed_at, fileUrl: d.file_url, referenceId: d.reference_id, dedupKey: `shared-sent-${d.id}`,
      }));
    },
    enabled: !!orgId && !!targetId,
  });

  // ─── 3. Invoices with this partner ───
  const { data: invoiceDocs = [], isLoading: l3 } = useQuery({
    queryKey: ['entity-archive-invoices', orgId, targetId],
    queryFn: async () => {
      if (!orgId || !targetId) return [];
      const { data, error } = await supabase.from('invoices')
        .select('id, invoice_number, created_at, status, total_amount, organization_id, partner_organization_id')
        .or(`and(organization_id.eq.${orgId},partner_organization_id.eq.${targetId}),and(organization_id.eq.${targetId},partner_organization_id.eq.${orgId})`)
        .order('created_at', { ascending: false }).limit(300);
      if (error) throw error;
      return (data || []).map((d: any): ArchiveDoc => ({
        id: d.id, title: `فاتورة ${d.invoice_number || ''}`.trim(), type: 'invoice', date: d.created_at,
        source: d.organization_id === orgId ? 'issued' : 'received', amount: d.total_amount, status: d.status, dedupKey: `invoice-${d.id}`,
      }));
    },
    enabled: !!orgId && !!targetId,
  });

  // ─── 4. Contracts with this partner ───
  const { data: contractDocs = [], isLoading: l4 } = useQuery({
    queryKey: ['entity-archive-contracts', orgId, targetId],
    queryFn: async () => {
      if (!orgId || !targetId) return [];
      const { data, error } = await supabase.from('contracts')
        .select('id, contract_number, title, created_at, attachment_url, status, organization_id, partner_organization_id')
        .or(`and(organization_id.eq.${orgId},partner_organization_id.eq.${targetId}),and(organization_id.eq.${targetId},partner_organization_id.eq.${orgId})`)
        .order('created_at', { ascending: false }).limit(200);
      if (error) throw error;
      return (data || []).map((d: any): ArchiveDoc => ({
        id: d.id, title: `عقد ${d.contract_number || ''} - ${d.title || ''}`.trim(), type: 'contract', date: d.created_at,
        source: d.organization_id === orgId ? 'issued' : 'received', status: d.status, fileUrl: d.attachment_url, dedupKey: `contract-${d.id}`,
      }));
    },
    enabled: !!orgId && !!targetId,
  });

  // ─── 5. Award Letters with this partner ───
  const { data: awardDocs = [], isLoading: l5 } = useQuery({
    queryKey: ['entity-archive-awards', orgId, targetId],
    queryFn: async () => {
      if (!orgId || !targetId) return [];
      const { data, error } = await supabase.from('award_letters')
        .select('id, letter_number, title, created_at, attachment_url, status, organization_id, partner_organization_id')
        .or(`and(organization_id.eq.${orgId},partner_organization_id.eq.${targetId}),and(organization_id.eq.${targetId},partner_organization_id.eq.${orgId})`)
        .order('created_at', { ascending: false }).limit(200);
      if (error) throw error;
      return (data || []).map((d: any): ArchiveDoc => ({
        id: d.id, title: `ترسية ${d.letter_number || ''} - ${d.title || ''}`.trim(), type: 'award_letter', date: d.created_at,
        source: d.organization_id === orgId ? 'issued' : 'received', status: d.status, fileUrl: d.attachment_url, dedupKey: `award-${d.id}`,
      }));
    },
    enabled: !!orgId && !!targetId,
  });

  // ─── 6. Deposits with this partner ───
  const { data: depositDocs = [], isLoading: l6 } = useQuery({
    queryKey: ['entity-archive-deposits', orgId, targetId],
    queryFn: async () => {
      if (!orgId || !targetId) return [];
      const { data, error } = await supabase.from('deposits')
        .select('id, reference_number, depositor_name, amount, deposit_date, receipt_url, created_at')
        .eq('organization_id', orgId)
        .eq('partner_organization_id', targetId)
        .order('created_at', { ascending: false }).limit(300);
      if (error) throw error;
      return (data || []).map((d: any): ArchiveDoc => ({
        id: d.id, title: `إيداع ${d.reference_number || ''} - ${d.depositor_name || ''}`.trim(), type: 'deposit', date: d.created_at,
        source: 'system', amount: d.amount, fileUrl: d.receipt_url, dedupKey: `deposit-${d.id}`,
      }));
    },
    enabled: !!orgId && !!targetId,
  });

  // ─── 7. Shipments between us and this partner ───
  const { data: shipmentDocs = [], isLoading: l7 } = useQuery({
    queryKey: ['entity-archive-shipments', orgId, targetId],
    queryFn: async () => {
      if (!orgId || !targetId) return [];
      const { data, error } = await supabase.from('shipments')
        .select('id, shipment_number, created_at, status, generator_id, transporter_id, recycler_id, weighbridge_photo_url')
        .or(`generator_id.eq.${targetId},transporter_id.eq.${targetId},recycler_id.eq.${targetId}`)
        .or(`generator_id.eq.${orgId},transporter_id.eq.${orgId},recycler_id.eq.${orgId}`)
        .order('created_at', { ascending: false }).limit(300);
      if (error) throw error;
      // Filter to only shipments that involve BOTH orgId and targetId
      return (data || []).filter((d: any) => {
        const parties = [d.generator_id, d.transporter_id, d.recycler_id];
        return parties.includes(orgId) && parties.includes(targetId);
      }).map((d: any): ArchiveDoc => ({
        id: d.id, title: `شحنة ${d.shipment_number || ''}`.trim(), type: 'shipment', date: d.created_at,
        source: 'system', status: d.status, referenceId: d.id, fileUrl: d.weighbridge_photo_url || undefined, dedupKey: `shipment-${d.id}`,
      }));
    },
    enabled: !!orgId && !!targetId,
  });

  // ─── 8. Recycling Certificates for shared shipments ───
  const { data: certDocs = [], isLoading: l8 } = useQuery({
    queryKey: ['entity-archive-certs', orgId, targetId],
    queryFn: async () => {
      if (!orgId || !targetId) return [];
      const { data, error } = await supabase.from('recycling_reports')
        .select('id, report_number, created_at, pdf_url, shipment_id, shipment:shipments(shipment_number, generator_id, recycler_id, transporter_id)')
        .order('created_at', { ascending: false }).limit(300);
      if (error) throw error;
      return (data || []).filter((d: any) => {
        const s = d.shipment;
        if (!s) return false;
        const parties = [s.generator_id, s.recycler_id, s.transporter_id];
        return parties.includes(orgId) && parties.includes(targetId);
      }).map((d: any): ArchiveDoc => ({
        id: d.id, title: `شهادة إعادة تدوير ${d.report_number || ''}`.trim(), type: 'certificate', date: d.created_at,
        source: d.shipment?.recycler_id === orgId ? 'issued' : 'received', fileUrl: d.pdf_url, referenceId: d.shipment_id, dedupKey: `cert-${d.id}`,
      }));
    },
    enabled: !!orgId && !!targetId,
  });

  // ─── 9. Entity Documents (uploaded files) ───
  const { data: entityDocs = [], isLoading: l9 } = useQuery({
    queryKey: ['entity-archive-entity', orgId, partnerId, externalPartnerId],
    queryFn: async () => {
      if (!orgId) return [];
      let query = supabase.from('entity_documents')
        .select('id, title, document_type, document_category, file_url, file_name, created_at')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false }).limit(300);
      if (partnerId) query = query.eq('partner_organization_id', partnerId);
      if (externalPartnerId) query = query.eq('external_partner_id', externalPartnerId);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((d: any): ArchiveDoc => ({
        id: d.id, title: d.title || d.file_name || 'مستند مرفوع', type: d.document_type || 'entity_document', date: d.created_at,
        source: 'system', fileUrl: d.file_url, dedupKey: `entity-${d.id}`,
      }));
    },
    enabled: !!orgId,
  });

  // ─── 10. Print log (documents printed/auto-created for this partner) ───
  const { data: issuedDocs = [], isLoading: l10 } = useQuery({
    queryKey: ['entity-archive-issued', orgId, targetId],
    queryFn: async () => {
      if (!orgId || !targetId) return [];
      const { data, error } = await supabase.from('document_print_log')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false }).limit(500);
      if (error) throw error;
      // Filter by partner in related docs
      return (data || []).filter((d: any) => d.partner_organization_id === targetId).map((d: any): ArchiveDoc => ({
        id: d.id, title: d.document_number || d.print_tracking_code || 'مستند صادر', type: d.document_type || 'other', date: d.created_at,
        source: d.action_type === 'auto_created' ? 'auto' : 'issued',
        issuedBy: d.printed_by_name, trackingCode: d.print_tracking_code, referenceId: d.document_id,
        fileUrl: d.file_url || undefined, description: d.description, dedupKey: `print-${d.document_id || d.id}`,
      }));
    },
    enabled: !!orgId && !!targetId,
  });

  const isLoading = l1 || l2 || l3 || l4 || l5 || l6 || l7 || l8 || l9 || l10;

  // ─── Combine + Deduplicate ───
  const allDocs = useMemo(() => {
    const combined = [...issuedDocs, ...receivedDocs, ...sentDocs, ...invoiceDocs, ...contractDocs, ...awardDocs, ...depositDocs, ...shipmentDocs, ...certDocs, ...entityDocs];
    const seen = new Map<string, ArchiveDoc>();
    const sourcePriority: Record<string, number> = { issued: 5, auto: 4, system: 3, received: 2, sent: 1 };
    for (const doc of combined) {
      const existing = seen.get(doc.dedupKey);
      if (!existing || (sourcePriority[doc.source] || 0) > (sourcePriority[existing.source] || 0)) seen.set(doc.dedupKey, doc);
    }
    const deduped = Array.from(seen.values());
    deduped.sort((a, b) => sortDesc ? new Date(b.date).getTime() - new Date(a.date).getTime() : new Date(a.date).getTime() - new Date(b.date).getTime());
    return deduped;
  }, [issuedDocs, receivedDocs, sentDocs, invoiceDocs, contractDocs, awardDocs, depositDocs, shipmentDocs, certDocs, entityDocs, sortDesc]);

  // ─── Filter ───
  const filteredDocs = useMemo(() => {
    let docs = allDocs;
    if (activeTab === 'issued') docs = docs.filter(d => d.source === 'issued');
    else if (activeTab === 'received') docs = docs.filter(d => d.source === 'received');
    else if (activeTab === 'sent') docs = docs.filter(d => d.source === 'sent');
    else if (activeTab === 'system') docs = docs.filter(d => d.source === 'system');
    else if (activeTab === 'auto') docs = docs.filter(d => d.source === 'auto');
    else if (activeTab !== 'all') docs = docs.filter(d => d.type === activeTab);
    if (search.trim()) {
      const s = search.toLowerCase();
      docs = docs.filter(d => d.title?.toLowerCase().includes(s) || d.trackingCode?.toLowerCase().includes(s) || d.senderName?.toLowerCase().includes(s) || d.recipientName?.toLowerCase().includes(s));
    }
    return docs;
  }, [allDocs, activeTab, search]);

  const statsByType = useMemo(() => { const c: Record<string, number> = {}; allDocs.forEach(d => { c[d.type] = (c[d.type] || 0) + 1; }); return c; }, [allDocs]);
  const sourceStats = useMemo(() => ({
    issued: allDocs.filter(d => d.source === 'issued').length,
    received: allDocs.filter(d => d.source === 'received').length,
    sent: allDocs.filter(d => d.source === 'sent').length,
    system: allDocs.filter(d => d.source === 'system').length,
    auto: allDocs.filter(d => d.source === 'auto').length,
  }), [allDocs]);

  const getDocIcon = (type: string) => { const config = DOC_TYPES[type] || DOC_TYPES.other; const Icon = config.icon; return <Icon className={`w-4 h-4 ${config.color}`} />; };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'issued': return <Badge variant="outline" className="text-[10px] gap-1"><FolderOpen className="w-3 h-3" /> صادر</Badge>;
      case 'received': return <Badge variant="secondary" className="text-[10px] gap-1"><Inbox className="w-3 h-3" /> مستلم</Badge>;
      case 'sent': return <Badge className="text-[10px] gap-1 bg-primary/10 text-primary"><SendIcon className="w-3 h-3" /> مرسل</Badge>;
      case 'auto': return <Badge variant="outline" className="text-[10px] gap-1 border-primary/40 text-primary"><Bell className="w-3 h-3" /> تلقائي</Badge>;
      case 'system': return <Badge variant="outline" className="text-[10px] gap-1 border-muted-foreground/30"><FileArchive className="w-3 h-3" /> نظام</Badge>;
      default: return null;
    }
  };

  const handleView = (doc: ArchiveDoc) => {
    if (doc.fileUrl) {
      window.open(doc.fileUrl, '_blank');
    } else {
      toast.info('لا يوجد ملف متاح للمعاينة');
    }
  };

  const handleDownload = (doc: ArchiveDoc) => {
    if (doc.fileUrl) {
      const a = document.createElement('a');
      a.href = doc.fileUrl;
      a.download = doc.title || 'document';
      a.target = '_blank';
      a.click();
      toast.success('جاري التحميل...');
    } else {
      toast.info('لا يوجد ملف متاح للتحميل');
    }
  };

  const handlePrint = (doc: ArchiveDoc) => {
    if (doc.fileUrl) {
      const pw = window.open(doc.fileUrl, '_blank');
      if (pw) pw.addEventListener('load', () => pw.print());
    } else {
      toast.info('لا يوجد ملف متاح للطباعة');
    }
  };

  const handleNavigateToDetails = (doc: ArchiveDoc) => {
    const docId = doc.referenceId || doc.id;
    switch (doc.type) {
      case 'shipment': navigate(`/dashboard/shipments/${docId}`); break;
      case 'invoice': navigate(`/dashboard/invoices?view=${docId}`); break;
      case 'contract': navigate(`/dashboard/contracts?view=${docId}`); break;
      case 'certificate': navigate(`/dashboard/shipments/${docId}?tab=certificate`); break;
      case 'award_letter': navigate('/dashboard/award-letters'); break;
      case 'deposit': navigate('/dashboard/accounting'); break;
      default: toast.info('لا توجد صفحة تفاصيل لهذا المستند');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            أرشيف مستندات {partnerName}
          </CardTitle>
          <Button onClick={() => setShowUpload(true)} className="gap-2">
            <Upload className="h-4 w-4" />
            رفع مستند
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {[
            { key: 'all', label: 'الكل', count: allDocs.length, icon: FileText, bg: 'bg-primary/10', iconColor: 'text-primary' },
            { key: 'auto', label: 'تلقائي', count: sourceStats.auto, icon: Bell, bg: 'bg-accent', iconColor: 'text-accent-foreground' },
            { key: 'issued', label: 'صادر', count: sourceStats.issued, icon: FolderOpen, bg: 'bg-primary/5', iconColor: 'text-primary' },
            { key: 'received', label: 'مستلم', count: sourceStats.received, icon: Inbox, bg: 'bg-secondary', iconColor: 'text-secondary-foreground' },
            { key: 'sent', label: 'مرسل', count: sourceStats.sent, icon: SendIcon, bg: 'bg-muted', iconColor: 'text-muted-foreground' },
            { key: 'system', label: 'نظام', count: sourceStats.system, icon: FileArchive, bg: 'bg-muted', iconColor: 'text-muted-foreground' },
          ].map(stat => (
            <Card key={stat.key} className={`p-2 cursor-pointer hover:shadow-md transition-shadow ${activeTab === stat.key ? 'ring-2 ring-primary' : ''}`} onClick={() => setActiveTab(stat.key)}>
              <div className="flex items-center gap-2 justify-end">
                <div className="text-right">
                  <p className="text-lg font-bold">{stat.count}</p>
                  <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                </div>
                <div className={`w-7 h-7 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-3.5 h-3.5 ${stat.iconColor}`} />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Search + Sort */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setSortDesc(!sortDesc)} className="gap-1">
            <ArrowUpDown className="w-3 h-3" />
            {sortDesc ? 'الأحدث' : 'الأقدم'}
          </Button>
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="ابحث في الأرشيف..." value={search} onChange={e => setSearch(e.target.value)} className="pr-9" />
          </div>
        </div>

        {/* Type Filter Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <ScrollArea className="w-full">
            <TabsList className="h-auto flex-wrap gap-1 bg-transparent p-0 justify-end">
              <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs px-3 py-1.5">الكل ({allDocs.length})</TabsTrigger>
              {Object.entries(statsByType).filter(([, c]) => c > 0).map(([type, count]) => {
                const config = DOC_TYPES[type] || DOC_TYPES.other;
                return <TabsTrigger key={type} value={type} className="text-xs px-3 py-1.5 gap-1">{config.label} ({count})</TabsTrigger>;
              })}
            </TabsList>
          </ScrollArea>

          <TabsContent value={activeTab} className="mt-3">
            {isLoading ? (
              <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}</div>
            ) : filteredDocs.length === 0 ? (
              <Card className="p-8 text-center">
                <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-50" />
                <p className="text-muted-foreground">لا توجد مستندات مطابقة</p>
              </Card>
            ) : (
              <div className="space-y-1.5">
                {filteredDocs.map(doc => {
                  const docDesc = getDocumentDescription(doc.type, 'ar');
                  const docCat = getDocumentCategory(doc.type);
                  const catLabel = CATEGORY_LABELS[docCat]?.ar || docCat;

                  return (
                    <Card key={doc.dedupKey} className="p-3 hover:shadow-sm transition-shadow">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-0.5 shrink-0">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleView(doc)}>
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>عرض الملف</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handlePrint(doc)}>
                                <Printer className="w-3.5 h-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>طباعة</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleDownload(doc)}>
                                <Download className="w-3.5 h-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>تحميل</TooltipContent>
                          </Tooltip>
                          {doc.fileUrl && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => window.open(doc.fileUrl, '_blank')}>
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>فتح الملف</TooltipContent>
                            </Tooltip>
                          )}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" variant="outline" className="h-7 px-2 gap-1 text-xs text-primary" onClick={() => handleNavigateToDetails(doc)}>
                                <Info className="w-3.5 h-3.5" />
                                التفاصيل
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>عرض تفاصيل المستند</TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="flex-1 text-right min-w-0">
                          <div className="flex items-center gap-2 justify-end flex-wrap">
                            {doc.fileUrl ? (
                              <Badge className="text-[10px] bg-primary/10 text-primary gap-0.5"><FileText className="w-2.5 h-2.5" />ملف</Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] text-muted-foreground gap-0.5">بدون ملف</Badge>
                            )}
                            {getSourceBadge(doc.source)}
                            {doc.signed && <Badge className="text-[10px] bg-emerald-500/10 text-emerald-600">موقع</Badge>}
                            {doc.amount && <Badge variant="secondary" className="text-[10px]">{doc.amount} ر.س</Badge>}
                            <Badge variant="outline" className="text-[9px] gap-0.5"><Tag className="w-2.5 h-2.5" />{catLabel}</Badge>
                            <span className="font-medium text-sm truncate">{doc.title}</span>
                            {getDocIcon(doc.type)}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1 text-right">
                            {doc.description || docDesc}
                          </p>
                          <div className="flex items-center gap-2 justify-end mt-1 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDistanceToNow(new Date(doc.date), { locale: arLocale, addSuffix: true })}
                            </span>
                            <span>•</span>
                            <span>{format(new Date(doc.date), 'dd/MM/yyyy', { locale: arLocale })}</span>
                            {doc.senderName && (<><span>•</span><span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> من: {doc.senderName}</span></>)}
                            {doc.recipientName && (<><span>•</span><span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> إلى: {doc.recipientName}</span></>)}
                            {doc.trackingCode && (<><span>•</span><span className="font-mono text-[10px]">{doc.trackingCode}</span></>)}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Upload Dialog */}
      <EntityDocumentUpload
        open={showUpload}
        onOpenChange={setShowUpload}
        partnerId={partnerId}
        externalPartnerId={externalPartnerId}
        partnerName={partnerName}
      />
    </Card>
  );
}
