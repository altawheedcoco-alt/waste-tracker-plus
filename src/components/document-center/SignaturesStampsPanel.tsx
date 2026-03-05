/**
 * لوحة التوقيعات والأختام — إدارة التوقيعات والأختام والمفوضين + جميع مستندات الجهة
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  PenTool, BadgeCheck, Stamp, FileSignature, Inbox, Users,
  CheckCircle2, Clock, ArrowRight, Shield, FileText, Search,
  File, FileImage, FileBadge, FileCheck, Upload, Eye,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const DOC_CATEGORY_LABELS: Record<string, string> = {
  shipment: 'شحنة',
  contract: 'عقد',
  invoice: 'فاتورة',
  certificate: 'شهادة',
  declaration: 'إقرار',
  report: 'تقرير',
  license: 'ترخيص',
  receipt: 'إيصال',
  tracking_form: 'نموذج تتبع',
  award_letter: 'خطاب ترسية',
  weighbridge: 'تذكرة ميزان',
  correspondence: 'مراسلة',
  other: 'أخرى',
  general: 'عام',
  official: 'رسمي',
  internal: 'داخلي',
  external: 'خارجي',
};

const DOC_TYPE_ICONS: Record<string, any> = {
  pdf: File,
  image: FileImage,
  certificate: FileBadge,
  contract: FileSignature,
  default: FileText,
};

const SignaturesStampsPanel = () => {
  const { organization } = useAuth();
  const navigate = useNavigate();

  // Documents tab state
  const [docSearch, setDocSearch] = useState('');
  const [docCategoryFilter, setDocCategoryFilter] = useState('all');

  const { data: signatures = [] } = useQuery({
    queryKey: ['doc-center-signatures', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await (supabase.from('organization_signatures') as any)
        .select('*')
        .eq('organization_id', organization.id);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const { data: stamps = [] } = useQuery({
    queryKey: ['doc-center-stamps', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await (supabase.from('organization_stamps') as any)
        .select('*')
        .eq('organization_id', organization.id);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const { data: signatories = [] } = useQuery({
    queryKey: ['doc-center-signatories', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from('authorized_signatories')
        .select('*')
        .eq('organization_id', organization.id);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const { data: signingRequests = [] } = useQuery({
    queryKey: ['doc-center-signing-requests', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from('signing_requests')
        .select('*')
        .eq('recipient_organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  // Fetch ALL organization documents
  const { data: allDocuments = [], isLoading: docsLoading } = useQuery({
    queryKey: ['doc-center-all-documents', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from('entity_documents')
        .select('id, title, document_type, document_category, file_name, file_url, file_type, file_size, created_at, reference_number, shipment_id, contract_id, invoice_id, deposit_id, award_letter_id, tags, description')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(500);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  // Fetch signatures count per document
  const { data: docSignatures = [] } = useQuery({
    queryKey: ['doc-center-doc-signatures', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from('document_signatures')
        .select('document_id, id, stamp_applied, status')
        .eq('organization_id', organization.id);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const pendingCount = signingRequests.filter((r: any) => r.status === 'pending').length;

  // Build signature map: documentId -> { signCount, stampCount }
  const sigMap: Record<string, { signs: number; stamps: number }> = {};
  docSignatures.forEach((ds: any) => {
    if (!sigMap[ds.document_id]) sigMap[ds.document_id] = { signs: 0, stamps: 0 };
    sigMap[ds.document_id].signs++;
    if (ds.stamp_applied) sigMap[ds.document_id].stamps++;
  });

  // Filter documents
  const uniqueCategories = [...new Set(allDocuments.map((d: any) => d.document_category))].filter(Boolean);
  const filteredDocs = allDocuments.filter((doc: any) => {
    const matchSearch = !docSearch || 
      doc.title?.toLowerCase().includes(docSearch.toLowerCase()) ||
      doc.file_name?.toLowerCase().includes(docSearch.toLowerCase()) ||
      doc.reference_number?.toLowerCase().includes(docSearch.toLowerCase());
    const matchCategory = docCategoryFilter === 'all' || doc.document_category === docCategoryFilter;
    return matchSearch && matchCategory;
  });

  const getDocIcon = (doc: any) => {
    if (doc.file_type?.includes('pdf')) return File;
    if (doc.file_type?.includes('image')) return FileImage;
    if (doc.document_category === 'certificate') return FileBadge;
    if (doc.document_category === 'contract') return FileSignature;
    return FileText;
  };

  const getLinkedEntity = (doc: any): string | null => {
    if (doc.shipment_id) return 'شحنة';
    if (doc.contract_id) return 'عقد';
    if (doc.invoice_id) return 'فاتورة';
    if (doc.deposit_id) return 'إيداع';
    if (doc.award_letter_id) return 'خطاب ترسية';
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-primary">{signatures.length}</p>
            <p className="text-xs text-muted-foreground">توقيعات</p>
          </CardContent>
        </Card>
        <Card className="bg-accent/10">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{stamps.length}</p>
            <p className="text-xs text-muted-foreground">أختام</p>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{signatories.length}</p>
            <p className="text-xs text-muted-foreground">مفوضون</p>
          </CardContent>
        </Card>
        <Card className={pendingCount > 0 ? 'bg-destructive/10 border-destructive/30' : 'bg-muted/30'}>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-destructive">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">طلبات معلقة</p>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/10">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-primary">{allDocuments.length}</p>
            <p className="text-xs text-muted-foreground">مستندات</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="documents" className="w-full">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="documents" className="text-xs gap-1">
            <FileText className="w-3.5 h-3.5" />المستندات
            {allDocuments.length > 0 && <Badge variant="secondary" className="text-[10px] px-1 py-0 mr-1">{allDocuments.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="signatures" className="text-xs gap-1"><PenTool className="w-3.5 h-3.5" />التوقيعات</TabsTrigger>
          <TabsTrigger value="stamps" className="text-xs gap-1"><Stamp className="w-3.5 h-3.5" />الأختام</TabsTrigger>
          <TabsTrigger value="signatories" className="text-xs gap-1"><Users className="w-3.5 h-3.5" />المفوضون</TabsTrigger>
          <TabsTrigger value="requests" className="text-xs gap-1">
            <Inbox className="w-3.5 h-3.5" />الطلبات
            {pendingCount > 0 && <Badge variant="destructive" className="text-[10px] px-1 py-0 mr-1">{pendingCount}</Badge>}
          </TabsTrigger>
        </TabsList>

        {/* ===== المستندات — جميع مستندات الجهة ===== */}
        <TabsContent value="documents" className="mt-4 space-y-3">
          {/* Search & Filter */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالعنوان أو الرقم المرجعي..."
                value={docSearch}
                onChange={(e) => setDocSearch(e.target.value)}
                className="pr-9"
              />
            </div>
            <Select value={docCategoryFilter} onValueChange={setDocCategoryFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="الكل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                {uniqueCategories.map((cat: string) => (
                  <SelectItem key={cat} value={cat}>
                    {DOC_CATEGORY_LABELS[cat] || cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Document List */}
          {docsLoading ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">جاري تحميل المستندات...</CardContent></Card>
          ) : filteredDocs.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">
              {docSearch || docCategoryFilter !== 'all' ? 'لا توجد نتائج مطابقة' : 'لا توجد مستندات'}
            </CardContent></Card>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredDocs.map((doc: any) => {
                const Icon = getDocIcon(doc);
                const linked = getLinkedEntity(doc);
                const sigs = sigMap[doc.id];
                const isSigned = sigs && sigs.signs > 0;
                const isStamped = sigs && sigs.stamps > 0;

                return (
                  <Card key={doc.id} className="hover:bg-muted/30 transition-colors group">
                    <CardContent className="p-3 flex items-center gap-3">
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        isSigned ? 'bg-green-100 dark:bg-green-900/30' : 'bg-muted'
                      }`}>
                        <Icon className={`w-5 h-5 ${isSigned ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{doc.title || doc.file_name}</p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <Badge variant="outline" className="text-[10px] px-1.5">
                            {DOC_CATEGORY_LABELS[doc.document_category] || doc.document_category}
                          </Badge>
                          {linked && (
                            <Badge variant="secondary" className="text-[10px] px-1.5">{linked}</Badge>
                          )}
                          {doc.reference_number && (
                            <span className="text-[10px] text-muted-foreground">#{doc.reference_number}</span>
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            {format(new Date(doc.created_at), 'dd MMM yyyy', { locale: ar })}
                          </span>
                        </div>
                      </div>

                      {/* Signature/Stamp Status */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isSigned && (
                          <Badge variant="default" className="text-[10px] gap-0.5">
                            <CheckCircle2 className="w-3 h-3" />
                            موقّع ({sigs.signs})
                          </Badge>
                        )}
                        {isStamped && (
                          <Badge variant="secondary" className="text-[10px] gap-0.5">
                            <Stamp className="w-3 h-3" />
                            مختوم
                          </Badge>
                        )}
                        {!isSigned && (
                          <Badge variant="outline" className="text-[10px] gap-0.5 text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            بدون توقيع
                          </Badge>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        {doc.file_url && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => window.open(doc.file_url, '_blank')}
                            title="عرض المستند"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-primary"
                          onClick={() => navigate(`/dashboard/signing-status?doc=${doc.id}&type=${doc.document_category}`)}
                          title="توقيع / ختم"
                        >
                          <FileSignature className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 gap-2" onClick={() => navigate('/dashboard/document-center?tab=archive')}>
              <FileText className="w-4 h-4" />
              أرشيف المستندات
              <ArrowRight className="w-4 h-4 mr-auto rtl:rotate-180" />
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => navigate('/dashboard/signing-status')}>
              <FileSignature className="w-4 h-4" />
              إدارة التوقيع
            </Button>
          </div>
        </TabsContent>

        {/* ===== التوقيعات ===== */}
        <TabsContent value="signatures" className="mt-4 space-y-3">
          {signatures.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">لا توجد توقيعات مسجلة</CardContent></Card>
          ) : (
            signatures.map((sig: any) => (
              <Card key={sig.id} className="hover:bg-muted/30 transition-colors">
                <CardContent className="p-3 flex items-center gap-3">
                  {sig.signature_image_url ? (
                    <img src={sig.signature_image_url} alt="signature" className="w-16 h-10 object-contain bg-white rounded border" />
                  ) : (
                    <div className="w-16 h-10 rounded bg-muted flex items-center justify-center"><PenTool className="w-5 h-5 text-muted-foreground" /></div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-sm">{sig.signature_name || sig.signer_name || 'توقيع'}</p>
                    <div className="flex gap-2 mt-0.5">
                      <Badge variant={sig.is_active ? 'default' : 'secondary'} className="text-[10px]">
                        {sig.is_active ? 'فعّال' : 'غير فعّال'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
          <Button variant="outline" className="w-full gap-2" onClick={() => navigate('/dashboard/signing-status')}>
            <PenTool className="w-4 h-4" />
            إدارة التوقيعات
            <ArrowRight className="w-4 h-4 mr-auto rtl:rotate-180" />
          </Button>
        </TabsContent>

        {/* ===== الأختام ===== */}
        <TabsContent value="stamps" className="mt-4 space-y-3">
          {stamps.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">لا توجد أختام مسجلة</CardContent></Card>
          ) : (
            stamps.map((stamp: any) => (
              <Card key={stamp.id} className="hover:bg-muted/30 transition-colors">
                <CardContent className="p-3 flex items-center gap-3">
                  {stamp.stamp_image_url ? (
                    <img src={stamp.stamp_image_url} alt="stamp" className="w-14 h-14 object-contain bg-white rounded border" />
                  ) : (
                    <div className="w-14 h-14 rounded bg-muted flex items-center justify-center"><Stamp className="w-6 h-6 text-muted-foreground" /></div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-sm">{stamp.stamp_name || 'ختم'}</p>
                    <Badge variant={stamp.is_active ? 'default' : 'secondary'} className="text-[10px] mt-1">
                      {stamp.is_active ? 'فعّال' : 'غير فعّال'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
          <Button variant="outline" className="w-full gap-2" onClick={() => navigate('/dashboard/admin-document-stamping')}>
            <BadgeCheck className="w-4 h-4" />
            إدارة الأختام
            <ArrowRight className="w-4 h-4 mr-auto rtl:rotate-180" />
          </Button>
        </TabsContent>

        {/* ===== المفوضون ===== */}
        <TabsContent value="signatories" className="mt-4 space-y-3">
          {signatories.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">لا يوجد مفوضون</CardContent></Card>
          ) : (
            signatories.map((s: any) => (
              <Card key={s.id} className="hover:bg-muted/30 transition-colors">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{s.full_name}</p>
                    <p className="text-xs text-muted-foreground">{s.job_title || 'مفوّض'}</p>
                  </div>
                  <Badge variant={s.is_active ? 'default' : 'secondary'} className="text-[10px]">
                    {s.is_active ? 'فعّال' : 'غير فعّال'}
                  </Badge>
                </CardContent>
              </Card>
            ))
          )}
          <Button variant="outline" className="w-full gap-2" onClick={() => navigate('/dashboard/authorized-signatories')}>
            <Users className="w-4 h-4" />
            إدارة المفوضين
            <ArrowRight className="w-4 h-4 mr-auto rtl:rotate-180" />
          </Button>
        </TabsContent>

        {/* ===== الطلبات ===== */}
        <TabsContent value="requests" className="mt-4 space-y-3">
          {signingRequests.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">لا توجد طلبات توقيع</CardContent></Card>
          ) : (
            signingRequests.slice(0, 20).map((req: any) => (
              <Card key={req.id} className="hover:bg-muted/30 transition-colors">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    req.status === 'pending' ? 'bg-destructive/10' :
                    req.status === 'signed' ? 'bg-accent/10' : 'bg-muted'
                  }`}>
                    {req.status === 'signed' ? (
                      <CheckCircle2 className="w-5 h-5 text-accent-foreground" />
                    ) : (
                      <Clock className="w-5 h-5 text-destructive" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{req.document_title || 'طلب توقيع'}</p>
                    <p className="text-xs text-muted-foreground">{req.request_type || 'توقيع'}</p>
                  </div>
                  <Badge variant={req.status === 'pending' ? 'outline' : 'default'} className="text-[10px]">
                    {req.status === 'pending' ? 'معلق' : req.status === 'signed' ? 'تم' : req.status}
                  </Badge>
                </CardContent>
              </Card>
            ))
          )}
          <Button variant="outline" className="w-full gap-2" onClick={() => navigate('/dashboard/signing-inbox')}>
            <Inbox className="w-4 h-4" />
            صندوق التوقيعات
            <ArrowRight className="w-4 h-4 mr-auto rtl:rotate-180" />
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SignaturesStampsPanel;
