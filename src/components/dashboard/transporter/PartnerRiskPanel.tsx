import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ShieldAlert, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Loader2, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

interface RiskScore {
  id: string;
  partner_name: string;
  risk_score: number;
  risk_level: string;
  payment_score: number;
  delivery_score: number;
  compliance_score: number;
  reliability_score: number;
  total_shipments: number;
  delayed_shipments: number;
  avg_payment_days: number;
  risk_factors: any[];
  recommendations: any[];
  calculated_at: string;
}

const riskColors: Record<string, string> = {
  low: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  medium: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  high: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
  critical: 'bg-destructive/10 text-destructive border-destructive/30',
};

const riskLabels: Record<string, string> = {
  low: 'منخفض',
  medium: 'متوسط',
  high: 'مرتفع',
  critical: 'حرج',
};

const PartnerRiskPanel = () => {
  const { organization } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { data: riskScores = [], refetch } = useQuery({
    queryKey: ['partner-risk-scores', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from('partner_risk_scores')
        .select('*')
        .eq('organization_id', organization.id)
        .order('risk_score', { ascending: true });
      return (data || []) as RiskScore[];
    },
    enabled: !!organization?.id,
  });

  const analyzeAllPartners = async () => {
    if (!organization?.id) return;
    setIsAnalyzing(true);
    try {
      const { data: partners } = await supabase
        .from('external_partners')
        .select('id, name')
        .eq('organization_id', organization.id)
        .limit(20);

      if (!partners?.length) {
        toast.info('لا يوجد شركاء لتحليلهم');
        return;
      }

      for (const partner of partners) {
        const { data } = await supabase.functions.invoke('partner-risk-analyzer', {
          body: { organizationId: organization.id, partnerId: partner.id, partnerType: 'external' },
        });

        if (data?.success) {
          await supabase.from('partner_risk_scores').upsert({
            organization_id: organization.id,
            external_partner_id: partner.id,
            partner_name: partner.name,
            ...data,
            calculated_at: new Date().toISOString(),
          }, { onConflict: 'organization_id,external_partner_id' });
        }
      }

      toast.success(`تم تحليل ${partners.length} شريك`);
      refetch();
    } catch (err) {
      toast.error('فشل في تحليل الشركاء');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const ScoreBar = ({ label, score }: { label: string; score: number }) => (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{score}%</span>
      </div>
      <Progress value={score} className="h-1.5" />
    </div>
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldAlert className="w-5 h-5 text-primary" />
            تحليل مخاطر الشركاء
          </CardTitle>
          <Button onClick={analyzeAllPartners} disabled={isAnalyzing} size="sm">
            {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Users className="w-4 h-4 ml-2" />}
            تحليل الشركاء
          </Button>
        </CardHeader>
        <CardContent>
          {riskScores.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>اضغط "تحليل الشركاء" لبدء تقييم المخاطر</p>
            </div>
          ) : (
            <div className="space-y-4">
              {riskScores.map((score) => (
                <Card key={score.id} className="border">
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {score.risk_level === 'low' ? <CheckCircle className="w-4 h-4 text-emerald-500" /> :
                         score.risk_level === 'critical' ? <AlertTriangle className="w-4 h-4 text-destructive" /> :
                         <TrendingDown className="w-4 h-4 text-amber-500" />}
                        <span className="font-semibold">{score.partner_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">{score.risk_score}</span>
                        <Badge variant="outline" className={riskColors[score.risk_level]}>
                          {riskLabels[score.risk_level]}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <ScoreBar label="الدفع" score={score.payment_score} />
                      <ScoreBar label="التسليم" score={score.delivery_score} />
                      <ScoreBar label="الامتثال" score={score.compliance_score} />
                      <ScoreBar label="الموثوقية" score={score.reliability_score} />
                    </div>

                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span>{score.total_shipments} شحنة</span>
                      <span>•</span>
                      <span>{score.avg_payment_days} يوم سداد</span>
                      <span>•</span>
                      <span>{score.delayed_shipments} تأخير</span>
                    </div>

                    {score.risk_factors?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {score.risk_factors.map((f: any, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {f.factor}: {f.value}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PartnerRiskPanel;
