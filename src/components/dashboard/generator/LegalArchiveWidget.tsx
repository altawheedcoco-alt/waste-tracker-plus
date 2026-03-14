import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FolderArchive, Download, FileText, Shield, Search, Calendar, Filter, AlertCircle, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { format, differenceInDays, addYears } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';

const docTypeLabels: Record<string, string> = {
  disposal_certificate: 'شهادة تخلص آمن',
  recycling_report: 'تقرير تدوير',
  invoice: 'فاتورة',
};

const docTypeIcons: Record<string, string> = {
  disposal_certificate: '📜',
  recycling_report: '♻️',
  invoice: '🧾',
};

const LegalArchiveWidget = () => {
  const { organization } = useAuth();
  const navigate = useNavigate();
  const orgId = organization?.id;
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['generator-legal-archive', orgId],
    queryFn: async () => {
      if (!orgId) return [];

      const { data: reports, error: reportsError } = await supabase
        .from('recycling_reports')
        .select('id, report_number, created_at, shipment_id')
        .order('created_at', { ascending: false })
        .limit(100);
      if (reportsError) throw reportsError;

      const shipmentIds = (reports || []).map((r: any) => r.shipment_id).filter(Boolean);
      let shipmentsMap: Record<string, any> = {};
      if (shipmentIds.length > 0) {
        const { data: shipments } = await supabase
          .from('shipments')
          .select('id, shipment_number, waste_type, generator_id')
          .in('id', shipmentIds)
          .eq('generator_id', orgId);
        (shipments || []).forEach((s: any) => { shipmentsMap[s.id] = s; });
      }

      const filteredReports = (reports || []).filter((r: any) => shipmentsMap[r.shipment_id]);

      const invoicesQuery = supabase.from('invoices').select('id, invoice_number, created_at, status, total_amount');
      const { data: invoices, error: invoicesError } = await (invoicesQuery as any)
        .eq('client_organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (invoicesError) throw invoicesError;

      const docs: any[] = [];

      filteredReports.forEach((r: any) => {
        const shipment = shipmentsMap[r.shipment_id];
        // Retention: 5 years from creation
        const expiresAt = addYears(new Date(r.created_at), 5);
        const daysUntilExpiry = differenceInDays(expiresAt, new Date());

        docs.push({
          id: r.id, type: 'disposal_certificate', number: r.report_number,
          date: r.created_at, shipment_number: shipment?.shipment_number,
          waste_type: shipment?.waste_type, expiresAt, daysUntilExpiry,
        });
      });

      (invoices || []).forEach((inv: any) => {
        docs.push({
          id: inv.id, type: 'invoice', number: inv.invoice_number,
          date: inv.created_at, amount: inv.total_amount, status: inv.status,
          daysUntilExpiry: null,
        });
      });

      docs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      return docs;
    },
    enabled: !!orgId,
  });

  const expiringDocs = useMemo(() =>
    documents.filter((d: any) => d.daysUntilExpiry !== null && d.daysUntilExpiry <= 90 && d.daysUntilExpiry > 0),
    [documents]
  );

  const filteredDocs = useMemo(() => {
    let result = documents.filter((doc: any) => {
      if (typeFilter !== 'all' && doc.type !== typeFilter) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return doc.number?.toLowerCase().includes(q) || doc.shipment_number?.toLowerCase().includes(q) || doc.waste_type?.toLowerCase().includes(q);
    });

    if (sortBy === 'date_asc') result = [...result].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    // date_desc is default
    return result;
  }, [documents, searchQuery, typeFilter, sortBy]);

  const handleDownload = async (doc: any) => {
    toast.loading(`جاري تحميل ${docTypeLabels[doc.type]} رقم ${doc.number}...`);
    try {
      // Try to find document in entity_documents or document_registry
      const { data: entityDoc } = await supabase
        .from('entity_documents')
        .select('file_url')
        .or(`entity_id.eq.${doc.id}`)
        .maybeSingle();

      if (entityDoc?.file_url) {
        window.open(entityDoc.file_url, '_blank');
        toast.dismiss();
        toast.success('تم فتح المستند');
      } else {
        // Navigate to the relevant page for viewing
        if (doc.type === 'invoice') {
          navigate(`/dashboard/accounting`);
        } else if (doc.shipment_number) {
          const { data: shipment } = await supabase
            .from('shipments')
            .select('id')
            .eq('shipment_number', doc.shipment_number)
            .maybeSingle();
          if (shipment) navigate(`/dashboard/shipments/${shipment.id}`);
        }
        toast.dismiss();
        toast.info('تم التوجيه لصفحة المستند لتحميله');
      }
    } catch {
      toast.dismiss();
      toast.error('حدث خطأ أثناء تحميل المستند');
    }
  };

  const handleBulkDownload = () => {
    toast.info(`${filteredDocs.length} مستند — استخدم صفحة الأرشيف للتحميل الجماعي`);
    navigate('/dashboard/archive');
  };

  if (isLoading) {
    return (
      <Card><CardHeader><CardTitle className="flex items-center gap-2 justify-end"><FolderArchive className="w-5 h-5" /> الأرشيف القانوني</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-32 w-full" /></CardContent></Card>
    );
  }

  const certCount = documents.filter((d: any) => d.type === 'disposal_certificate').length;
  const invoiceCount = documents.filter((d: any) => d.type === 'invoice').length;

  return (
    <Card className="border-indigo-200 dark:border-indigo-800/40 bg-gradient-to-br from-indigo-50/50 to-background dark:from-indigo-950/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] gap-1"><Shield className="w-3 h-3" /> {documents.length} مستند</Badge>
            {expiringDocs.length > 0 && (
              <Badge variant="destructive" className="text-[10px] gap-1 animate-pulse">
                <AlertCircle className="w-3 h-3" /> {expiringDocs.length} قريب الانتهاء
              </Badge>
            )}
          </div>
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <FolderArchive className="w-5 h-5 text-indigo-600" />
            الأرشيف القانوني
          </CardTitle>
        </div>
        <CardDescription className="text-right">شهادات التخلص والفواتير - جاهزة للتفتيش البيئي</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Expiring Alerts */}
        {expiringDocs.length > 0 && (
          <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40">
            <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mb-1 text-right">
              ⚠️ مستندات قريبة من انتهاء الصلاحية (90 يوم)
            </p>
            {expiringDocs.slice(0, 3).map((doc: any) => (
              <div key={doc.id} className="flex items-center justify-between text-[10px] text-amber-600 py-0.5">
                <span><Clock className="w-3 h-3 inline ml-1" />{doc.daysUntilExpiry} يوم</span>
                <span>{docTypeLabels[doc.type]} - {doc.number}</span>
              </div>
            ))}
          </div>
        )}

        {/* Stats Bar */}
        <div className="flex items-center gap-2 justify-end text-[10px]">
          <Badge variant="secondary" className="text-[9px]">📜 شهادات: {certCount}</Badge>
          <Badge variant="secondary" className="text-[9px]">🧾 فواتير: {invoiceCount}</Badge>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-xs h-8 gap-1 shrink-0" onClick={handleBulkDownload} disabled={filteredDocs.length === 0}>
            <Download className="w-3 h-3" /> تحميل الكل
          </Button>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[100px] h-8 text-xs">
              <Filter className="w-3 h-3 ml-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="disposal_certificate">شهادات</SelectItem>
              <SelectItem value="invoice">فواتير</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="بحث..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 text-right text-sm h-8" dir="rtl" />
          </div>
        </div>

        {/* Documents List */}
        {filteredDocs.length === 0 ? (
          <div className="text-center py-6">
            <FolderArchive className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-muted-foreground text-sm">لا توجد مستندات مطابقة</p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[350px] overflow-y-auto">
            <AnimatePresence>
              {filteredDocs.map((doc: any, index: number) => (
                <motion.div
                  key={`${doc.type}-${doc.id}`}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className={`flex items-center justify-between p-2.5 rounded-lg border bg-card hover:shadow-sm transition-all ${
                    doc.daysUntilExpiry !== null && doc.daysUntilExpiry <= 90 ? 'border-amber-300 dark:border-amber-700' : ''
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Button variant="ghost" size="sm" className="text-xs h-7 gap-1 px-2" onClick={() => handleDownload(doc)}>
                      <Download className="w-3.5 h-3.5" /> PDF
                    </Button>
                    {doc.daysUntilExpiry !== null && doc.daysUntilExpiry <= 90 && (
                      <Badge variant="outline" className="text-[9px] text-amber-600 border-amber-300">
                        {doc.daysUntilExpiry} يوم
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-right">
                    <div>
                      <div className="flex items-center gap-1.5 justify-end">
                        <span className="text-sm font-medium">{doc.number}</span>
                        <span className="text-sm">{docTypeIcons[doc.type]}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {format(new Date(doc.date), 'dd MMM yyyy', { locale: ar })}
                        {doc.shipment_number && ` • ${doc.shipment_number}`}
                        {doc.waste_type && ` • ${doc.waste_type}`}
                        {doc.amount && ` • ${doc.amount} ج.م`}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LegalArchiveWidget;
