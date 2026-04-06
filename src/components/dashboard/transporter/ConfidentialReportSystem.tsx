import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, Send, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { toast } from 'sonner';

export default function ConfidentialReportSystem() {
  const [report, setReport] = useState('');

  const submit = () => {
    if (!report.trim()) return;
    toast.success('تم إرسال البلاغ بسرية تامة');
    setReport('');
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldAlert className="w-5 h-5 text-primary" />
          نظام البلاغات السرية
        </CardTitle>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Lock className="w-3 h-3" /> البلاغات مشفرة ومجهولة الهوية
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          placeholder="صِف المخالفة أو الخطر بالتفصيل..."
          value={report}
          onChange={e => setReport(e.target.value)}
          className="min-h-20 text-sm"
          dir="rtl"
        />
        <div className="flex gap-2">
          <Button onClick={submit} disabled={!report.trim()} className="flex-1 gap-1" size="sm">
            <Send className="w-3.5 h-3.5" /> إرسال بلاغ سري
          </Button>
        </div>
        <div className="p-2 rounded bg-muted/50 text-[10px] text-muted-foreground">
          <strong>أنواع البلاغات:</strong> مخالفة سلامة • تلاعب بالأوزان • سلوك خطر • تسريب مواد • فساد إداري
        </div>
      </CardContent>
    </Card>
  );
}
