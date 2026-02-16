import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, FileText, Loader2, CheckCircle, AlertTriangle, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

const GovernmentReportingPanel = () => {
  const { organization } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportType, setReportType] = useState('quarterly');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');

  const { data: reports = [], refetch } = useQuery({
    queryKey: ['gov-reports', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from('government_reports')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const generateReport = async () => {
    if (!organization?.id || !periodStart || !periodEnd) {
      toast.error('يرجى تحديد الفترة');
      return;
    }
    setIsGenerating(true);
    try {
      const { data } = await supabase.functions.invoke('government-reporting', {
        body: { organizationId: organization.id, reportType, periodStart, periodEnd },
      });
      if (data?.success) {
        toast.success('تم إنشاء التقرير بنجاح');
        refetch();
      } else {
        toast.error(data?.error || 'فشل في إنشاء التقرير');
      }
    } catch {
      toast.error('خطأ في إنشاء التقرير');
    } finally {
      setIsGenerating(false);
    }
  };

  const statusColors: Record<string, string> = {
    draft: 'bg-muted text-muted-foreground',
    submitted: 'bg-blue-500/10 text-blue-600',
    approved: 'bg-emerald-500/10 text-emerald-600',
    rejected: 'bg-destructive/10 text-destructive',
  };

  const statusLabels: Record<string, string> = {
    draft: 'مسودة',
    submitted: 'مُرسل',
    approved: 'مقبول',
    rejected: 'مرفوض',
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="w-5 h-5 text-primary" />
            البوابة الحكومية - التقارير التنظيمية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue placeholder="نوع التقرير" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quarterly">ربع سنوي</SelectItem>
                <SelectItem value="monthly">شهري</SelectItem>
                <SelectItem value="annual">سنوي</SelectItem>
                <SelectItem value="incident">حوادث</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} placeholder="من" />
            <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} placeholder="إلى" />
            <Button onClick={generateReport} disabled={isGenerating} className="w-full">
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <FileText className="w-4 h-4 ml-2" />}
              إنشاء تقرير
            </Button>
          </div>
        </CardContent>
      </Card>

      {reports.length > 0 && (
        <div className="space-y-3">
          {reports.map((report: any) => (
            <Card key={report.id} className="border">
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="font-semibold">
                        تقرير {report.report_type === 'quarterly' ? 'ربع سنوي' : report.report_type === 'monthly' ? 'شهري' : 'سنوي'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{report.report_period}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={statusColors[report.status]}>
                      {statusLabels[report.status] || report.status}
                    </Badge>
                    {report.compliance_score && (
                      <Badge variant="outline" className={report.compliance_score >= 80 ? 'text-emerald-600' : 'text-amber-600'}>
                        {report.compliance_score}% امتثال
                      </Badge>
                    )}
                  </div>
                </div>

                {report.summary && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                    <div className="p-2 bg-muted/50 rounded-lg">
                      <p className="text-lg font-bold">{report.summary.totalShipments || 0}</p>
                      <p className="text-xs text-muted-foreground">شحنة</p>
                    </div>
                    <div className="p-2 bg-muted/50 rounded-lg">
                      <p className="text-lg font-bold">{report.summary.totalWeight?.toFixed(1) || 0}</p>
                      <p className="text-xs text-muted-foreground">طن</p>
                    </div>
                    <div className="p-2 bg-muted/50 rounded-lg">
                      <p className="text-lg font-bold">{report.summary.totalSavings || 0}</p>
                      <p className="text-xs text-muted-foreground">توفير CO₂</p>
                    </div>
                    <div className="p-2 bg-muted/50 rounded-lg">
                      <p className="text-lg font-bold">{report.summary.incidentCount || 0}</p>
                      <p className="text-xs text-muted-foreground">حوادث</p>
                    </div>
                  </div>
                )}

                {report.issues_found?.length > 0 && (
                  <div className="space-y-1">
                    {report.issues_found.map((issue: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        {issue.type === 'critical' ? <AlertTriangle className="w-3 h-3 text-destructive" /> : <CheckCircle className="w-3 h-3 text-amber-500" />}
                        <span>{issue.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default GovernmentReportingPanel;
