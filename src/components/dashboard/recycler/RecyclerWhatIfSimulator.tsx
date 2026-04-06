import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const scenarios = [
  { question: 'ماذا لو أضفنا خط إنتاج سادس؟', impact: '+18% إنتاج', cost: '2.5M ج.م', roi: '14 شهر', risk: 'متوسط' },
  { question: 'ماذا لو رفعنا سعر PET بنسبة 10%؟', impact: '+850K ج.م/سنة', cost: 'صفر', roi: 'فوري', risk: 'فقدان 5% عملاء' },
  { question: 'ماذا لو وظّفنا وردية ثالثة؟', impact: '+33% طاقة', cost: '480K ج.م/شهر', roi: '8 أشهر', risk: 'منخفض' },
  { question: 'ماذا لو استوردنا كسّارة جديدة؟', impact: '+25% سرعة', cost: '1.8M ج.م', roi: '11 شهر', risk: 'منخفض' },
];

const RecyclerWhatIfSimulator = () => {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Lightbulb className="h-5 w-5 text-primary" />
          محاكي "ماذا لو؟"
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {scenarios.map((s, i) => (
          <div key={i}>
            <Button
              variant={selected === i ? 'default' : 'outline'}
              className="w-full justify-start text-right text-sm h-auto py-2"
              onClick={() => setSelected(selected === i ? null : i)}
            >
              <Lightbulb className="h-4 w-4 ml-2 shrink-0" />
              {s.question}
            </Button>
            {selected === i && (
              <div className="mt-2 p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <ArrowRight className="h-3 w-3 text-primary" />
                  <span>الأثر: <strong className="text-green-600">{s.impact}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowRight className="h-3 w-3 text-primary" />
                  <span>التكلفة: <strong>{s.cost}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowRight className="h-3 w-3 text-primary" />
                  <span>فترة الاسترداد: <strong>{s.roi}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowRight className="h-3 w-3 text-primary" />
                  <span>المخاطر: <strong className="text-yellow-600">{s.risk}</strong></span>
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default RecyclerWhatIfSimulator;
