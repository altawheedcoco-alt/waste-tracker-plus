/**
 * لوحة الأرشيف والمستندات — يعرض كل مستندات المنظمة من entity_documents
 * يدعم فتح مركز إجراءات المستند الموحد (DocumentActionHub) لأي مستند
 */
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Search, FileText, Download, Eye, Clock, FolderOpen, Filter,
  Image, FileCheck, Inbox, Send, ArrowUpDown, ExternalLink, Loader2, Upload,
  PenTool, Stamp, FileSignature, Package, Truck, Shield,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ar as arLocale } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import DocumentActionHub from '@/components/documents/DocumentActionHub';
import type { DocumentSource } from '@/components/documents/UnifiedDocumentViewer';

const categoryMap: Record<string, { label: string; icon: typeof FileText }> = {
  documents: { label: 'مستندات', icon: FileText },
  financials: { label: 'مالية', icon: FileText },
  operations: { label: 'تشغيل', icon: Truck },
  legal: { label: 'قانونية', icon: FileCheck },
  other: { label: 'أخرى', icon: FolderOpen },
};

const typeMap: Record<string, string> = {
  award_letter: 'خطاب ترسية',
  contract: 'عقد',
  correspondence: 'مراسلات',
  invoice: 'فاتورة',
  receipt: 'إقرار / إيصال',
  deposit_proof: 'إثبات إيداع',
  weight_slip: 'تذكرة ميزان',
  certificate: 'شهادة',
  license: 'رخصة / تصريح',
  registration: 'تسجيل',
  other: 'مستند عام',
};

const BUCKET_NAME = 'entity-documents';

const DocumentArchivePanel = () => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [loadingFileId, setLoadingFileId] = useState<string | null>(null);
  const [hubDoc, setHubDoc] = useState<any | null>(null);

  const openDocHub = (doc: any) => setHubDoc(doc);

  const docToSource = (doc: any): DocumentSource => ({
    url: doc.file_url,
    fileName: doc.file_name,
    fileType: doc.file_type,
    fileSize: doc.file_size,
    title: doc.title || doc.file_name,
    description: doc.description,
    documentType: doc.document_type,
    documentCategory: doc.document_category,
    referenceNumber: doc.reference_number,
    documentDate: doc.document_date,
    uploadedAt: doc.created_at,
    tags: doc.tags,
    entityDocumentId: doc.id,
  });

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['document-center-archive', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('entity_documents')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
    enabled: !!organization?.id,
  });

  // Realtime subscription
  useEffect(() => {
    if (!organization?.id) return;
    const channel = supabase
      .channel('archive-panel-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'entity_documents',
        filter: `organization_id=eq.${organization.id}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['document-center-archive'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [organization?.id, queryClient]);

  const getFileUrl = useCallback(async (fileUrl: string): Promise<string | null> => {
    if (!fileUrl) return null;
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) return fileUrl;
    const buckets = [
      BUCKET_NAME, 'pdf-documents', 'shipment-photos', 'organization-documents',
      'weighbridge-photos', 'signing-documents', 'shared-documents',
      'deposit-receipts', 'identity-documents', 'stamps',
    ];
    for (const bucket of buckets) {
      try {
        const { data } = await supabase.storage.from(bucket).createSignedUrl(fileUrl, 3600);
        if (data?.signedUrl) return data.signedUrl;
      } catch { /* try next bucket */ }
    }
    return null;
  }, []);

  const handleDownloadFile = useCallback(async (docId: string, fileUrl: string, fileName: string) => {
    setLoadingFileId(docId);
    try {
      const url = await getFileUrl(fileUrl);
      if (url) {
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName || 'document';
        link.target = '_blank';
        link.click();
      } else {
        toast.error('فشل في تحميل المستند');
      }
    } finally {
      setLoadingFileId(null);
    }
  }, [getFileUrl]);

  const filtered = useMemo(() => {
    let result = documents;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter((d: any) =>
        d.title?.toLowerCase().includes(s) ||
        d.file_name?.toLowerCase().includes(s) ||
        d.document_type?.toLowerCase().includes(s) ||
        d.tags?.some((t: string) => t.toLowerCase().includes(s))
      );
    }
    if (categoryFilter !== 'all') {
      result = result.filter((d: any) => d.document_category === categoryFilter || d.document_type === categoryFilter);
    }
    if (sortOrder === 'asc') result = [...result].reverse();
    return result;
  }, [documents, search, categoryFilter, sortOrder]);

  const stats = useMemo(() => {
    const cats: Record<string, number> = {};
    documents.forEach((d: any) => {
      const cat = d.document_category || d.document_type || 'other';
      cats[cat] = (cats[cat] || 0) + 1;
    });
    return cats;
  }, [documents]);

  const getDocBadge = (doc: any) => {
    const t = doc.title || '';
    if (t.includes('مانيفست')) return { label: '📋 مانيفست', cls: 'border-orange-400/40 text-orange-600' };
    if (t.includes('تتبع')) return { label: '📍 تتبع', cls: 'border-blue-400/40 text-blue-600' };
    if (t.includes('إقرار')) return { label: '✅ إقرار', cls: 'border-emerald-400/40 text-emerald-600' };
    if (t.includes('بوليصة')) return { label: '🚢 بوليصة', cls: 'border-indigo-400/40 text-indigo-600' };
    if (t.includes('حادث')) return { label: '⚠️ حادث', cls: 'border-red-400/40 text-red-600' };
    if (t.includes('ميزان')) return { label: '⚖️ ميزان', cls: 'border-amber-400/40 text-amber-600' };
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-primary">{documents.length}</p>
            <p className="text-xs text-muted-foreground">إجمالي المستندات</p>
          </CardContent>
        </Card>
        {Object.entries(stats).slice(0, 5).map(([cat, count]) => (
          <Card key={cat} className="bg-muted/30">
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold">{count}</p>
              <p className="text-xs text-muted-foreground">{categoryMap[cat]?.label || typeMap[cat] || cat}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="بحث في المستندات..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-9" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40">
            <Filter className="w-4 h-4 ml-2" />
            <SelectValue placeholder="الكل" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            {Object.entries(categoryMap).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={() => setSortOrder(s => s === 'desc' ? 'asc' : 'desc')}>
          <ArrowUpDown className="w-4 h-4" />
        </Button>
        <Button variant="default" size="sm" onClick={() => navigate('/dashboard/document-center?tab=upload')}>
          <Upload className="w-4 h-4 ml-1" />
          رفع مستند
        </Button>
      </div>

      {/* Documents List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>لا توجد مستندات</p>
          </CardContent>
        </Card>
      ) : (
        <TooltipProvider>
          <ScrollArea className="h-[600px]">
            <div className="space-y-2">
              {filtered.map((doc: any) => {
                const isFileLoading = loadingFileId === doc.id;
                const extraBadge = getDocBadge(doc);
                return (
                  <Card key={doc.id} className="hover:bg-muted/30 hover:border-primary/30 transition-all cursor-pointer group" onClick={() => openDocHub(doc)}>
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        doc.document_category === 'legal' ? 'bg-amber-500/10' :
                        doc.document_category === 'financials' ? 'bg-emerald-500/10' :
                        'bg-primary/10'
                      }`}>
                        {doc.file_type?.startsWith('image') ? (
                          <Image className={`w-5 h-5 ${doc.document_category === 'legal' ? 'text-amber-600' : 'text-primary'}`} />
                        ) : doc.document_type === 'certificate' ? (
                          <Shield className="w-5 h-5 text-amber-600" />
                        ) : doc.document_type === 'contract' ? (
                          <FileSignature className="w-5 h-5 text-indigo-600" />
                        ) : doc.document_type === 'invoice' ? (
                          <FileCheck className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <FileText className={`w-5 h-5 ${doc.document_category === 'financials' ? 'text-emerald-600' : 'text-primary'}`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{doc.title || doc.file_name || 'مستند'}</p>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                          <Badge variant="secondary" className="text-[10px] py-0">
                            {typeMap[doc.document_type] || categoryMap[doc.document_category]?.label || 'عام'}
                          </Badge>
                          {extraBadge && (
                            <Badge variant="outline" className={`text-[10px] py-0 ${extraBadge.cls}`}>
                              {extraBadge.label}
                            </Badge>
                          )}
                          {doc.shipment_id && (
                            <Badge variant="outline" className="text-[10px] py-0 border-blue-400/40 text-blue-600">
                              <Package className="w-2.5 h-2.5 ml-0.5" />
                              شحنة
                            </Badge>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true, locale: arLocale })}
                          </span>
                          {doc.file_size && <span>{(doc.file_size / 1024).toFixed(0)} KB</span>}
                        </div>
                      </div>
                      <div className="flex gap-0.5 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openDocHub(doc); }}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top"><p>معاينة وفتح</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary" onClick={(e) => { e.stopPropagation(); openDocHub(doc); }}>
                              <PenTool className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top"><p>توقيع إلكتروني</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600 hover:text-amber-700" onClick={(e) => { e.stopPropagation(); openDocHub(doc); }}>
                              <Stamp className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top"><p>ختم إلكتروني</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleDownloadFile(doc.id, doc.file_url, doc.file_name); }}>
                              {isFileLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top"><p>تحميل</p></TooltipContent>
                        </Tooltip>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </TooltipProvider>
      )}

      {/* Document Action Hub */}
      {hubDoc && (
        <DocumentActionHub
          source={docToSource(hubDoc)}
          open={!!hubDoc}
          onOpenChange={(v) => { if (!v) setHubDoc(null); }}
          referenceId={hubDoc.id}
          referenceType={hubDoc.document_type}
        />
      )}
    </div>
  );
};

export default DocumentArchivePanel;
