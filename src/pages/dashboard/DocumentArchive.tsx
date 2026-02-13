import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search, FileText, FileCheck, Receipt, Truck, Recycle, Factory,
  Calendar, Download, Eye, Share2, Clock, Building2, ArrowUpDown,
  Filter, FolderOpen, Inbox, Send as SendIcon,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

// Document type config
const DOC_TYPES: Record<string, { label: string; icon: typeof FileText; color: string }> = {
  certificate: { label: 'شهادات التدوير', icon: Recycle, color: 'text-emerald-600' },
  receipt: { label: 'إيصالات الاستلام', icon: Receipt, color: 'text-blue-600' },
  shipment: { label: 'مستندات الشحنات', icon: Truck, color: 'text-amber-600' },
  disposal_certificate: { label: 'شهادات التخلص', icon: Factory, color: 'text-red-600' },
  contract: { label: 'العقود', icon: FileCheck, color: 'text-purple-600' },
  invoice: { label: 'الفواتير', icon: FileText, color: 'text-indigo-600' },
  declaration: { label: 'الإقرارات', icon: FileText, color: 'text-orange-600' },
  other: { label: 'مستندات أخرى', icon: FileText, color: 'text-muted-foreground' },
};

const DocumentArchive = () => {
  const { profile, organization } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState(tabFromUrl || 'all');
  const [sortDesc, setSortDesc] = useState(true);

  // Sync tab from URL
  useEffect(() => {
    if (tabFromUrl) setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  const orgId = profile?.organization_id;

  // Fetch documents issued BY this organization (from print log)
  const { data: issuedDocs = [], isLoading: loadingIssued } = useQuery({
    queryKey: ['doc-archive-issued', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('document_print_log')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data || []).map(d => ({
        id: d.id,
        title: d.document_number || d.print_tracking_code,
        type: d.document_type,
        date: d.created_at,
        source: 'issued' as const,
        actionType: d.action_type,
        documentId: d.document_id,
        issuedBy: d.printed_by_name || 'النظام',
        trackingCode: d.print_tracking_code,
      }));
    },
    enabled: !!orgId,
  });

  // Fetch documents RECEIVED from other orgs (shared_documents where we are recipient)
  const { data: receivedDocs = [], isLoading: loadingReceived } = useQuery({
    queryKey: ['doc-archive-received', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('shared_documents')
        .select('*, sender_org:organizations!shared_documents_sender_organization_id_fkey(name)')
        .eq('recipient_organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data || []).map((d: any) => ({
        id: d.id,
        title: d.document_title,
        type: d.reference_type || d.document_type || 'other',
        date: d.created_at,
        source: 'received' as const,
        status: d.status,
        senderName: d.sender_org?.name || 'جهة خارجية',
        signed: !!d.signed_at,
        fileUrl: d.file_url,
        referenceId: d.reference_id,
      }));
    },
    enabled: !!orgId,
  });

  // Fetch documents SENT to other orgs
  const { data: sentDocs = [], isLoading: loadingSent } = useQuery({
    queryKey: ['doc-archive-sent', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('shared_documents')
        .select('*, recipient_org:organizations!shared_documents_recipient_organization_id_fkey(name)')
        .eq('sender_organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data || []).map((d: any) => ({
        id: d.id,
        title: d.document_title,
        type: d.reference_type || d.document_type || 'other',
        date: d.created_at,
        source: 'sent' as const,
        status: d.status,
        recipientName: d.recipient_org?.name || 'جهة خارجية',
        signed: !!d.signed_at,
        fileUrl: d.file_url,
        referenceId: d.reference_id,
      }));
    },
    enabled: !!orgId,
  });

  const isLoading = loadingIssued || loadingReceived || loadingSent;

  // Combine all docs
  const allDocs = useMemo(() => {
    const combined = [...issuedDocs, ...receivedDocs, ...sentDocs];
    // Sort
    combined.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortDesc ? dateB - dateA : dateA - dateB;
    });
    return combined;
  }, [issuedDocs, receivedDocs, sentDocs, sortDesc]);

  // Filter by tab and search
  const filteredDocs = useMemo(() => {
    let docs = allDocs;

    // Tab filter
    if (activeTab === 'issued') docs = docs.filter(d => d.source === 'issued');
    else if (activeTab === 'received') docs = docs.filter(d => d.source === 'received');
    else if (activeTab === 'sent') docs = docs.filter(d => d.source === 'sent');
    else if (activeTab !== 'all') docs = docs.filter(d => d.type === activeTab);

    // Search
    if (search.trim()) {
      const s = search.toLowerCase();
      docs = docs.filter(d =>
        d.title?.toLowerCase().includes(s) ||
        (d as any).trackingCode?.toLowerCase().includes(s) ||
        (d as any).senderName?.toLowerCase().includes(s) ||
        (d as any).recipientName?.toLowerCase().includes(s)
      );
    }

    return docs;
  }, [allDocs, activeTab, search]);

  // Stats by type
  const statsByType = useMemo(() => {
    const counts: Record<string, number> = {};
    allDocs.forEach(d => {
      counts[d.type] = (counts[d.type] || 0) + 1;
    });
    return counts;
  }, [allDocs]);

  const sourceStats = useMemo(() => ({
    issued: issuedDocs.length,
    received: receivedDocs.length,
    sent: sentDocs.length,
  }), [issuedDocs, receivedDocs, sentDocs]);

  const getDocIcon = (type: string) => {
    const config = DOC_TYPES[type] || DOC_TYPES.other;
    const Icon = config.icon;
    return <Icon className={`w-4 h-4 ${config.color}`} />;
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'issued': return <Badge variant="outline" className="text-[10px] gap-1"><FolderOpen className="w-3 h-3" /> صادر</Badge>;
      case 'received': return <Badge variant="secondary" className="text-[10px] gap-1"><Inbox className="w-3 h-3" /> وارد</Badge>;
      case 'sent': return <Badge className="text-[10px] gap-1 bg-primary/10 text-primary"><SendIcon className="w-3 h-3" /> مُرسل</Badge>;
      default: return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <BackButton />
          <div>
            <h1 className="text-xl font-bold">أرشيف المستندات</h1>
            <p className="text-sm text-muted-foreground">
              جميع المستندات الصادرة والواردة والمشتركة في مكان واحد
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-3 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('all')}>
            <div className="flex items-center gap-2 justify-end">
              <div className="text-right">
                <p className="text-xl font-bold">{allDocs.length}</p>
                <p className="text-[10px] text-muted-foreground">إجمالي المستندات</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-4 h-4 text-primary" />
              </div>
            </div>
          </Card>
          <Card className="p-3 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('issued')}>
            <div className="flex items-center gap-2 justify-end">
              <div className="text-right">
                <p className="text-xl font-bold">{sourceStats.issued}</p>
                <p className="text-[10px] text-muted-foreground">صادرة</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <FolderOpen className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
          </Card>
          <Card className="p-3 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('received')}>
            <div className="flex items-center gap-2 justify-end">
              <div className="text-right">
                <p className="text-xl font-bold">{sourceStats.received}</p>
                <p className="text-[10px] text-muted-foreground">واردة</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Inbox className="w-4 h-4 text-blue-600" />
              </div>
            </div>
          </Card>
          <Card className="p-3 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('sent')}>
            <div className="flex items-center gap-2 justify-end">
              <div className="text-right">
                <p className="text-xl font-bold">{sourceStats.sent}</p>
                <p className="text-[10px] text-muted-foreground">مُرسلة</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <SendIcon className="w-4 h-4 text-purple-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Search + Filter */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setSortDesc(!sortDesc)} className="gap-1">
            <ArrowUpDown className="w-3 h-3" />
            {sortDesc ? 'الأحدث' : 'الأقدم'}
          </Button>
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم أو رقم المستند أو الجهة..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pr-9"
            />
          </div>
        </div>

        {/* Type filter tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <ScrollArea className="w-full">
            <TabsList className="h-auto flex-wrap gap-1 bg-transparent p-0 justify-end">
              <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs px-3 py-1.5">
                الكل ({allDocs.length})
              </TabsTrigger>
              <TabsTrigger value="issued" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-xs px-3 py-1.5">
                صادرة ({sourceStats.issued})
              </TabsTrigger>
              <TabsTrigger value="received" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs px-3 py-1.5">
                واردة ({sourceStats.received})
              </TabsTrigger>
              <TabsTrigger value="sent" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-xs px-3 py-1.5">
                مُرسلة ({sourceStats.sent})
              </TabsTrigger>
              {Object.entries(statsByType).map(([type, count]) => {
                const config = DOC_TYPES[type] || DOC_TYPES.other;
                return (
                  <TabsTrigger key={type} value={type} className="text-xs px-3 py-1.5 gap-1">
                    {config.label} ({count})
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </ScrollArea>

          <TabsContent value={activeTab} className="mt-3">
            {isLoading ? (
              <div className="space-y-2">
                {[1,2,3].map(i => (
                  <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : filteredDocs.length === 0 ? (
              <Card className="p-8 text-center">
                <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-50" />
                <p className="text-muted-foreground">لا توجد مستندات مطابقة</p>
              </Card>
            ) : (
              <div className="space-y-1.5">
                {filteredDocs.map(doc => (
                  <Card key={`${doc.source}-${doc.id}`} className="p-3 hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between gap-3">
                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {(doc as any).fileUrl && (
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" asChild>
                            <a href={(doc as any).fileUrl} target="_blank" rel="noopener noreferrer" title="تحميل">
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          </Button>
                        )}
                        {(doc as any).referenceId && (
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="عرض" onClick={() => navigate(`/dashboard/verify?code=${(doc as any).referenceId}`)}>
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 text-right min-w-0">
                        <div className="flex items-center gap-2 justify-end flex-wrap">
                          {getSourceBadge(doc.source)}
                          {(doc as any).signed && <Badge className="text-[10px] bg-emerald-500/10 text-emerald-600">موقّع ✓</Badge>}
                          {(doc as any).status === 'pending' && <Badge variant="outline" className="text-[10px] text-amber-600">بانتظار المراجعة</Badge>}
                          <span className="font-medium text-sm truncate">{doc.title}</span>
                          {getDocIcon(doc.type)}
                        </div>
                        <div className="flex items-center gap-2 justify-end mt-1 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(doc.date), { locale: ar, addSuffix: true })}
                          </span>
                          <span>•</span>
                          <span>{format(new Date(doc.date), 'dd/MM/yyyy', { locale: ar })}</span>
                          {doc.source === 'received' && (doc as any).senderName && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                من: {(doc as any).senderName}
                              </span>
                            </>
                          )}
                          {doc.source === 'sent' && (doc as any).recipientName && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                إلى: {(doc as any).recipientName}
                              </span>
                            </>
                          )}
                          {doc.source === 'issued' && (doc as any).issuedBy && (
                            <>
                              <span>•</span>
                              <span>بواسطة: {(doc as any).issuedBy}</span>
                            </>
                          )}
                          {(doc as any).trackingCode && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-[10px]">{(doc as any).trackingCode}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default DocumentArchive;
