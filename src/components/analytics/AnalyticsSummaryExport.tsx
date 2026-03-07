import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText, Printer, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface AnalyticsSummaryExportProps {
  organizationId: string | null;
  dateRange: { from: Date; to: Date };
}

const AnalyticsSummaryExport = ({ organizationId, dateRange }: AnalyticsSummaryExportProps) => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const fetchData = async () => {
    if (!organizationId) return [];

    const { data: shipments } = await supabase
      .from('shipments')
      .select('id, status, waste_type, quantity, created_at, pickup_location')
      .or(`generator_id.eq.${organizationId},transporter_id.eq.${organizationId},recycler_id.eq.${organizationId}`)
      .gte('created_at', dateRange.from.toISOString())
      .lte('created_at', dateRange.to.toISOString())
      .order('created_at', { ascending: false });

    return (shipments || []).map(s => ({
      'رقم الشحنة': s.id.slice(0, 8),
      'الحالة': s.status,
      'نوع النفايات': s.waste_type || '-',
      'الكمية (كجم)': s.quantity || 0,
      'موقع الاستلام': s.pickup_location || '-',
      'تاريخ الإنشاء': format(new Date(s.created_at), 'dd/MM/yyyy', { locale: ar }),
    }));
  };

  const exportCSV = async () => {
    const data = await fetchData();
    if (!data.length) {
      toast({ title: 'لا توجد بيانات', variant: 'destructive' });
      return;
    }

    const headers = Object.keys(data[0]);
    const bom = '\uFEFF';
    const csv = bom + [
      headers.join(','),
      ...data.map(row => headers.map(h => {
        const val = String((row as any)[h] ?? '');
        return val.includes(',') || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics_${format(dateRange.from, 'yyyy-MM-dd')}_${format(dateRange.to, 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = async () => {
    const data = await fetchData();
    if (!data.length) {
      toast({ title: 'لا توجد بيانات', variant: 'destructive' });
      return;
    }

    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'landscape' });

    doc.setFontSize(18);
    doc.text('تقرير التحليلات المتقدمة', 14, 20);
    doc.setFontSize(10);
    doc.text(`الفترة: ${format(dateRange.from, 'dd/MM/yyyy')} - ${format(dateRange.to, 'dd/MM/yyyy')}`, 14, 28);
    doc.text(`عدد السجلات: ${data.length}`, 14, 34);

    const headers = Object.keys(data[0]);
    const startY = 42;
    const colWidth = (doc.internal.pageSize.width - 28) / headers.length;

    doc.setFillColor(13, 148, 136);
    doc.rect(14, startY, doc.internal.pageSize.width - 28, 8, 'F');
    doc.setTextColor(255);
    doc.setFontSize(7);
    headers.forEach((h, i) => doc.text(h, 16 + i * colWidth, startY + 5.5));

    doc.setTextColor(0);
    data.slice(0, 40).forEach((row, ri) => {
      const y = startY + 10 + ri * 6;
      if (y > doc.internal.pageSize.height - 15) return;
      if (ri % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(14, y - 2, doc.internal.pageSize.width - 28, 6, 'F');
      }
      headers.forEach((h, ci) => {
        doc.text(String((row as any)[h] ?? '').substring(0, 20), 16 + ci * colWidth, y + 3);
      });
    });

    doc.save(`analytics_${format(dateRange.from, 'yyyy-MM-dd')}.pdf`);
  };

  const printReport = () => {
    window.print();
  };

  const handleExport = async (type: 'csv' | 'pdf' | 'print') => {
    setIsExporting(true);
    try {
      if (type === 'csv') await exportCSV();
      else if (type === 'pdf') await exportPDF();
      else printReport();
      if (type !== 'print') toast({ title: 'تم التصدير بنجاح' });
    } catch {
      toast({ title: 'خطأ في التصدير', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isExporting}>
          {isExporting ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Download className="h-4 w-4 ml-2" />}
          تصدير
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          <FileSpreadsheet className="h-4 w-4 ml-2" />
          تصدير CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('pdf')}>
          <FileText className="h-4 w-4 ml-2" />
          تصدير PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('print')}>
          <Printer className="h-4 w-4 ml-2" />
          طباعة التقرير
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AnalyticsSummaryExport;
