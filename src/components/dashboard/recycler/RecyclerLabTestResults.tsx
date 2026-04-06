import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FlaskConical, CheckCircle, XCircle } from 'lucide-react';

const tests = [
  { id: 'LAB-301', batch: 'B-2024-0891', test: 'اختبار الشد', result: '42 MPa', standard: '>35 MPa', pass: true },
  { id: 'LAB-302', batch: 'B-2024-0891', test: 'مؤشر الانصهار (MFI)', result: '8.2 g/10min', standard: '7-12', pass: true },
  { id: 'LAB-303', batch: 'B-2024-0892', test: 'نسبة الرطوبة', result: '0.8%', standard: '<1%', pass: true },
  { id: 'LAB-304', batch: 'B-2024-0893', test: 'اختبار اللون', result: 'مقبول', standard: 'ΔE<2', pass: true },
  { id: 'LAB-305', batch: 'B-2024-0893', test: 'معادن ثقيلة', result: '2.1 ppm', standard: '<1 ppm', pass: false },
];

const RecyclerLabTestResults = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        <FlaskConical className="h-5 w-5 text-primary" />
        نتائج اختبارات المعمل
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {tests.map((t) => (
        <div key={t.id} className="flex items-center justify-between p-2 rounded border">
          <div className="flex items-center gap-2">
            {t.pass ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-destructive" />}
            <div>
              <p className="text-sm font-medium">{t.test}</p>
              <p className="text-xs text-muted-foreground">{t.batch} • المعيار: {t.standard}</p>
            </div>
          </div>
          <div className="text-left">
            <Badge variant="outline" className={t.pass ? 'bg-green-500/10 text-green-600 border-green-500/30' : 'bg-destructive/10 text-destructive border-destructive/30'}>
              {t.result}
            </Badge>
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
);

export default RecyclerLabTestResults;
