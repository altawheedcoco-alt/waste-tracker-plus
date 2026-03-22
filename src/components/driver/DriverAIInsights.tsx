/**
 * لوحة التحليل الذكي بالـ AI — تقرير شامل لأداء السائق
 */
import { useState } from 'react';
import { useDriverType } from '@/hooks/useDriverType';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Brain, Loader2, RefreshCw, TrendingUp, Target,
  Shield, Lightbulb, AlertTriangle, Award,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

interface DriverAIInsightsProps {
  driverId: string;
}

interface AnalysisResult {
  analysis: string;
  stats: {
    totalShipments: number;
    completed: number;
    cancelled: number;
    completionRate: number;
    avgRating: number;
    totalRatings: number;
    totalBids: number;
    acceptedBids: number;
    balance: number;
    totalEarned: number;
  };
}

const DriverAIInsights = ({ driverId }: DriverAIInsightsProps) => {
  const { toast } = useToast();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('driver-ai-analysis', {
        body: { driver_id: driverId },
      });
      if (error) throw error;
      setResult(data);
    } catch (e: any) {
      console.error(e);
      toast({
        title: 'فشل التحليل',
        description: e?.message || 'حدث خطأ أثناء التحليل',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!result && !loading) {
    return (
      <Card className="border-dashed border-primary/30">
        <CardContent className="p-8 text-center space-y-4">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring' }}
          >
            <Brain className="h-16 w-16 mx-auto text-primary/40" />
          </motion.div>
          <div>
            <h3 className="font-bold text-base mb-1">تحليل ذكي لأدائك</h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              سيقوم الذكاء الاصطناعي بتحليل شحناتك وتقييماتك ومزايداتك وأرباحك
              لتقديم تقرير شامل مع توصيات عملية
            </p>
          </div>
          <Button onClick={analyze} className="gap-2">
            <Brain className="w-4 h-4" />
            ابدأ التحليل
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center space-y-4">
          <Loader2 className="h-10 w-10 mx-auto animate-spin text-primary" />
          <div>
            <h3 className="font-semibold text-sm">جاري التحليل...</h3>
            <p className="text-xs text-muted-foreground mt-1">يتم تحليل بياناتك بالذكاء الاصطناعي</p>
          </div>
          <div className="space-y-2 max-w-xs mx-auto">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!result) return null;

  return (
    <div className="space-y-4">
      {/* Quick Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {[
          { icon: Target, label: 'إتمام', value: `${result.stats.completionRate}%` },
          { icon: Award, label: 'تقييم', value: result.stats.avgRating > 0 ? `${result.stats.avgRating}` : '—' },
          { icon: TrendingUp, label: 'رحلات', value: String(result.stats.completed) },
          { icon: Shield, label: 'مزايدات', value: String(result.stats.totalBids) },
          { icon: Lightbulb, label: 'مقبولة', value: String(result.stats.acceptedBids) },
          { icon: AlertTriangle, label: 'ملغية', value: String(result.stats.cancelled) },
        ].map(({ icon: Icon, label, value }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-2 rounded-lg bg-card border border-border/50 text-center"
          >
            <Icon className="w-3.5 h-3.5 mx-auto mb-0.5 text-primary" />
            <p className="text-sm font-bold">{value}</p>
            <p className="text-[9px] text-muted-foreground">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* AI Analysis Report */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary" />
                تقرير الذكاء الاصطناعي
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={analyze} disabled={loading} className="h-7 text-xs gap-1">
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                تحديث
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed" dir="rtl">
              <ReactMarkdown>{result.analysis}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Financial Summary */}
      <Card className="bg-gradient-to-br from-card to-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">إجمالي الأرباح</p>
              <p className="text-xl font-bold">{result.stats.totalEarned.toLocaleString()} <span className="text-xs font-normal">ج.م</span></p>
            </div>
            <div className="text-left">
              <p className="text-xs text-muted-foreground">الرصيد الحالي</p>
              <p className="text-xl font-bold text-primary">{result.stats.balance.toLocaleString()} <span className="text-xs font-normal">ج.م</span></p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DriverAIInsights;
