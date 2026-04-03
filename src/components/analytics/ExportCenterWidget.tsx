/**
 * ExportCenterWidget — مركز التصدير والتقارير
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, FileSpreadsheet, FileText, Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ExportOption {
  id: string;
  label: string;
  description: string;
  icon: typeof FileText;
  format: string;
}

const EXPORT_OPTIONS: ExportOption[] = [
  { id: 'shipments', label: 'تقرير الشحنات', description: 'كل الشحنات مع التفاصيل', icon: FileText, format: 'CSV' },
  { id: 'financial', label: 'التقرير المالي', description: 'الإيرادات والمصروفات', icon: FileSpreadsheet, format: 'CSV' },
  { id: 'drivers', label: 'أداء السائقين', description: 'إحصائيات السائقين', icon: FileText, format: 'CSV' },
  { id: 'waste', label: 'تحليل المخلفات', description: 'أنواع وأوزان المخلفات', icon: FileText, format: 'CSV' },
];

export default function ExportCenterWidget() {
  const { organization } = useAuth();
  const { toast } = useToast();
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = async (optionId: string) => {
    if (!organization?.id) return;
    setExporting(optionId);

    try {
      let csvContent = '';
      const orgId = organization.id;

      if (optionId === 'shipments') {
        const { data } = await supabase
          .from('shipments')
          .select('shipment_number, status, waste_type, actual_weight, total_value, pickup_city, delivery_city, created_at')
          .or(`generator_id.eq.${orgId},recycler_id.eq.${orgId},transporter_id.eq.${orgId}`)
          .order('created_at', { ascending: false })
          .limit(500);

        csvContent = 'رقم الشحنة,الحالة,نوع المخلفات,الوزن (كجم),القيمة (ج.م),مدينة الاستلام,مدينة التسليم,التاريخ\n';
        (data || []).forEach(s => {
          csvContent += `${s.shipment_number},${s.status || ''},${s.waste_type || ''},${s.actual_weight || ''},${s.total_value || ''},${s.pickup_city || ''},${s.delivery_city || ''},${s.created_at || ''}\n`;
        });
      } else if (optionId === 'financial') {
        const { data } = await supabase
          .from('accounting_ledger')
          .select('entry_type, entry_category, amount, description, entry_date, reference_number')
          .eq('organization_id', orgId)
          .order('entry_date', { ascending: false })
          .limit(500);

        csvContent = 'النوع,الفئة,المبلغ,الوصف,التاريخ,المرجع\n';
        (data || []).forEach(l => {
          csvContent += `${l.entry_type},${l.entry_category},${l.amount},${(l.description || '').replace(/,/g, ' ')},${l.entry_date},${l.reference_number || ''}\n`;
        });
      } else if (optionId === 'waste') {
        const { data } = await supabase
          .from('shipments')
          .select('waste_type, actual_weight, status, created_at')
          .or(`generator_id.eq.${orgId},recycler_id.eq.${orgId},transporter_id.eq.${orgId}`)
          .not('waste_type', 'is', null)
          .order('created_at', { ascending: false })
          .limit(500);

        csvContent = 'نوع المخلفات,الوزن (كجم),الحالة,التاريخ\n';
        (data || []).forEach(s => {
          csvContent += `${s.waste_type},${s.actual_weight || 0},${s.status || ''},${s.created_at || ''}\n`;
        });
      } else {
        // drivers - use shipments with driver data
        const { data } = await supabase
          .from('shipments')
          .select('driver_id, status, actual_weight, created_at, delivered_at')
          .eq('transporter_id', orgId)
          .not('driver_id', 'is', null)
          .order('created_at', { ascending: false })
          .limit(500);

        csvContent = 'معرف السائق,الحالة,الوزن (كجم),تاريخ الإنشاء,تاريخ التسليم\n';
        (data || []).forEach(s => {
          csvContent += `${s.driver_id},${s.status || ''},${s.actual_weight || ''},${s.created_at || ''},${s.delivered_at || ''}\n`;
        });
      }

      // Download
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${optionId}_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast({ title: 'تم التصدير', description: 'تم تحميل الملف بنجاح' });
    } catch (err) {
      console.error(err);
      toast({ title: 'خطأ', description: 'فشل التصدير', variant: 'destructive' });
    } finally {
      setExporting(null);
    }
  };

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Download className="h-5 w-5 text-primary" />
          مركز التصدير
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {EXPORT_OPTIONS.map(opt => (
            <Button key={opt.id} variant="outline" className="h-auto flex-col items-start p-3 gap-1"
              disabled={!!exporting} onClick={() => handleExport(opt.id)}>
              <div className="flex items-center gap-2 w-full">
                {exporting === opt.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <opt.icon className="h-4 w-4 text-primary" />}
                <span className="text-xs font-medium">{opt.label}</span>
                <Badge variant="secondary" className="mr-auto text-[9px]">{opt.format}</Badge>
              </div>
              <p className="text-[10px] text-muted-foreground text-right w-full">{opt.description}</p>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
