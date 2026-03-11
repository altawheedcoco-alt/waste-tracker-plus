import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, Sparkles, CheckCircle2, XCircle, Clock, Lightbulb, TrendingUp, AlertTriangle } from 'lucide-react';
import { useSovereignGovernance } from '@/hooks/useSovereignGovernance';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const RISK_COLORS: Record<string, string> = {
  low: 'text-emerald-500 bg-emerald-500/10',
  medium: 'text-amber-500 bg-amber-500/10',
  high: 'text-red-500 bg-red-500/10',
  critical: 'text-red-700 bg-red-700/10',
};

const DECISION_TYPES: Record<string, { icon: any; label: string }> = {
  risk_assessment: { icon: AlertTriangle, label: 'تقييم مخاطر' },
  optimization: { icon: TrendingUp, label: 'تحسين العمليات' },
  compliance_review: { icon: Sparkles, label: 'مراجعة امتثال' },
  forecast: { icon: Lightbulb, label: 'توقع استباقي' },
};

const AICommandCenter = () => {
  const { decisions, alerts, unresolvedAlerts } = useSovereignGovernance();
  const [analyzing, setAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sovereign-ai-analyze', {
        body: {
          unresolvedAlerts: unresolvedAlerts.length,
          alertCategories: unresolvedAlerts.map(a => a.category),
        },
      });
      if (error) throw error;
      toast.success('تم توليد التحليل الذكي بنجاح');
    } catch (err) {
      console.error('AI analysis error:', err);
      toast.error('فشل التحليل — تأكد من تفعيل الخدمة');
    } finally {
      setAnalyzing(false);
    }
  };

  const pendingDecisions = decisions.filter(d => d.status === 'pending');
  const acceptedDecisions = decisions.filter(d => d.status === 'accepted');

  const handleAccept = async (id: string) => {
    const { error } = await supabase.from('ai_sovereign_decisions').update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
    } as any).eq('id', id);
    if (!error) toast.success('تم قبول التوصية');
  };

  const handleReject = async (id: string) => {
    const { error } = await supabase.from('ai_sovereign_decisions').update({
      status: 'rejected',
    } as any).eq('id', id);
    if (!error) toast.success('تم رفض التوصية');
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-bold">مركز القرار الذكي</h3>
        </div>
        <Button onClick={handleAnalyze} disabled={analyzing} size="sm" className="bg-gradient-to-l from-purple-600 to-blue-600">
          <Sparkles className="w-4 h-4 ml-1" />
          {analyzing ? 'جاري التحليل...' : 'تحليل ذكي'}
        </Button>
      </div>

      {/* AI Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-purple-500/5 border-purple-500/20">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-purple-500">{decisions.length}</div>
            <p className="text-xs text-muted-foreground">إجمالي القرارات</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-amber-500">{pendingDecisions.length}</div>
            <p className="text-xs text-muted-foreground">بانتظار المراجعة</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-500/5 border-emerald-500/20">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-emerald-500">{acceptedDecisions.length}</div>
            <p className="text-xs text-muted-foreground">تم قبولها</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Decisions */}
      {pendingDecisions.length > 0 && (
        <Card className="border-amber-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              توصيات بانتظار المراجعة ({pendingDecisions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingDecisions.map(d => {
              const riskCls = RISK_COLORS[d.risk_level] || RISK_COLORS.medium;
              const dt = DECISION_TYPES[d.decision_type];
              const DtIcon = dt?.icon || Lightbulb;
              return (
                <div key={d.id} className="p-4 rounded-lg border border-border/50 bg-muted/20 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      <DtIcon className="w-4 h-4 mt-0.5 text-purple-500" />
                      <div>
                        <p className="text-sm font-medium">{d.title}</p>
                        <Badge variant="outline" className={`text-[10px] mt-1 ${riskCls}`}>
                          خطورة: {d.risk_level}
                        </Badge>
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(d.created_at), 'dd/MM HH:mm', { locale: ar })}
                    </span>
                  </div>
                  
                  {d.analysis && (
                    <p className="text-xs text-muted-foreground bg-background/50 p-2 rounded">{d.analysis}</p>
                  )}
                  
                  {d.recommendations && Array.isArray(d.recommendations) && d.recommendations.length > 0 && (
                    <div className="bg-primary/5 p-2 rounded">
                      <p className="text-xs font-medium mb-1">التوصيات:</p>
                      <ul className="text-xs space-y-0.5">
                        {(d.recommendations as string[]).map((r, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <Sparkles className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1" onClick={() => handleAccept(d.id)}>
                      <CheckCircle2 className="w-3 h-3 ml-1" /> قبول
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => handleReject(d.id)}>
                      <XCircle className="w-3 h-3 ml-1" /> رفض
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* All Decisions History */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">سجل القرارات</CardTitle>
        </CardHeader>
        <CardContent>
          {decisions.length === 0 ? (
            <div className="text-center py-6">
              <Brain className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">اضغط "تحليل ذكي" لتوليد أول توصية</p>
            </div>
          ) : (
            <div className="space-y-1">
              {decisions.slice(0, 10).map(d => (
                <div key={d.id} className="flex items-center justify-between p-2 rounded bg-muted/20 text-xs">
                  <div className="flex items-center gap-2">
                    {d.status === 'accepted' && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                    {d.status === 'rejected' && <XCircle className="w-3 h-3 text-red-500" />}
                    {d.status === 'pending' && <Clock className="w-3 h-3 text-amber-500" />}
                    <span className="truncate max-w-[200px]">{d.title}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{d.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AICommandCenter;
