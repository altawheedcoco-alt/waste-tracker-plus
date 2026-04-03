/**
 * PDFReportGenerator — أداة تصدير تقارير PDF احترافية
 * يولد تقارير شاملة مع رسوم بيانية وإحصائيات
 */
import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  FileDown, FileText, Loader2, BarChart3, Truck, Users,
  Leaf, Receipt, Calendar, Building2, CheckCircle2
} from 'lucide-react';
import jsPDF from 'jspdf';

interface ReportSection {
  id: string;
  label: string;
  icon: typeof FileText;
  description: string;
}

const reportSections: ReportSection[] = [
  { id: 'overview', label: 'نظرة عامة', icon: BarChart3, description: 'ملخص تنفيذي للنشاط' },
  { id: 'shipments', label: 'الشحنات', icon: Truck, description: 'إحصائيات وتفاصيل الشحنات' },
  { id: 'financial', label: 'المالية', icon: Receipt, description: 'الإيرادات والمصروفات' },
  { id: 'partners', label: 'الشركاء', icon: Users, description: 'بيانات الشركاء والتعاملات' },
  { id: 'environmental', label: 'البيئة', icon: Leaf, description: 'مؤشرات الأثر البيئي' },
];

const periodOptions = [
  { value: 'week', label: 'آخر أسبوع' },
  { value: 'month', label: 'هذا الشهر' },
  { value: 'quarter', label: 'هذا الربع' },
  { value: 'year', label: 'هذا العام' },
];

export default function PDFReportGenerator() {
  const { organization, user } = useAuth();
  const { toast } = useToast();
  const [period, setPeriod] = useState('month');
  const [selectedSections, setSelectedSections] = useState<string[]>(['overview', 'shipments', 'environmental']);
  const [generating, setGenerating] = useState(false);

  const toggleSection = (id: string) => {
    setSelectedSections(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const fetchReportData = useCallback(async () => {
    if (!organization?.id) return null;
    const now = new Date();
    let fromDate: string;
    switch (period) {
      case 'week': fromDate = new Date(now.getTime() - 7 * 86400000).toISOString(); break;
      case 'quarter': fromDate = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString(); break;
      case 'year': fromDate = new Date(now.getFullYear(), 0, 1).toISOString(); break;
      default: fromDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    }
    const orgId = organization.id;

    const [shipmentsRes, ledgerRes, partnersRes] = await Promise.all([
      supabase.from('shipments')
        .select('id, status, quantity, unit, waste_type, created_at')
        .or(`generator_id.eq.${orgId},transporter_id.eq.${orgId},recycler_id.eq.${orgId},disposal_facility_id.eq.${orgId}`)
        .gte('created_at', fromDate),
      supabase.from('accounting_ledger')
        .select('amount, entry_type, entry_category')
        .eq('organization_id', orgId)
        .gte('created_at', fromDate),
      supabase.from('organization_partners')
        .select('id, status')
        .or(`organization_id.eq.${orgId},partner_organization_id.eq.${orgId}`),
    ]);

    const shipments = shipmentsRes.data || [];
    const ledger = ledgerRes.data || [];
    const partners = partnersRes.data || [];

    const totalShipments = shipments.length;
    const completed = shipments.filter(s => ['delivered', 'confirmed'].includes(s.status)).length;
    const totalTons = shipments.reduce((sum, s) => {
      const q = s.quantity || 0;
      return sum + (s.unit === 'kg' ? q / 1000 : q);
    }, 0);
    const income = ledger.filter(l => l.entry_type === 'credit').reduce((s, l) => s + l.amount, 0);
    const expense = ledger.filter(l => l.entry_type === 'debit').reduce((s, l) => s + l.amount, 0);

    const wasteBreakdown: Record<string, number> = {};
    shipments.forEach(s => {
      const wt = s.waste_type || 'أخرى';
      const q = s.quantity || 0;
      wasteBreakdown[wt] = (wasteBreakdown[wt] || 0) + (s.unit === 'kg' ? q / 1000 : q);
    });

    return {
      totalShipments, completed, completionRate: totalShipments > 0 ? Math.round((completed / totalShipments) * 100) : 0,
      totalTons: Math.round(totalTons * 100) / 100,
      income: Math.round(income), expense: Math.round(expense), net: Math.round(income - expense),
      activePartners: partners.filter(p => p.status === 'active').length,
      totalPartners: partners.length,
      wasteBreakdown,
      co2Saved: Math.round(totalTons * 0.8 * 100) / 100,
    };
  }, [organization?.id, period]);

  const generatePDF = useCallback(async () => {
    setGenerating(true);
    try {
      const data = await fetchReportData();
      if (!data) throw new Error('لا توجد بيانات');

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      let y = 20;

      // Header
      doc.setFontSize(22);
      doc.setTextColor(34, 139, 34);
      doc.text('iRecycle', pageW / 2, y, { align: 'center' });
      y += 10;
      doc.setFontSize(14);
      doc.setTextColor(60, 60, 60);
      doc.text('Performance Report', pageW / 2, y, { align: 'center' });
      y += 8;
      doc.setFontSize(9);
      doc.setTextColor(130, 130, 130);
      doc.text(`${organization?.name || 'Organization'} | ${new Date().toLocaleDateString('ar-EG')}`, pageW / 2, y, { align: 'center' });
      y += 4;
      doc.setDrawColor(34, 139, 34);
      doc.setLineWidth(0.5);
      doc.line(20, y, pageW - 20, y);
      y += 12;

      // Overview section
      if (selectedSections.includes('overview')) {
        doc.setFontSize(13);
        doc.setTextColor(30, 30, 30);
        doc.text('Executive Summary', 20, y);
        y += 8;

        const metrics = [
          ['Total Shipments', `${data.totalShipments}`],
          ['Completion Rate', `${data.completionRate}%`],
          ['Total Tonnage', `${data.totalTons} tons`],
          ['Net Revenue', `${data.net.toLocaleString()} EGP`],
        ];
        doc.setFontSize(10);
        metrics.forEach(([label, value]) => {
          doc.setTextColor(100, 100, 100);
          doc.text(label, 25, y);
          doc.setTextColor(30, 30, 30);
          doc.text(value, 110, y);
          y += 7;
        });
        y += 6;
      }

      // Shipments
      if (selectedSections.includes('shipments')) {
        doc.setFontSize(13);
        doc.setTextColor(30, 30, 30);
        doc.text('Shipment Analytics', 20, y);
        y += 8;
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Completed: ${data.completed} / ${data.totalShipments}`, 25, y);
        y += 7;
        doc.text(`Total Weight: ${data.totalTons} tons`, 25, y);
        y += 7;
        doc.text('Waste Breakdown:', 25, y);
        y += 7;
        Object.entries(data.wasteBreakdown).forEach(([type, tons]) => {
          doc.text(`  - ${type}: ${(tons as number).toFixed(2)} tons`, 30, y);
          y += 6;
        });
        y += 6;
      }

      // Financial
      if (selectedSections.includes('financial')) {
        doc.setFontSize(13);
        doc.setTextColor(30, 30, 30);
        doc.text('Financial Summary', 20, y);
        y += 8;
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Income: ${data.income.toLocaleString()} EGP`, 25, y); y += 7;
        doc.text(`Expenses: ${data.expense.toLocaleString()} EGP`, 25, y); y += 7;
        doc.setTextColor(data.net >= 0 ? 34 : 200, data.net >= 0 ? 139 : 50, data.net >= 0 ? 34 : 50);
        doc.text(`Net: ${data.net.toLocaleString()} EGP`, 25, y);
        y += 12;
      }

      // Partners
      if (selectedSections.includes('partners')) {
        doc.setFontSize(13);
        doc.setTextColor(30, 30, 30);
        doc.text('Partners Overview', 20, y);
        y += 8;
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Active Partners: ${data.activePartners}`, 25, y); y += 7;
        doc.text(`Total Partners: ${data.totalPartners}`, 25, y);
        y += 12;
      }

      // Environmental
      if (selectedSections.includes('environmental')) {
        doc.setFontSize(13);
        doc.setTextColor(30, 30, 30);
        doc.text('Environmental Impact', 20, y);
        y += 8;
        doc.setFontSize(10);
        doc.setTextColor(34, 139, 34);
        doc.text(`CO2 Saved: ${data.co2Saved} tons`, 25, y); y += 7;
        doc.text(`Waste Diverted: ${data.totalTons} tons`, 25, y); y += 7;
        doc.text(`Trees Equivalent: ${Math.round(data.co2Saved / 0.022)}`, 25, y);
        y += 12;
      }

      // Footer
      const pageH = doc.internal.pageSize.getHeight();
      doc.setFontSize(8);
      doc.setTextColor(170, 170, 170);
      doc.text('Generated by iRecycle Platform', pageW / 2, pageH - 10, { align: 'center' });

      doc.save(`iRecycle_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast({ title: 'تم التصدير', description: 'تم تحميل التقرير بنجاح' });
    } catch (err) {
      console.error(err);
      toast({ title: 'خطأ', description: 'فشل إنشاء التقرير', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  }, [fetchReportData, selectedSections, organization?.name, toast]);

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileDown className="h-5 w-5 text-primary" />
          تصدير تقرير PDF احترافي
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Period select */}
        <div className="space-y-1.5">
          <Label className="text-sm">الفترة الزمنية</Label>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {periodOptions.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Sections */}
        <div className="space-y-2">
          <Label className="text-sm">أقسام التقرير</Label>
          {reportSections.map(section => {
            const Icon = section.icon;
            const checked = selectedSections.includes(section.id);
            return (
              <div
                key={section.id}
                className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                  checked ? 'bg-primary/5 border border-primary/20' : 'bg-muted/30 border border-transparent hover:bg-muted/50'
                }`}
                onClick={() => toggleSection(section.id)}
              >
                <Checkbox checked={checked} className="pointer-events-none" />
                <Icon className={`h-4 w-4 ${checked ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{section.label}</p>
                  <p className="text-[11px] text-muted-foreground">{section.description}</p>
                </div>
                {checked && <CheckCircle2 className="h-4 w-4 text-primary" />}
              </div>
            );
          })}
        </div>

        <Button
          className="w-full"
          onClick={generatePDF}
          disabled={generating || selectedSections.length === 0}
        >
          {generating ? (
            <><Loader2 className="h-4 w-4 animate-spin ml-2" /> جاري الإنشاء...</>
          ) : (
            <><FileDown className="h-4 w-4 ml-2" /> تصدير التقرير</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
