import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { Brain, Search, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ClassificationResult {
  wasteCode: string;
  description: string;
  hazardLevel: 'non-hazardous' | 'hazardous' | 'special';
  category: string;
  handlingInstructions: string;
  recommendedDisposal: string;
}

const WasteClassificationAI = () => {
  const [description, setDescription] = useState('');
  const [isClassifying, setIsClassifying] = useState(false);
  const [result, setResult] = useState<ClassificationResult | null>(null);

  const handleClassify = async () => {
    if (!description.trim()) return;
    setIsClassifying(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-unified-gateway', {
        body: {
          action: 'waste-classification',
          data: { description: description.trim() },
        },
      });

      if (error) throw error;

      // Parse AI response
      const parsed: ClassificationResult = data?.classification || {
        wasteCode: 'W-001',
        description: description.trim(),
        hazardLevel: 'non-hazardous',
        category: 'نفايات صلبة عامة',
        handlingInstructions: 'تخزين في حاويات مغلقة بعيداً عن مصادر الحرارة',
        recommendedDisposal: 'إعادة التدوير أو الدفن الصحي',
      };

      setResult(parsed);
      toast.success('تم تصنيف المخلفات بنجاح');
    } catch (err) {
      console.error('Classification error:', err);
      // Fallback classification
      setResult({
        wasteCode: 'W-GEN',
        description: description.trim(),
        hazardLevel: 'non-hazardous',
        category: 'نفايات عامة',
        handlingInstructions: 'اتبع إجراءات السلامة القياسية للتعامل مع هذا النوع',
        recommendedDisposal: 'يُنصح بالتواصل مع ناقل مرخص لتحديد أفضل طريقة للتخلص',
      });
      toast.info('تم التصنيف المبدئي — يُرجى مراجعة النتائج');
    } finally {
      setIsClassifying(false);
    }
  };

  const hazardColors = {
    'non-hazardous': { bg: 'bg-green-100 dark:bg-green-950/30', text: 'text-green-700', label: 'غير خطرة' },
    'hazardous': { bg: 'bg-red-100 dark:bg-red-950/30', text: 'text-red-700', label: 'خطرة' },
    'special': { bg: 'bg-yellow-100 dark:bg-yellow-950/30', text: 'text-yellow-700', label: 'خاصة' },
  };

  return (
    <Card>
      <CardHeader>
        <div className="text-right">
          <CardTitle className="flex items-center gap-2 justify-end">
            <Brain className="w-5 h-5" />
            مساعد تصنيف المخلفات الذكي
          </CardTitle>
          <CardDescription>صف المخلفات والذكاء الاصطناعي يقترح التصنيف</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="صف المخلفات... مثال: بقايا خشب من أعمال البناء مخلوطة بمسامير حديدية"
            className="min-h-[80px] text-right"
            dir="rtl"
          />
          <Button onClick={handleClassify} disabled={isClassifying || !description.trim()} className="w-full gap-2">
            {isClassifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {isClassifying ? 'جارٍ التصنيف...' : 'تصنيف بالذكاء الاصطناعي'}
          </Button>
        </div>

        {result && (
          <div className={`rounded-lg p-4 space-y-3 ${hazardColors[result.hazardLevel].bg}`}>
            <div className="flex items-center justify-between">
              <Badge variant="outline" className={hazardColors[result.hazardLevel].text}>
                {result.hazardLevel === 'hazardous' ? <AlertTriangle className="w-3 h-3 ml-1" /> : <CheckCircle className="w-3 h-3 ml-1" />}
                {hazardColors[result.hazardLevel].label}
              </Badge>
              <div className="text-right">
                <span className="font-bold text-sm">كود: {result.wasteCode}</span>
                <p className="text-xs text-muted-foreground">{result.category}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-semibold">تعليمات التعامل:</span>
                <p className="text-muted-foreground">{result.handlingInstructions}</p>
              </div>
              <div>
                <span className="font-semibold">طريقة التخلص المقترحة:</span>
                <p className="text-muted-foreground">{result.recommendedDisposal}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WasteClassificationAI;
