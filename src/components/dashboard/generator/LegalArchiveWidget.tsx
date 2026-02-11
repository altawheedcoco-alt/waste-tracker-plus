import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FolderArchive, Download, FileText, Shield, Search, ExternalLink } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { toast } from 'sonner';

const docTypeLabels: Record<string, string> = {
  disposal_certificate: 'شهادة تخلص آمن',
  recycling_report: 'تقرير تدوير',
  weight_ticket: 'بطاقة وزن',
  invoice: 'فاتورة',
  manifest: 'بوليصة شحن',
};

const docTypeColors: Record<string, string> = {
  disposal_certificate: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  recycling_report: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  weight_ticket: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  invoice: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  manifest: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
};

const LegalArchiveWidget = () => {
  const { organization } = useAuth();
  const navigate = useNavigate();
  const orgId = organization?.id;
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch certificates (recycling_reports as disposal certificates)
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['generator-legal-archive', orgId],
    queryFn: async () => {
      if (!orgId) return [];

      // Fetch recycling reports linked to generator's shipments
      const { data: reports, error: reportsError } = await supabase
        .from('recycling_reports')
        .select('id, report_number, created_at, shipment_id')
        .order('created_at', { ascending: false })
        .limit(50);

      if (reportsError) throw reportsError;

      // Get shipment details for the reports
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

      // Filter reports to only those belonging to this generator
      const filteredReports = (reports || []).filter((r: any) => shipmentsMap[r.shipment_id]);

      if (reportsError) throw reportsError;

      // Fetch invoices for this generator
      const invoicesQuery = supabase
        .from('invoices')
        .select('id, invoice_number, created_at, status, total_amount');
      const { data: invoices, error: invoicesError } = await (invoicesQuery as any)
        .eq('client_organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (invoicesError) throw invoicesError;

      const docs: any[] = [];

      filteredReports.forEach((r: any) => {
        const shipment = shipmentsMap[r.shipment_id];
        docs.push({
          id: r.id,
          type: 'disposal_certificate',
          number: r.report_number,
          date: r.created_at,
          shipment_number: shipment?.shipment_number,
          waste_type: shipment?.waste_type,
        });
      });

      (invoices || []).forEach((inv: any) => {
        docs.push({
          id: inv.id,
          type: 'invoice',
          number: inv.invoice_number,
          date: inv.created_at,
          amount: inv.total_amount,
          status: inv.status,
        });
      });

      // Sort by date descending
      docs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      return docs;
    },
    enabled: !!orgId,
  });

  const filteredDocs = documents.filter((doc: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      doc.number?.toLowerCase().includes(q) ||
      doc.shipment_number?.toLowerCase().includes(q) ||
      doc.waste_type?.toLowerCase().includes(q) ||
      docTypeLabels[doc.type]?.includes(q)
    );
  });

  const handleDownload = (doc: any) => {
    toast.success(`جاري تحميل ${docTypeLabels[doc.type]} رقم ${doc.number}`);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 justify-end">
            <FolderArchive className="w-5 h-5" /> الأرشيف القانوني
          </CardTitle>
        </CardHeader>
        <CardContent><Skeleton className="h-32 w-full" /></CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-indigo-200 dark:border-indigo-800/40 bg-gradient-to-br from-indigo-50/50 to-background dark:from-indigo-950/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-[10px] gap-1">
            <Shield className="w-3 h-3" />
            {documents.length} مستند
          </Badge>
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <FolderArchive className="w-5 h-5 text-indigo-600" />
            الأرشيف القانوني
          </CardTitle>
        </div>
        <CardDescription className="text-right">شهادات التخلص والفواتير وبوليصات الشحن - جاهزة للتفتيش البيئي</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث في الأرشيف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-right text-sm h-9"
            dir="rtl"
          />
        </div>

        {filteredDocs.length === 0 ? (
          <p className="text-center text-muted-foreground py-6 text-sm">لا توجد مستندات</p>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {filteredDocs.map((doc: any) => (
              <div
                key={`${doc.type}-${doc.id}`}
                className="flex items-center justify-between p-2.5 rounded-lg border bg-card hover:shadow-sm transition-shadow"
              >
                <Button variant="ghost" size="sm" className="text-xs h-7 gap-1 px-2" onClick={() => handleDownload(doc)}>
                  <Download className="w-3.5 h-3.5" />
                  تحميل
                </Button>
                <div className="flex items-center gap-2 text-right">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-[9px] ${docTypeColors[doc.type] || ''}`}>
                        {docTypeLabels[doc.type] || doc.type}
                      </Badge>
                      <span className="text-sm font-medium">{doc.number}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {format(new Date(doc.date), 'dd MMM yyyy', { locale: ar })}
                      {doc.shipment_number && ` • شحنة ${doc.shipment_number}`}
                      {doc.waste_type && ` • ${doc.waste_type}`}
                    </p>
                  </div>
                  <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LegalArchiveWidget;
