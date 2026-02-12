import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, Loader2, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface AIInsight {
  type: 'warning' | 'opportunity' | 'recommendation';
  title: string;
  detail: string;
}

const TransporterAIInsights = () => {
  const { organization } = useAuth();
  const [insights, setInsights] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const generateInsights = async () => {
    if (!organization?.id) return;
    setIsLoading(true);
    setInsights('');

    try {
      // Fetch key data for analysis
      const [shipmentsRes, driversRes, kpisRes] = await Promise.all([
        supabase
          .from('shipments')
          .select('status, waste_type, quantity, created_at, delivered_at, expected_delivery_date')
          .eq('transporter_id', organization.id)
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('drivers')
          .select('id, is_available')
          .eq('organization_id', organization.id),
        supabase.rpc('get_transporter_kpis', { p_org_id: organization.id }),
      ]);

      const shipments = shipmentsRes.data || [];
      const drivers = driversRes.data || [];
      const kpis = kpisRes.data as any;

      const statusBreakdown: Record<string, number> = {};
      const wasteBreakdown: Record<string, number> = {};
      shipments.forEach(s => {
        statusBreakdown[s.status] = (statusBreakdown[s.status] || 0) + 1;
        wasteBreakdown[s.waste_type] = (wasteBreakdown[s.waste_type] || 0) + 1;
      });

      const prompt = `أنت محلل عمليات نقل نفايات متخصص. حلل بيانات شركة النقل التالية وقدم تقريراً موجزاً:

**بيانات الشحنات (آخر 100):**
- الإجمالي: ${shipments.length}
- توزيع الحالات: ${JSON.stringify(statusBreakdown)}
- أنواع النفايات: ${JSON.stringify(wasteBreakdown)}

**السائقون:**
- إجمالي: ${drivers.length}
- متاحون: ${drivers.filter(d => d.is_available).length}
- مشغولون: ${drivers.filter(d => !d.is_available).length}

**مؤشرات الأداء:**
- نسبة التسليم في الوقت: ${kpis?.onTimeRate || 0}%
- نسبة الإنجاز: ${kpis?.completionRate || 0}%
- متوسط أيام التسليم: ${kpis?.avgDeliveryDays || 0}
- الشحنات المتأخرة: ${kpis?.overdueShipments || 0}

قدم التحليل في 4 أقسام:
1. **📊 ملخص الأداء** - تقييم سريع
2. **⚠️ تنبيهات مهمة** - مشاكل تحتاج اهتمام فوري
3. **💡 فرص التحسين** - اقتراحات عملية
4. **📈 توقعات** - ماذا نتوقع الأسبوع القادم

كن مختصراً وعملياً. لا تتجاوز 300 كلمة.`;

      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          type: 'chat',
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (resp.status === 429) {
        toast.error('تم تجاوز حد الطلبات، حاول لاحقاً');
        setIsLoading(false);
        return;
      }
      if (resp.status === 402) {
        toast.error('يرجى إضافة رصيد لاستخدام الذكاء الاصطناعي');
        setIsLoading(false);
        return;
      }
      if (!resp.ok || !resp.body) throw new Error('فشل الاتصال');

      // Stream response
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              setInsights(fullText);
            }
          } catch { /* partial JSON */ }
        }
      }

      setHasGenerated(true);
    } catch (error) {
      console.error('AI insights error:', error);
      toast.error('حدث خطأ في تحليل البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Button
            onClick={generateInsights}
            disabled={isLoading}
            size="sm"
            className="gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {isLoading ? 'جاري التحليل...' : hasGenerated ? 'تحديث التحليل' : 'تحليل بالذكاء الاصطناعي'}
          </Button>
          <div className="text-right">
            <CardTitle className="flex items-center gap-2 justify-end">
              <Badge variant="secondary" className="text-xs gap-1">
                <Sparkles className="h-3 w-3" />
                AI
              </Badge>
              تحليلات ذكية
            </CardTitle>
            <CardDescription>تحليل تلقائي لأداء عمليات النقل</CardDescription>
          </div>
        </div>
      </CardHeader>
      {(insights || isLoading) && (
        <CardContent>
          {isLoading && !insights && (
            <div className="flex items-center justify-center py-8 gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-muted-foreground">جاري تحليل بيانات العمليات...</span>
            </div>
          )}
          {insights && (
            <div className="prose prose-sm dark:prose-invert max-w-none text-right" dir="rtl">
              <ReactMarkdown>{insights}</ReactMarkdown>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default TransporterAIInsights;
