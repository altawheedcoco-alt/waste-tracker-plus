import { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Search, FileText, FileCheck, Receipt, Truck, Recycle, Factory,
  Download, Eye, Clock, Building2, ArrowUpDown,
  FolderOpen, Inbox, Send as SendIcon, FileArchive, Scale, Briefcase, Bell,
  Weight, Banknote, Image, Info, Tag,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ar as arLocale, enUS } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { getDocumentDescription, getDocumentCategory, CATEGORY_LABELS } from '@/lib/documentDescriptions';

// ─── Unified document interface ───
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
  aiSummary?: string;
  actionType?: string;
  dedupKey: string;
}

const DocumentArchive = () => {
  const { t, language } = useLanguage();
  const dateLocale = language === 'ar' ? arLocale : enUS;
  const { profile, organization } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState(tabFromUrl || 'all');
  const [sortDesc, setSortDesc] = useState(true);

  useEffect(() => { if (tabFromUrl) setActiveTab(tabFromUrl); }, [tabFromUrl]);

  const orgId = profile?.organization_id;

  // ─── Document type config (localized) ───
  const DOC_TYPES: Record<string, { label: string; icon: typeof FileText; color: string }> = useMemo(() => ({
    certificate: { label: t('archive.certificates'), icon: Recycle, color: 'text-emerald-600' },
    receipt: { label: t('archive.receipts'), icon: Receipt, color: 'text-blue-600' },
    shipment: { label: t('archive.shipmentDocs'), icon: Truck, color: 'text-amber-600' },
    disposal_certificate: { label: t('archive.disposalCerts'), icon: Factory, color: 'text-red-600' },
    contract: { label: t('archive.contracts'), icon: FileCheck, color: 'text-purple-600' },
    invoice: { label: t('archive.invoices'), icon: FileText, color: 'text-indigo-600' },
    declaration: { label: t('archive.declarations'), icon: FileText, color: 'text-orange-600' },
    award_letter: { label: t('archive.awardLetters'), icon: Briefcase, color: 'text-teal-600' },
    recycling_report: { label: t('archive.recyclingReports'), icon: Recycle, color: 'text-green-600' },
    weight_record: { label: t('archive.weightRecords'), icon: Weight, color: 'text-cyan-600' },
    weighbridge_photo: { label: t('archive.weighbridgePhotos'), icon: Image, color: 'text-sky-600' },
    deposit: { label: t('archive.deposits'), icon: Banknote, color: 'text-lime-600' },
    entity_document: { label: t('archive.entityDocuments'), icon: FileArchive, color: 'text-rose-600' },
    other: { label: t('archive.otherDocs'), icon: FileText, color: 'text-muted-foreground' },
  }), [t]);

  // ─── 1. Print log (issued docs) ───
  const { data: issuedDocs = [], isLoading: l1 } = useQuery({
    queryKey: ['doc-archive-issued', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase.from('document_print_log').select('*').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(500);
      if (error) throw error;
      return (data || []).map((d): ArchiveDoc => {
        const isAuto = d.action_type === 'auto_created';
        return {
          id: d.id, title: d.document_number || d.print_tracking_code || t('archive.issuedDoc'), type: d.document_type || 'other', date: d.created_at,
          source: isAuto ? 'auto' : 'issued',
          issuedBy: d.printed_by_name || t('archive.system'), trackingCode: d.print_tracking_code, referenceId: d.document_id,
          description: d.description || undefined, aiSummary: d.ai_summary || undefined, actionType: d.action_type || undefined,
          dedupKey: `print-${d.document_id || d.id}`,
        };
      });
    },
    enabled: !!orgId,
  });

  // ─── 2. Shared documents (received) ───
  const { data: receivedDocs = [], isLoading: l2 } = useQuery({
    queryKey: ['doc-archive-received', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase.from('shared_documents').select('*, sender_org:organizations!shared_documents_sender_organization_id_fkey(name)').eq('recipient_organization_id', orgId).order('created_at', { ascending: false }).limit(500);
      if (error) throw error;
      return (data || []).map((d: any): ArchiveDoc => ({
        id: d.id, title: d.document_title || t('archive.receivedDoc'), type: d.reference_type || d.document_type || 'other', date: d.created_at, source: 'received',
        status: d.status, senderName: d.sender_org?.name || t('archive.externalParty'), signed: !!d.signed_at, fileUrl: d.file_url, referenceId: d.reference_id, dedupKey: `shared-recv-${d.id}`,
      }));
    },
    enabled: !!orgId,
  });

  // ─── 3. Shared documents (sent) ───
  const { data: sentDocs = [], isLoading: l3 } = useQuery({
    queryKey: ['doc-archive-sent', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase.from('shared_documents').select('*, recipient_org:organizations!shared_documents_recipient_organization_id_fkey(name)').eq('sender_organization_id', orgId).order('created_at', { ascending: false }).limit(500);
      if (error) throw error;
      return (data || []).map((d: any): ArchiveDoc => ({
        id: d.id, title: d.document_title || t('archive.sentDoc'), type: d.reference_type || d.document_type || 'other', date: d.created_at, source: 'sent',
        status: d.status, recipientName: d.recipient_org?.name || t('archive.externalParty'), signed: !!d.signed_at, fileUrl: d.file_url, referenceId: d.reference_id, dedupKey: `shared-sent-${d.id}`,
      }));
    },
    enabled: !!orgId,
  });

  // ─── 4. Invoices ───
  const { data: invoiceDocs = [], isLoading: l4 } = useQuery({
    queryKey: ['doc-archive-invoices', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase.from('invoices').select('id, invoice_number, created_at, status, total_amount, organization_id, partner_organization_id')
        .or(`organization_id.eq.${orgId},partner_organization_id.eq.${orgId}`).order('created_at', { ascending: false }).limit(300);
      if (error) throw error;
      return (data || []).map((d: any): ArchiveDoc => ({
        id: d.id, title: `${t('archive.invoice')} ${d.invoice_number || ''}`.trim(), type: 'invoice', date: d.created_at,
        source: d.organization_id === orgId ? 'issued' : 'received', amount: d.total_amount, status: d.status, dedupKey: `invoice-${d.id}`,
      }));
    },
    enabled: !!orgId,
  });

  // ─── 5. Recycling Certificates ───
  const { data: certDocs = [], isLoading: l5 } = useQuery({
    queryKey: ['doc-archive-certs', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase.from('recycling_reports').select('id, report_number, created_at, pdf_url, shipment_id, shipment:shipments(shipment_number, generator_id, recycler_id, transporter_id)').order('created_at', { ascending: false }).limit(300);
      if (error) throw error;
      return (data || []).filter((d: any) => { const s = d.shipment; return s && (s.generator_id === orgId || s.recycler_id === orgId || s.transporter_id === orgId); })
        .map((d: any): ArchiveDoc => {
          const isIssuer = d.shipment?.recycler_id === orgId;
          return { id: d.id, title: `${t('archive.recyclingCert')} ${d.report_number || ''}`.trim(), type: 'certificate', date: d.created_at, source: isIssuer ? 'issued' : 'received', fileUrl: d.pdf_url, referenceId: d.shipment_id, dedupKey: `cert-${d.id}` };
        });
    },
    enabled: !!orgId,
  });

  // ─── 6. Award Letters ───
  const { data: awardDocs = [], isLoading: l6 } = useQuery({
    queryKey: ['doc-archive-awards', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase.from('award_letters').select('id, letter_number, title, created_at, attachment_url, status, organization_id, partner_organization_id')
        .or(`organization_id.eq.${orgId},partner_organization_id.eq.${orgId}`).order('created_at', { ascending: false }).limit(200);
      if (error) throw error;
      return (data || []).map((d: any): ArchiveDoc => ({
        id: d.id, title: `${t('archive.awardLetter')} ${d.letter_number || ''} - ${d.title || ''}`.trim(), type: 'award_letter', date: d.created_at,
        source: d.organization_id === orgId ? 'issued' : 'received', status: d.status, fileUrl: d.attachment_url, dedupKey: `award-${d.id}`,
      }));
    },
    enabled: !!orgId,
  });

  // ─── 7. Contracts ───
  const { data: contractDocs = [], isLoading: l7 } = useQuery({
    queryKey: ['doc-archive-contracts', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase.from('contracts').select('id, contract_number, title, created_at, attachment_url, status, organization_id, partner_organization_id')
        .or(`organization_id.eq.${orgId},partner_organization_id.eq.${orgId}`).order('created_at', { ascending: false }).limit(200);
      if (error) throw error;
      return (data || []).map((d: any): ArchiveDoc => ({
        id: d.id, title: `${t('archive.contract')} ${d.contract_number || ''} - ${d.title || ''}`.trim(), type: 'contract', date: d.created_at,
        source: d.organization_id === orgId ? 'issued' : 'received', status: d.status, fileUrl: d.attachment_url, dedupKey: `contract-${d.id}`,
      }));
    },
    enabled: !!orgId,
  });

  // ─── 8. Entity Documents ───
  const { data: entityDocs = [], isLoading: l8 } = useQuery({
    queryKey: ['doc-archive-entity', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase.from('entity_documents').select('id, title, document_type, document_category, file_url, file_name, created_at, uploaded_by_role').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(300);
      if (error) throw error;
      return (data || []).map((d: any): ArchiveDoc => ({
        id: d.id, title: d.title || d.file_name || t('archive.uploadedDoc'), type: d.document_type || 'entity_document', date: d.created_at, source: 'system', fileUrl: d.file_url, dedupKey: `entity-${d.id}`,
      }));
    },
    enabled: !!orgId,
  });

  // ─── 9. Deposits ───
  const { data: depositDocs = [], isLoading: l9 } = useQuery({
    queryKey: ['doc-archive-deposits', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase.from('deposits').select('id, reference_number, depositor_name, amount, currency, deposit_date, receipt_url, transfer_method, bank_name, created_at, partner_organization_id').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(300);
      if (error) throw error;
      return (data || []).map((d: any): ArchiveDoc => ({
        id: d.id, title: `${t('archive.deposit')} ${d.reference_number || ''} - ${d.depositor_name || ''}`.trim(), type: 'deposit', date: d.created_at, source: 'system', amount: d.amount, fileUrl: d.receipt_url, dedupKey: `deposit-${d.id}`,
      }));
    },
    enabled: !!orgId,
  });

  // ─── 10. External Weight Records ───
  const { data: weightDocs = [], isLoading: l10 } = useQuery({
    queryKey: ['doc-archive-weights', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase.from('external_weight_records').select('id, company_name, quantity, unit, waste_type, record_date, notes, created_at').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(300);
      if (error) throw error;
      return (data || []).map((d: any): ArchiveDoc => ({
        id: d.id, title: `${t('archive.weightRecord')} ${d.company_name || ''} - ${d.quantity} ${d.unit} ${d.waste_type || ''}`.trim(), type: 'weight_record', date: d.created_at, source: 'system', dedupKey: `weight-${d.id}`,
      }));
    },
    enabled: !!orgId,
  });

  // ─── 11. Weighbridge Photos ───
  const { data: weighbridgeDocs = [], isLoading: l11 } = useQuery({
    queryKey: ['doc-archive-weighbridge', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase.from('shipments').select('id, shipment_number, weighbridge_photo_url, created_at, generator_id, recycler_id, transporter_id')
        .or(`generator_id.eq.${orgId},recycler_id.eq.${orgId},transporter_id.eq.${orgId}`).not('weighbridge_photo_url', 'is', null).order('created_at', { ascending: false }).limit(300);
      if (error) throw error;
      const docs: ArchiveDoc[] = [];
      (data || []).forEach((d: any) => {
        if (d.weighbridge_photo_url) {
          docs.push({ id: `${d.id}-wb`, title: `${t('archive.pickupWeighbridge')} ${d.shipment_number || ''}`.trim(), type: 'weighbridge_photo', date: d.created_at, source: 'system', fileUrl: d.weighbridge_photo_url, referenceId: d.id, dedupKey: `wb-${d.id}` });
        }
      });
      return docs;
    },
    enabled: !!orgId,
  });

  const isLoading = l1 || l2 || l3 || l4 || l5 || l6 || l7 || l8 || l9 || l10 || l11;

  // ─── Combine + Deduplicate ───
  const allDocs = useMemo(() => {
    const combined: ArchiveDoc[] = [...issuedDocs, ...receivedDocs, ...sentDocs, ...invoiceDocs, ...certDocs, ...awardDocs, ...contractDocs, ...entityDocs, ...depositDocs, ...weightDocs, ...weighbridgeDocs];
    const seen = new Map<string, ArchiveDoc>();
    const sourcePriority: Record<string, number> = { issued: 5, auto: 4, system: 3, received: 2, sent: 1 };
    for (const doc of combined) {
      const existing = seen.get(doc.dedupKey);
      if (!existing || (sourcePriority[doc.source] || 0) > (sourcePriority[existing.source] || 0)) seen.set(doc.dedupKey, doc);
    }
    const deduped = Array.from(seen.values());
    deduped.sort((a, b) => { const dA = new Date(a.date).getTime(); const dB = new Date(b.date).getTime(); return sortDesc ? dB - dA : dA - dB; });
    return deduped;
  }, [issuedDocs, receivedDocs, sentDocs, invoiceDocs, certDocs, awardDocs, contractDocs, entityDocs, depositDocs, weightDocs, weighbridgeDocs, sortDesc]);

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
      docs = docs.filter(d => d.title?.toLowerCase().includes(s) || d.trackingCode?.toLowerCase().includes(s) || d.senderName?.toLowerCase().includes(s) || d.recipientName?.toLowerCase().includes(s) || d.issuedBy?.toLowerCase().includes(s));
    }
    return docs;
  }, [allDocs, activeTab, search]);

  const statsByType = useMemo(() => { const counts: Record<string, number> = {}; allDocs.forEach(d => { counts[d.type] = (counts[d.type] || 0) + 1; }); return counts; }, [allDocs]);
  const sourceStats = useMemo(() => ({ issued: allDocs.filter(d => d.source === 'issued').length, received: allDocs.filter(d => d.source === 'received').length, sent: allDocs.filter(d => d.source === 'sent').length, system: allDocs.filter(d => d.source === 'system').length, auto: allDocs.filter(d => d.source === 'auto').length }), [allDocs]);

  // ─── Realtime ───
  useEffect(() => {
    if (!orgId) return;
    const channel = supabase.channel('archive-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'shared_documents', filter: `recipient_organization_id=eq.${orgId}` }, () => {
        toast.info(`📄 ${t('archive.newDocReceived')}`);
        queryClient.invalidateQueries({ queryKey: ['doc-archive-received', orgId] });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'document_print_log', filter: `organization_id=eq.${orgId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['doc-archive-issued', orgId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [orgId, queryClient, t]);

  const getDocIcon = (type: string) => { const config = DOC_TYPES[type] || DOC_TYPES.other; const Icon = config.icon; return <Icon className={`w-4 h-4 ${config.color}`} />; };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'issued': return <Badge variant="outline" className="text-[10px] gap-1"><FolderOpen className="w-3 h-3" /> {t('archive.issued')}</Badge>;
      case 'received': return <Badge variant="secondary" className="text-[10px] gap-1"><Inbox className="w-3 h-3" /> {t('archive.received')}</Badge>;
      case 'sent': return <Badge className="text-[10px] gap-1 bg-primary/10 text-primary"><SendIcon className="w-3 h-3" /> {t('archive.sent')}</Badge>;
      case 'auto': return <Badge variant="outline" className="text-[10px] gap-1 border-primary/40 text-primary"><Bell className="w-3 h-3" /> {language === 'ar' ? 'تلقائي' : 'Auto'}</Badge>;
      case 'system': return <Badge variant="outline" className="text-[10px] gap-1 border-muted-foreground/30"><FileArchive className="w-3 h-3" /> {t('archive.system')}</Badge>;
      default: return null;
    }
  };

  const handleView = (doc: ArchiveDoc) => {
    if (doc.fileUrl) { window.open(doc.fileUrl, '_blank'); return; }
    
    // Navigate to the document's source page based on type
    const docId = doc.referenceId;
    switch (doc.type) {
      case 'shipment':
        if (docId) navigate(`/dashboard/shipments/${docId}`);
        else navigate('/dashboard/shipments');
        break;
      case 'invoice':
        if (docId) navigate(`/dashboard/invoices?view=${docId}`);
        else navigate('/dashboard/invoices');
        break;
      case 'contract':
        if (docId) navigate(`/dashboard/contracts?view=${docId}`);
        else navigate('/dashboard/contracts');
        break;
      case 'certificate':
        if (docId) navigate(`/dashboard/shipments/${docId}?tab=certificate`);
        else navigate('/dashboard/shipments');
        break;
      case 'award_letter':
        navigate('/dashboard/award-letters');
        break;
      case 'deposit':
        navigate('/dashboard/accounting');
        break;
      case 'statement':
        navigate('/dashboard/accounting?tab=statements');
        break;
      case 'disposal':
        if (docId) navigate(`/dashboard/shipments/${docId}`);
        else navigate('/dashboard/disposal');
        break;
      case 'receipt':
        if (docId) navigate(`/dashboard/shipments/${docId}`);
        else navigate('/dashboard/shipments');
        break;
      case 'report':
        navigate('/dashboard/reports');
        break;
      case 'entity_certificate':
      case 'entity_document':
        navigate('/dashboard/entity-profile');
        break;
      default:
        if (docId) navigate(`/dashboard/verify?code=${docId}`);
        else toast.info(t('archive.noPreviewAvailable'));
    }
  };

  const handleDownload = (doc: ArchiveDoc) => {
    if (doc.fileUrl) { const a = document.createElement('a'); a.href = doc.fileUrl; a.download = doc.title || 'document'; a.target = '_blank'; a.click(); }
    else toast.info(t('archive.noFileAvailable'));
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <BackButton />
          <div>
            <h1 className="text-xl font-bold">{t('archive.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('archive.subtitle')}</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
          {[
            { key: 'all', label: t('archive.total'), count: allDocs.length, icon: FileText, bg: 'bg-primary/10', iconColor: 'text-primary' },
            { key: 'auto', label: language === 'ar' ? 'تلقائي' : 'Auto', count: sourceStats.auto, icon: Bell, bg: 'bg-accent', iconColor: 'text-accent-foreground' },
            { key: 'issued', label: t('archive.issued'), count: sourceStats.issued, icon: FolderOpen, bg: 'bg-primary/5', iconColor: 'text-primary' },
            { key: 'received', label: t('archive.received'), count: sourceStats.received, icon: Inbox, bg: 'bg-secondary', iconColor: 'text-secondary-foreground' },
            { key: 'sent', label: t('archive.sent'), count: sourceStats.sent, icon: SendIcon, bg: 'bg-muted', iconColor: 'text-muted-foreground' },
            { key: 'system', label: t('archive.system'), count: sourceStats.system, icon: FileArchive, bg: 'bg-muted', iconColor: 'text-muted-foreground' },
          ].map(stat => (
            <Card key={stat.key} className={`p-2.5 cursor-pointer hover:shadow-md transition-shadow ${activeTab === stat.key ? 'ring-2 ring-primary' : ''}`} onClick={() => setActiveTab(stat.key)}>
              <div className="flex items-center gap-2 justify-end">
                <div className="text-right">
                  <p className="text-lg font-bold">{stat.count}</p>
                  <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                </div>
                <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setSortDesc(!sortDesc)} className="gap-1">
            <ArrowUpDown className="w-3 h-3" />
            {sortDesc ? t('archive.newest') : t('archive.oldest')}
          </Button>
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder={t('archive.searchPlaceholder')} value={search} onChange={e => setSearch(e.target.value)} className="pr-9" />
          </div>
        </div>

        {/* Type filter tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <ScrollArea className="w-full">
            <TabsList className="h-auto flex-wrap gap-1 bg-transparent p-0 justify-end">
              <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs px-3 py-1.5">{t('archive.all')} ({allDocs.length})</TabsTrigger>
              <TabsTrigger value="auto" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs px-3 py-1.5">{language === 'ar' ? 'تلقائي' : 'Auto'} ({sourceStats.auto})</TabsTrigger>
              <TabsTrigger value="issued" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs px-3 py-1.5">{t('archive.issued')} ({sourceStats.issued})</TabsTrigger>
              <TabsTrigger value="received" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground text-xs px-3 py-1.5">{t('archive.received')} ({sourceStats.received})</TabsTrigger>
              <TabsTrigger value="sent" className="data-[state=active]:bg-muted data-[state=active]:text-muted-foreground text-xs px-3 py-1.5">{t('archive.sent')} ({sourceStats.sent})</TabsTrigger>
              {Object.entries(statsByType).filter(([, count]) => count > 0).map(([type, count]) => {
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
                <p className="text-muted-foreground">{t('archive.noMatchingDocs')}</p>
              </Card>
            ) : (
              <div className="space-y-1.5">
                {filteredDocs.map(doc => {
                  const docDesc = getDocumentDescription(doc.type, language === 'ar' ? 'ar' : 'en');
                  const docCat = getDocumentCategory(doc.type);
                  const catLabel = CATEGORY_LABELS[docCat]?.[language === 'ar' ? 'ar' : 'en'] || docCat;
                  
                  return (
                    <Card key={doc.dedupKey} className="p-3 hover:shadow-sm transition-shadow cursor-pointer" onClick={() => handleView(doc)}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleView(doc)}>
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{language === 'ar' ? 'عرض / الذهاب للمستند' : 'View / Go to document'}</TooltipContent>
                          </Tooltip>
                          {doc.fileUrl && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleDownload(doc)}>
                                  <Download className="w-3.5 h-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{language === 'ar' ? 'تحميل' : 'Download'}</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                        <div className="flex-1 text-right min-w-0">
                          <div className="flex items-center gap-2 justify-end flex-wrap">
                            {getSourceBadge(doc.source)}
                            {doc.signed && <Badge className="text-[10px] bg-emerald-500/10 text-emerald-600">{t('archive.signed')}</Badge>}
                            {doc.status === 'pending' && <Badge variant="outline" className="text-[10px] text-amber-600">{t('archive.pendingReview')}</Badge>}
                            {doc.amount && <Badge variant="secondary" className="text-[10px]">{doc.amount} ج.م</Badge>}
                            <Badge variant="outline" className="text-[9px] gap-0.5">
                              <Tag className="w-2.5 h-2.5" />
                              {catLabel}
                            </Badge>
                            <span className="font-medium text-sm truncate">{doc.title}</span>
                            {getDocIcon(doc.type)}
                          </div>
                          {/* Document description */}
                          <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1 text-right">
                            {doc.description || docDesc}
                          </p>
                          {doc.aiSummary && (
                            <p className="text-[10px] text-muted-foreground/70 mt-0.5 line-clamp-2 text-right italic">
                              <Info className="w-2.5 h-2.5 inline ml-0.5" />
                              {doc.aiSummary}
                            </p>
                          )}
                          <div className="flex items-center gap-2 justify-end mt-1 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDistanceToNow(new Date(doc.date), { locale: dateLocale, addSuffix: true })}
                            </span>
                            <span>•</span>
                            <span>{format(new Date(doc.date), 'dd/MM/yyyy', { locale: dateLocale })}</span>
                            {doc.source === 'received' && doc.senderName && (<><span>•</span><span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {t('archive.from')}: {doc.senderName}</span></>)}
                            {doc.source === 'sent' && doc.recipientName && (<><span>•</span><span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {t('archive.to')}: {doc.recipientName}</span></>)}
                            {doc.issuedBy && doc.source === 'issued' && (<><span>•</span><span>{t('archive.by')}: {doc.issuedBy}</span></>)}
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
      </div>
    </DashboardLayout>
  );
};

export default DocumentArchive;
