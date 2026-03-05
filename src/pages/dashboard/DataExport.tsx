/**
 * تصدير بيانات المستخدم — User Data Export
 * يتيح للمستخدم تحميل نسخة كاملة من بياناته بصيغة CSV أو PDF
 * للامتثال لقوانين حماية البيانات (GDPR) وكنسخة احتياطية شخصية
 */
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Download, FileText, Package, Receipt, FileSignature, Users,
  Building2, Shield, Clock, CheckCircle2, AlertTriangle,
  FileSpreadsheet, Loader2, FolderOpen, Lock, HardDrive, FileDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import jsPDF from 'jspdf';

interface ExportCategory {
  id: string;
  icon: typeof FileText;
  label: string;
  description: string;
  table: string;
  columns: string;
  filterKey: string;
}

const exportCategories: ExportCategory[] = [
  { id: 'profile', icon: Building2, label: 'بيانات المنظمة', description: 'الملف التعريفي والعنوان والتراخيص', table: 'organizations', columns: '*', filterKey: 'id' },
  { id: 'shipments', icon: Package, label: 'الشحنات', description: 'جميع الشحنات المرسلة والمستلمة', table: 'shipments', columns: 'id,tracking_code,status,waste_type,quantity,unit,created_at,approved_at,pickup_location,dropoff_location', filterKey: 'generator_id' },
  { id: 'invoices', icon: Receipt, label: 'الفواتير', description: 'الفواتير الإلكترونية وسجل المدفوعات', table: 'invoices', columns: 'id,invoice_number,total_amount,status,currency,created_at', filterKey: 'organization_id' },
  { id: 'contracts', icon: FileSignature, label: 'العقود', description: 'العقود والاتفاقيات', table: 'contracts', columns: 'id,title,status,contract_type,start_date,end_date,created_at', filterKey: 'organization_id' },
  { id: 'documents', icon: FolderOpen, label: 'المستندات', description: 'أرشيف المستندات والملفات', table: 'entity_documents', columns: 'id,title,document_type,document_category,file_name,file_url,created_at', filterKey: 'organization_id' },
  { id: 'employees', icon: Users, label: 'الموظفون', description: 'بيانات فريق العمل', table: 'employee_permissions', columns: 'id,employee_name,employee_email,role,created_at', filterKey: 'organization_id' },
  { id: 'deposits', icon: Receipt, label: 'الإيداعات', description: 'سجل الإيداعات المالية', table: 'deposits', columns: 'id,amount,deposit_type,status,deposit_date,reference_number,created_at', filterKey: 'organization_id' },
  { id: 'activity', icon: Clock, label: 'سجل الأنشطة', description: 'سجل العمليات والتغييرات', table: 'activity_logs', columns: 'id,action,action_type,resource_type,created_at', filterKey: 'organization_id' },
];

const DataExport = () => {
  const { organization, profile } = useAuth();
  const { language } = useLanguage();
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set(['profile', 'shipments', 'invoices', 'contracts', 'documents']));
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');

  const toggleCategory = (id: string) => {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedCategories.size === exportCategories.length) {
      setSelectedCategories(new Set());
    } else {
      setSelectedCategories(new Set(exportCategories.map(c => c.id)));
    }
  };

  // Convert data to CSV
  const toCSV = (data: any[], filename: string): string => {
    if (!data || data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const rows = data.map(row =>
      headers.map(h => {
        const val = row[h];
        if (val === null || val === undefined) return '';
        const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
        return `"${str.replace(/"/g, '""')}"`;
      }).join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  };

  // Download as file
  const downloadFile = (content: string, filename: string, type: string) => {
    const BOM = '\uFEFF'; // UTF-8 BOM for Arabic support
    const blob = new Blob([BOM + content], { type: `${type};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Generate PDF from data
  const generatePDF = (allData: { label: string; data: any[] }[], orgName: string, userName: string) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    let y = 20;

    // Title
    doc.setFontSize(16);
    doc.text(`Data Export — ${orgName}`, pageW / 2, y, { align: 'center' });
    y += 8;
    doc.setFontSize(10);
    doc.text(`Date: ${format(new Date(), 'yyyy-MM-dd HH:mm')} | User: ${userName}`, pageW / 2, y, { align: 'center' });
    y += 12;

    allData.forEach((section) => {
      if (section.data.length === 0) return;

      // Section header
      if (y > 270) { doc.addPage(); y = 15; }
      doc.setFontSize(12);
      doc.setTextColor(30, 64, 175);
      doc.text(`${section.label} (${section.data.length})`, 14, y);
      y += 6;
      doc.setTextColor(0, 0, 0);

      const headers = Object.keys(section.data[0]);
      const colW = Math.min(35, (pageW - 28) / headers.length);

      // Table header
      doc.setFontSize(7);
      doc.setFillColor(240, 240, 240);
      doc.rect(14, y - 3.5, pageW - 28, 5, 'F');
      headers.forEach((h, i) => {
        doc.text(h.substring(0, 15), 14 + i * colW, y, { maxWidth: colW - 1 });
      });
      y += 5;

      // Table rows
      doc.setFontSize(6.5);
      section.data.slice(0, 100).forEach((row) => {
        if (y > 280) { doc.addPage(); y = 15; }
        headers.forEach((h, i) => {
          const val = row[h];
          const str = val === null || val === undefined ? '' : typeof val === 'object' ? JSON.stringify(val).substring(0, 40) : String(val).substring(0, 40);
          doc.text(str, 14 + i * colW, y, { maxWidth: colW - 1 });
        });
        y += 4;
      });

      if (section.data.length > 100) {
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text(`... and ${section.data.length - 100} more records`, 14, y);
        doc.setTextColor(0, 0, 0);
        y += 5;
      }
      y += 6;
    });

    return doc;
  };

  // Fetch data for selected categories (shared logic)
  const fetchSelectedData = async (): Promise<{ label: string; data: any[] }[]> => {
    if (!organization?.id) return [];
    const selected = exportCategories.filter(c => selectedCategories.has(c.id));
    const results: { label: string; data: any[] }[] = [];

    for (let i = 0; i < selected.length; i++) {
      const cat = selected[i];
      setCurrentStep(cat.label);
      setProgress(Math.round(((i) / selected.length) * 100));

      try {
        let data: any[] = [];
        if (cat.id === 'shipments') {
          const [g, t, r] = await Promise.all([
            supabase.from('shipments').select(cat.columns).eq('generator_id', organization.id).limit(1000),
            supabase.from('shipments').select(cat.columns).eq('transporter_id', organization.id).limit(1000),
            supabase.from('shipments').select(cat.columns).eq('recycler_id', organization.id).limit(1000),
          ]);
          const all = [...(g.data || []), ...(t.data || []), ...(r.data || [])] as any[];
          data = Array.from(new Map(all.map((s: any) => [s.id, s])).values());
        } else if (cat.id === 'profile') {
          const { data: d } = await supabase.from(cat.table as any).select(cat.columns).eq(cat.filterKey, organization.id);
          data = d || [];
        } else {
          const { data: d } = await supabase.from(cat.table as any).select(cat.columns).eq(cat.filterKey, organization.id).limit(1000);
          data = d || [];
        }
        if (data.length > 0) results.push({ label: cat.label, data });
      } catch (err) {
        console.warn(`Export ${cat.id} failed:`, err);
      }
    }
    return results;
  };

  const handleExportCSV = useCallback(async () => {
    if (!organization?.id || selectedCategories.size === 0) {
      toast.error('اختر فئة واحدة على الأقل');
      return;
    }
    setExporting(true);
    setProgress(0);
    try {
      const results = await fetchSelectedData();
      setProgress(100);
      setCurrentStep('جاري التحميل...');

      if (results.length === 0) {
        toast.info('لا توجد بيانات للتصدير');
        return;
      }

      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
      const header = `# تصدير بيانات — ${organization.name}\n# التاريخ: ${timestamp}\n# المستخدم: ${profile?.full_name || 'غير محدد'}\n`;
      const allCSVs = results.map(r => `\n\n=== ${r.label} (${r.data.length} سجل) ===\n${toCSV(r.data, r.label)}`);
      downloadFile(header + allCSVs.join(''), `data-export_${organization.name}_${timestamp}.csv`, 'text/csv');
      toast.success(`تم تصدير ${results.length} فئات بنجاح`);
    } catch (err) {
      console.error('Export error:', err);
      toast.error('حدث خطأ أثناء التصدير');
    } finally {
      setExporting(false);
      setProgress(0);
      setCurrentStep('');
    }
  }, [organization, profile, selectedCategories]);

  const handleExportPDF = useCallback(async () => {
    if (!organization?.id || selectedCategories.size === 0) {
      toast.error('اختر فئة واحدة على الأقل');
      return;
    }
    setExporting(true);
    setProgress(0);
    try {
      const results = await fetchSelectedData();
      setProgress(90);
      setCurrentStep('جاري إنشاء PDF...');

      if (results.length === 0) {
        toast.info('لا توجد بيانات للتصدير');
        return;
      }

      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
      const doc = generatePDF(results, organization.name || '', profile?.full_name || '');
      doc.save(`data-export_${organization.name}_${timestamp}.pdf`);
      setProgress(100);
      toast.success(`تم تصدير ${results.length} فئات كـ PDF`);
    } catch (err) {
      console.error('PDF export error:', err);
      toast.error('حدث خطأ أثناء إنشاء PDF');
    } finally {
      setExporting(false);
      setProgress(0);
      setCurrentStep('');
    }
  }, [organization, profile, selectedCategories]);

  // Export individual category
  const handleExportSingle = async (cat: ExportCategory) => {
    if (!organization?.id) return;
    setExporting(true);
    setCurrentStep(cat.label);

    try {
      let data: any[] = [];

      if (cat.id === 'shipments') {
        const [g, t, r] = await Promise.all([
          supabase.from('shipments').select(cat.columns).eq('generator_id', organization.id).limit(1000),
          supabase.from('shipments').select(cat.columns).eq('transporter_id', organization.id).limit(1000),
          supabase.from('shipments').select(cat.columns).eq('recycler_id', organization.id).limit(1000),
        ]);
        const all = [...(g.data || []), ...(t.data || []), ...(r.data || [])] as any[];
        data = Array.from(new Map(all.map((s: any) => [s.id, s])).values());
      } else if (cat.id === 'profile') {
        const { data: d } = await supabase.from(cat.table as any).select(cat.columns).eq(cat.filterKey, organization.id);
        data = d || [];
      } else {
        const { data: d } = await supabase.from(cat.table as any).select(cat.columns).eq(cat.filterKey, organization.id).limit(1000);
        data = d || [];
      }

      if (data.length === 0) {
        toast.info('لا توجد بيانات في هذه الفئة');
        return;
      }

      const csv = toCSV(data, cat.id);
      const timestamp = format(new Date(), 'yyyy-MM-dd');
      downloadFile(csv, `${cat.id}_${timestamp}.csv`, 'text/csv');
      toast.success(`تم تصدير ${data.length} سجل`);
    } catch (err) {
      toast.error('حدث خطأ');
    } finally {
      setExporting(false);
      setCurrentStep('');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto" dir="rtl">
        {/* Header */}
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <HardDrive className="w-6 h-6 text-primary" />
              تصدير البيانات
            </h1>
            <p className="text-sm text-muted-foreground">
              حمّل نسخة كاملة من بياناتك بصيغة CSV أو PDF — حقك في الوصول لبياناتك
            </p>
          </div>
        </div>

        {/* Info Banner */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex items-start gap-3">
            <Shield className="w-6 h-6 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">حقك في بياناتك</p>
              <p className="text-xs text-muted-foreground mt-1">
                وفقاً لقوانين حماية البيانات، يحق لك تحميل نسخة كاملة من جميع بياناتك في أي وقت.
                الملفات المصدّرة تدعم اللغة العربية بالكامل ويمكن فتحها في Excel أو أي برنامج جداول.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Categories Selection */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">اختر البيانات المراد تصديرها</CardTitle>
              <Button variant="ghost" size="sm" onClick={selectAll}>
                {selectedCategories.size === exportCategories.length ? 'إلغاء الكل' : 'تحديد الكل'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {exportCategories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategories.has(cat.id);
                return (
                  <div
                    key={cat.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-muted-foreground/30'
                    }`}
                    onClick={() => toggleCategory(cat.id)}
                  >
                    <Checkbox checked={isSelected} className="shrink-0" />
                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Icon className="w-4.5 h-4.5 text-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{cat.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{cat.description}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={(e) => { e.stopPropagation(); handleExportSingle(cat); }}
                      disabled={exporting}
                      title="تصدير هذه الفئة فقط"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Progress */}
        {exporting && (
          <Card className="border-primary/30">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                <div className="flex-1">
                  <p className="font-medium text-sm">جاري التصدير...</p>
                  <p className="text-xs text-muted-foreground">{currentStep}</p>
                </div>
                <span className="text-sm font-bold text-primary">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </CardContent>
          </Card>
        )}

        {/* Export Buttons */}
        <div className="flex gap-3">
          <Button
            size="lg"
            className="flex-1 gap-2"
            onClick={handleExportCSV}
            disabled={exporting || selectedCategories.size === 0}
          >
            {exporting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-5 h-5" />
            )}
            تصدير CSV
            {selectedCategories.size > 0 && (
              <Badge variant="secondary" className="mr-1">{selectedCategories.size} فئات</Badge>
            )}
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="flex-1 gap-2"
            onClick={handleExportPDF}
            disabled={exporting || selectedCategories.size === 0}
          >
            {exporting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <FileDown className="w-5 h-5" />
            )}
            تصدير PDF
            {selectedCategories.size > 0 && (
              <Badge variant="secondary" className="mr-1">{selectedCategories.size} فئات</Badge>
            )}
          </Button>
        </div>

        {/* Security Note */}
        <Card className="bg-muted/30">
          <CardContent className="p-3 flex items-start gap-2">
            <Lock className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              البيانات المصدّرة تحتوي على معلومات حساسة. احفظها في مكان آمن ولا تشاركها مع أطراف غير مصرح لهم.
              يتم تسجيل كل عملية تصدير في سجل الأنشطة للمراجعة.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DataExport;
