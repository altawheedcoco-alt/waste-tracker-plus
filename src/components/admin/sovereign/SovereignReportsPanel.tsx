import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Sparkles, Download, CheckCircle2, Eye } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const REPORT_TYPES = [
  { value: 'daily', label: 'تقرير يومي' },
  { value: 'weekly', label: 'تقرير أسبوعي' },
  { value: 'monthly', label: 'تقرير شهري' },
  { value: 'compliance', label: 'تقرير امتثال' },
  { value: 'financial', label: 'تقرير مالي' },
];

const SovereignReportsPanel = () => {
  const qc = useQueryClient();
  const [reportType, setReportType] = useState('weekly');
  const [generating, setGenerating] = useState(false);
  const [viewReport, setViewReport] = useState<any>(null);

  const { data: reports } = useQuery({
    queryKey: ['sovereign-reports'],
    queryFn: async () => {
      const { data, error } = await supabase.from('sovereign_reports').select('*').order('created_at', { ascending: false }).limit(20);
      if (error) throw error;
      return data || [];
    },
  });

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('sovereign-ai-report', {
        body: { report_type: reportType },
      });
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['sovereign-reports'] });
      toast.success('تم توليد التقرير بنجاح');
    } catch (err) {
      console.error(err);
      toast.error('فشل توليد التقرير');
    } finally {
      setGenerating(false);
    }
  };

  const publishedCount = reports?.filter((r: any) => r.status === 'published').length || 0;
  const draftCount = reports?.filter((r: any) => r.status === 'draft').length || 0;

  const exportCSV = () => {
    if (!reports || reports.length === 0) return;
    const headers = ['العنوان', 'النوع', 'الحالة', 'الملخص', 'التاريخ'];
    const rows = reports.map((r: any) => [
      r.title,
      REPORT_TYPES.find(rt => rt.value === r.report_type)?.label || r.report_type,
      r.status,
      (r.summary || '').replace(/,/g, ' '),
      format(new Date(r.created_at), 'yyyy-MM-dd HH:mm'),
    ]);
    const csv = '\uFEFF' + [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sovereign-reports-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold">التقارير السيادية الذكية</h3>
        </div>
        <div className="flex items-center gap-2">
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {REPORT_TYPES.map(rt => <SelectItem key={rt.value} value={rt.value}>{rt.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleGenerate} disabled={generating} className="bg-gradient-to-l from-purple-600 to-blue-600">
            <Sparkles className="w-4 h-4 ml-1" />
            {generating ? 'جاري التوليد...' : 'توليد تقرير'}
          </Button>
          <Button size="sm" variant="outline" onClick={exportCSV} disabled={!reports || reports.length === 0}>
            <Download className="w-4 h-4 ml-1" />تصدير
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-3 text-center">
          <div className="text-xl font-bold">{reports?.length || 0}</div>
          <p className="text-[10px] text-muted-foreground">إجمالي التقارير</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <div className="text-xl font-bold text-emerald-500">{publishedCount}</div>
          <p className="text-[10px] text-muted-foreground">منشورة</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <div className="text-xl font-bold text-amber-500">{draftCount}</div>
          <p className="text-[10px] text-muted-foreground">مسودات</p>
        </CardContent></Card>
      </div>

      {/* Reports List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">التقارير المولّدة</CardTitle>
        </CardHeader>
        <CardContent>
          {(!reports || reports.length === 0) ? (
            <div className="text-center py-6">
              <FileText className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">اضغط "توليد تقرير" لإنشاء أول تقرير ذكي</p>
            </div>
          ) : (
            <div className="space-y-2">
              {reports.map((report: any) => (
                <div key={report.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{report.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[10px]">
                          {REPORT_TYPES.find(rt => rt.value === report.report_type)?.label || report.report_type}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(report.created_at), 'dd MMM yyyy', { locale: ar })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="ghost" onClick={() => setViewReport(report)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent dir="rtl" className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{report.title}</DialogTitle>
                      </DialogHeader>
                      {report.summary && (
                        <div className="bg-primary/5 p-3 rounded-lg">
                          <p className="text-xs font-medium mb-1">الملخص التنفيذي:</p>
                          <p className="text-sm">{report.summary}</p>
                        </div>
                      )}
                      {report.content && (
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <ReactMarkdown>{report.content}</ReactMarkdown>
                        </div>
                      )}
                      {report.recommendations && Array.isArray(report.recommendations) && report.recommendations.length > 0 && (
                        <div className="bg-amber-500/5 p-3 rounded-lg">
                          <p className="text-xs font-medium mb-1">التوصيات:</p>
                          <ul className="text-xs space-y-1">
                            {(report.recommendations as string[]).map((r, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <Sparkles className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                                <span>{r}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SovereignReportsPanel;
