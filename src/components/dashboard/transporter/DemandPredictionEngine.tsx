import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, Building2, TrendingUp, Calendar, MapPin, Lightbulb } from 'lucide-react';

interface DemandPrediction {
  clientName: string;
  wasteType: string;
  location: string;
  predictedDate: string;
  predictedVolume: number;
  confidence: number;
  reasoning: string;
  suggestedAction: string;
}

const MOCK_PREDICTIONS: DemandPrediction[] = [
  {
    clientName: 'مصنع الأهرام للمواد الغذائية',
    wasteType: 'نفايات عضوية', location: 'العاشر من رمضان',
    predictedDate: '2026-04-12', predictedVolume: 15,
    confidence: 91,
    reasoning: 'نمط دوري أسبوعي - ينتج 15 طن كل سبت بعد إنتاج نهاية الأسبوع',
    suggestedAction: 'حجز مركبة 15 طن ليوم السبت القادم',
  },
  {
    clientName: 'المستشفى الدولي',
    wasteType: 'نفايات طبية', location: 'المعادي',
    predictedDate: '2026-04-10', predictedVolume: 3,
    confidence: 88,
    reasoning: 'معدل تراكم ثابت - يطلب الجمع كل 3 أيام',
    suggestedAction: 'جدولة جمع يوم الخميس',
  },
  {
    clientName: 'شركة البناء المتحدة',
    wasteType: 'مخلفات بناء', location: 'العاصمة الإدارية',
    predictedDate: '2026-04-15', predictedVolume: 50,
    confidence: 75,
    reasoning: 'مشروع بناء نشط - مرحلة الهدم تنتهي منتصف الشهر',
    suggestedAction: 'تجهيز 3 مركبات ثقيلة + حاويات إضافية',
  },
  {
    clientName: 'فندق الماريوت',
    wasteType: 'نفايات مختلطة', location: 'الزمالك',
    predictedDate: '2026-04-08', predictedVolume: 8,
    confidence: 82,
    reasoning: 'حفل كبير مجدول يوم الخميس - زيادة متوقعة 40%',
    suggestedAction: 'زيادة سعة الجمع مؤقتاً',
  },
];

export default function DemandPredictionEngine() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-500" />
          محرك التنبؤ بالطلب
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {MOCK_PREDICTIONS.sort((a, b) => b.confidence - a.confidence).map((pred, idx) => (
              <Card key={idx} className="border">
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">ثقة: {pred.confidence}%</Badge>
                    <div className="text-right">
                      <p className="text-sm font-semibold flex items-center gap-1 justify-end">
                        <Building2 className="w-3 h-3" />
                        {pred.clientName}
                      </p>
                      <p className="text-xs text-muted-foreground">{pred.wasteType}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-1.5 bg-muted/50 rounded">
                      <Calendar className="w-3 h-3 mx-auto mb-0.5" />
                      <p className="font-medium">{pred.predictedDate}</p>
                    </div>
                    <div className="p-1.5 bg-muted/50 rounded">
                      <TrendingUp className="w-3 h-3 mx-auto mb-0.5" />
                      <p className="font-medium">{pred.predictedVolume} طن</p>
                    </div>
                    <div className="p-1.5 bg-muted/50 rounded">
                      <MapPin className="w-3 h-3 mx-auto mb-0.5" />
                      <p className="font-medium">{pred.location}</p>
                    </div>
                  </div>

                  <div className="text-xs bg-muted/30 p-2 rounded text-right">
                    <p className="text-muted-foreground">🔍 {pred.reasoning}</p>
                  </div>

                  <div className="flex items-start gap-1 text-xs text-primary">
                    <Lightbulb className="w-3 h-3 mt-0.5 shrink-0" />
                    <p>{pred.suggestedAction}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
