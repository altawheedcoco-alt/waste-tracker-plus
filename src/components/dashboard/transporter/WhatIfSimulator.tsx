import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, TrendingUp, Truck, DollarSign, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

const scenarios = [
  {
    question: 'ماذا لو أضفنا 3 مركبات جديدة؟',
    impact: [
      { metric: 'الطاقة الاستيعابية', change: '+40%', positive: true },
      { metric: 'التكاليف الشهرية', change: '+35,000 ج.م', positive: false },
      { metric: 'الإيرادات المتوقعة', change: '+55,000 ج.م', positive: true },
      { metric: 'العائد على الاستثمار', change: '8 أشهر', positive: true },
    ],
  },
  {
    question: 'ماذا لو خسرنا أكبر عميل؟',
    impact: [
      { metric: 'الإيرادات', change: '-30%', positive: false },
      { metric: 'استغلال الأسطول', change: '-25%', positive: false },
      { metric: 'هامش الربح', change: '-12%', positive: false },
      { metric: 'نقطة التعادل', change: '+45 يوم', positive: false },
    ],
  },
];

export default function WhatIfSimulator() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <HelpCircle className="w-5 h-5 text-primary" />
          نظام السيناريوهات (What-if)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {scenarios.map((s, i) => (
          <div key={i} className="p-3 rounded-lg border">
            <p className="text-sm font-semibold mb-2">❓ {s.question}</p>
            <div className="grid grid-cols-2 gap-1.5">
              {s.impact.map((imp, j) => (
                <div key={j} className={`p-1.5 rounded text-center text-[10px] ${imp.positive ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                  <p className="font-bold">{imp.change}</p>
                  <p className="text-muted-foreground">{imp.metric}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
