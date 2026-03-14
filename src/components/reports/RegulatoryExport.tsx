import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { createWorkbook, jsonToSheet, writeFile as writeExcel } from '@/lib/excelExport';
// jsPDF loaded dynamically
import {
  Download,
  FileText,
  FileSpreadsheet,
  Loader2,
  Calendar as CalendarIcon,
  Shield,
  Building2,
} from 'lucide-react';

type ReportType = 'wmra_manifest' | 'waste_register' | 'transporter_compliance' | 'environmental_summary';

const reportTypes: { value: ReportType; label: string; description: string }[] = [
  { value: 'wmra_manifest', label: 'سجل المانيفست (WMRA)', description: 'سجل جميع المانيفستات للفترة المحددة' },
  { value: 'waste_register', label: 'سجل المخلفات الخطرة', description: 'تقرير وفقاً لقانون 202/2020' },
  { value: 'transporter_compliance', label: 'تقرير امتثال الناقلين', description: 'حالة التراخيص والمركبات' },
  { value: 'environmental_summary', label: 'الملخص البيئي', description: 'إحصائيات بيئية شاملة للتفتيش' },
];

const RegulatoryExport = () => {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState<ReportType>('wmra_manifest');
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [exportFormat, setExportFormat] = useState<'excel' | 'pdf'>('excel');

  const fetchShipmentData = async () => {
    let query = supabase
      .from('shipments')
      .select(`
        shipment_number, status, waste_type, waste_description, quantity, unit,
        pickup_address, delivery_address, created_at, pickup_date,
        actual_pickup_date, actual_delivery_date, hazard_level,
        manual_driver_name, manual_vehicle_plate, notes,
        generator:organizations!shipments_generator_id_fkey(name, client_code),
        transporter:organizations!shipments_transporter_id_fkey(name, client_code),
        recycler:organizations!shipments_recycler_id_fkey(name, client_code)
      `)
      .order('created_at', { ascending: false });

    if (fromDate) query = query.gte('created_at', fromDate.toISOString());
    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      query = query.lte('created_at', end.toISOString());
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  };

  const exportExcel = async () => {
    setLoading(true);
    try {
      const shipments = await fetchShipmentData();

      const statusLabels: Record<string, string> = {
        new: 'جديدة', approved: 'معتمدة', in_transit: 'في الطريق',
        delivered: 'تم التسليم', confirmed: 'مكتمل',
      };

      let rows: Record<string, any>[];

      if (reportType === 'wmra_manifest') {
        rows = shipments.map((s: any, i: number) => ({
          'م': i + 1,
          'رقم المانيفست': s.shipment_number,
          'التاريخ': s.created_at?.split('T')[0],
          'الجهة المولدة': s.generator?.name || '-',
          'كود المولد': s.generator?.client_code || '-',
          'شركة النقل': s.transporter?.name || '-',
          'جهة الاستلام': s.recycler?.name || '-',
          'نوع المخلف': s.waste_description || s.waste_type,
          'مستوى الخطورة': s.hazard_level === 'hazardous' ? 'خطر' : 'غير خطر',
          'الكمية': s.quantity,
          'الوحدة': s.unit,
          'السائق': s.manual_driver_name || '-',
          'رقم المركبة': s.manual_vehicle_plate || '-',
          'الحالة': statusLabels[s.status] || s.status,
          'موقع الاستلام': s.pickup_address || '-',
          'موقع التسليم': s.delivery_address || '-',
        }));
      } else if (reportType === 'waste_register') {
        rows = shipments
          .filter((s: any) => s.hazard_level === 'hazardous')
          .map((s: any, i: number) => ({
            'م': i + 1,
            'رقم المانيفست': s.shipment_number,
            'التاريخ': s.created_at?.split('T')[0],
            'نوع المخلف الخطر': s.waste_description || s.waste_type,
            'الكمية (كجم)': s.quantity,
            'المولد': s.generator?.name || '-',
            'الناقل': s.transporter?.name || '-',
            'المعالج/المدور': s.recycler?.name || '-',
            'طريقة التخلص': '-',
            'ملاحظات': s.notes || '-',
          }));
      } else {
        rows = shipments.map((s: any, i: number) => ({
          'م': i + 1,
          'رقم الشحنة': s.shipment_number,
          'التاريخ': s.created_at?.split('T')[0],
          'النوع': s.waste_description || s.waste_type,
          'الكمية': s.quantity,
          'الحالة': statusLabels[s.status] || s.status,
        }));
      }

      const wb = createWorkbook();
      const sheetName = reportTypes.find(r => r.value === reportType)?.label || 'تقرير';
      jsonToSheet(wb, rows, sheetName);

      const dateStr = new Date().toISOString().split('T')[0];
      await writeExcel(wb, `${sheetName}_${dateStr}.xlsx`);
      toast.success(`✅ تم تصدير ${rows.length} سجل بنجاح`);
    } catch (err: any) {
      console.error('Export error:', err);
      toast.error('فشل في التصدير');
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = async () => {
    setLoading(true);
    try {
      const shipments = await fetchShipmentData();
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      
      // Simple PDF with summary
      doc.setFont('helvetica');
      doc.setFontSize(16);
      doc.text('Waste Management Regulatory Report', 148, 20, { align: 'center' });
      
      doc.setFontSize(10);
      const dateRange = `${fromDate ? format(fromDate, 'yyyy-MM-dd') : 'All'} to ${toDate ? format(toDate, 'yyyy-MM-dd') : 'Present'}`;
      doc.text(`Period: ${dateRange}`, 148, 30, { align: 'center' });
      doc.text(`Generated: ${new Date().toISOString().split('T')[0]}`, 148, 36, { align: 'center' });
      doc.text(`Report Type: ${reportTypes.find(r => r.value === reportType)?.label}`, 148, 42, { align: 'center' });

      // Summary stats
      const total = shipments.length;
      const hazardous = shipments.filter((s: any) => s.hazard_level === 'hazardous').length;
      const completed = shipments.filter((s: any) => ['confirmed', 'delivered'].includes(s.status)).length;
      const totalQty = shipments.reduce((sum: number, s: any) => sum + (s.quantity || 0), 0);

      doc.setFontSize(12);
      let y = 55;
      doc.text(`Total Shipments: ${total}`, 20, y);
      doc.text(`Hazardous: ${hazardous}`, 100, y);
      doc.text(`Completed: ${completed}`, 180, y);
      doc.text(`Total Quantity: ${totalQty.toLocaleString()} kg`, 20, y + 8);

      // Table header
      y = 75;
      doc.setFontSize(8);
      const headers = ['#', 'Manifest No.', 'Date', 'Waste Type', 'Qty', 'Generator', 'Transporter', 'Status'];
      const colWidths = [8, 30, 22, 45, 15, 50, 50, 20];
      let x = 10;
      
      doc.setFillColor(220, 220, 220);
      doc.rect(10, y - 4, 277, 6, 'F');
      headers.forEach((h, i) => {
        doc.text(h, x + 1, y);
        x += colWidths[i];
      });

      // Table rows
      y += 6;
      const statusMap: Record<string, string> = {
        new: 'New', approved: 'Approved', in_transit: 'In Transit',
        delivered: 'Delivered', confirmed: 'Completed',
      };

      shipments.slice(0, 40).forEach((s: any, i: number) => {
        if (y > 195) {
          doc.addPage();
          y = 20;
        }
        x = 10;
        const row = [
          String(i + 1),
          s.shipment_number || '-',
          s.created_at?.split('T')[0] || '-',
          (s.waste_description || s.waste_type || '-').substring(0, 30),
          String(s.quantity || 0),
          (s.generator as any)?.name?.substring(0, 30) || '-',
          (s.transporter as any)?.name?.substring(0, 30) || '-',
          statusMap[s.status] || s.status,
        ];
        row.forEach((cell, ci) => {
          doc.text(cell, x + 1, y);
          x += colWidths[ci];
        });
        y += 5;
      });

      // Footer
      doc.setFontSize(7);
      doc.text('This report is generated by the Waste Management Platform for regulatory compliance purposes.', 148, 200, { align: 'center' });

      const dateStr = new Date().toISOString().split('T')[0];
      doc.save(`regulatory_report_${dateStr}.pdf`);
      toast.success('✅ تم تصدير التقرير بصيغة PDF');
    } catch (err) {
      console.error('PDF export error:', err);
      toast.error('فشل في تصدير PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (exportFormat === 'excel') exportExcel();
    else exportPDF();
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="text-right">
        <CardTitle className="flex items-center gap-2 justify-end">
          <Shield className="w-5 h-5 text-primary" />
          تصدير تقارير الامتثال التنظيمي
        </CardTitle>
        <CardDescription>
          تقارير جاهزة لتقديمها لجهاز تنظيم إدارة المخلفات (WMRA) عند التفتيش
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Report Type */}
          <div className="space-y-2 text-right">
            <Label>نوع التقرير</Label>
            <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {reportTypes.map(rt => (
                  <SelectItem key={rt.value} value={rt.value}>
                    <div className="text-right">
                      <p>{rt.label}</p>
                      <p className="text-xs text-muted-foreground">{rt.description}</p>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* From Date */}
          <div className="space-y-2 text-right">
            <Label>من تاريخ</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-right", !fromDate && "text-muted-foreground")}>
                  <CalendarIcon className="ml-2 h-4 w-4" />
                  {fromDate ? format(fromDate, "PPP", { locale: ar }) : "اختر"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={fromDate} onSelect={setFromDate} className="pointer-events-auto" /></PopoverContent>
            </Popover>
          </div>

          {/* To Date */}
          <div className="space-y-2 text-right">
            <Label>إلى تاريخ</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-right", !toDate && "text-muted-foreground")}>
                  <CalendarIcon className="ml-2 h-4 w-4" />
                  {toDate ? format(toDate, "PPP", { locale: ar }) : "اختر"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={toDate} onSelect={setToDate} className="pointer-events-auto" /></PopoverContent>
            </Popover>
          </div>

          {/* Format */}
          <div className="space-y-2 text-right">
            <Label>صيغة التصدير</Label>
            <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as 'excel' | 'pdf')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excel">
                  <span className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4" /> Excel (.xlsx)
                  </span>
                </SelectItem>
                <SelectItem value="pdf">
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4" /> PDF
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-3 justify-end pt-2 border-t">
          <Badge variant="outline" className="gap-1">
            <Building2 className="w-3 h-3" />
            متوافق مع WMRA
          </Badge>
          <Button onClick={handleExport} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            تصدير التقرير
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RegulatoryExport;
