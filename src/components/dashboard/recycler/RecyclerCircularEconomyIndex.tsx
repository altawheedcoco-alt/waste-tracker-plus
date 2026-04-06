import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Recycle, ArrowRight } from 'lucide-react';

const flows = [
  { input: 'نفايات بلاستيكية', inputQty: '120 طن', output: 'حبيبات قابلة للتصنيع', outputQty: '96 طن', circularity: 80 },
  { input: 'ورق مستعمل', inputQty: '200 طن', output: 'لب ورقي معاد', outputQty: '170 طن', circularity: 85 },
  { input: 'خردة معدنية', inputQty: '150 طن', output: 'سبائك نظيفة', outputQty: '143 طن', circularity: 95 },
  { input: 'زجاج مكسور', inputQty: '60 طن', output: 'كسر زجاجي مصنّف', outputQty: '54 طن', circularity: 90 },
];

const RecyclerCircularEconomyIndex = () => {
  const avgCircularity = Math.round(flows.reduce((s, f) => s + f.circularity, 0) / flows.length);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Recycle className="h-5 w-5 text-primary" />
          مؤشر الاقتصاد الدائري
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-center p-4 rounded-lg bg-primary/5 border border-primary/20">
          <p className="text-4xl font-bold text-primary">{avgCircularity}%</p>
          <p className="text-sm text-muted-foreground">معدل الدورانية الإجمالي</p>
        </div>
        {flows.map((f, i) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded border text-xs">
            <div className="flex-1">
              <p className="font-medium">{f.input}</p>
              <p className="text-muted-foreground">{f.inputQty}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-primary shrink-0" />
            <div className="flex-1 text-left">
              <p className="font-medium">{f.output}</p>
              <p className="text-muted-foreground">{f.outputQty}</p>
            </div>
            <span className="font-bold text-primary">{f.circularity}%</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default RecyclerCircularEconomyIndex;
