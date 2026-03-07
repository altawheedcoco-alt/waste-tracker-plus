import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExportToolbarProps {
  data: Record<string, unknown>[];
  filename?: string;
  title?: string;
}

const ExportToolbar = ({ data, filename = 'report', title = 'تصدير التقرير' }: ExportToolbarProps) => {
  const { toast } = useToast();
  const [format, setFormat] = useState<'csv' | 'pdf'>('csv');
  const [isExporting, setIsExporting] = useState(false);

  const exportCSV = () => {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const bom = '\uFEFF';
    const csvContent = bom + [
      headers.join(','),
      ...data.map(row => headers.map(h => {
        const val = String(row[h] ?? '');
        return val.includes(',') || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'landscape' });
    
    doc.setFontSize(16);
    doc.text(title, 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString('ar-EG')}`, 14, 28);

    if (data.length) {
      const headers = Object.keys(data[0]);
      const startY = 35;
      const colWidth = (doc.internal.pageSize.width - 28) / headers.length;

      // Headers
      doc.setFillColor(13, 148, 136);
      doc.rect(14, startY, doc.internal.pageSize.width - 28, 8, 'F');
      doc.setTextColor(255);
      doc.setFontSize(8);
      headers.forEach((h, i) => {
        doc.text(h, 16 + i * colWidth, startY + 5.5);
      });

      // Rows
      doc.setTextColor(0);
      data.slice(0, 50).forEach((row, ri) => {
        const y = startY + 10 + ri * 7;
        if (y > doc.internal.pageSize.height - 20) return;
        if (ri % 2 === 0) {
          doc.setFillColor(245, 245, 245);
          doc.rect(14, y - 2, doc.internal.pageSize.width - 28, 7, 'F');
        }
        headers.forEach((h, ci) => {
          doc.text(String(row[h] ?? '').substring(0, 25), 16 + ci * colWidth, y + 3);
        });
      });
    }

    doc.save(`${filename}_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const handleExport = async () => {
    if (!data.length) {
      toast({ title: 'لا توجد بيانات', description: 'لا توجد بيانات للتصدير', variant: 'destructive' });
      return;
    }
    setIsExporting(true);
    try {
      if (format === 'csv') exportCSV();
      else await exportPDF();
      toast({ title: 'تم التصدير', description: `تم تصدير التقرير بصيغة ${format.toUpperCase()}` });
    } catch (err) {
      toast({ title: 'خطأ', description: 'فشل التصدير', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={format} onValueChange={(v) => setFormat(v as 'csv' | 'pdf')}>
        <SelectTrigger className="w-28 h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="csv">
            <span className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" /> CSV
            </span>
          </SelectItem>
          <SelectItem value="pdf">
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4" /> PDF
            </span>
          </SelectItem>
        </SelectContent>
      </Select>
      <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting}>
        {isExporting ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Download className="w-4 h-4 ml-2" />}
        تصدير
      </Button>
    </div>
  );
};

export default ExportToolbar;
