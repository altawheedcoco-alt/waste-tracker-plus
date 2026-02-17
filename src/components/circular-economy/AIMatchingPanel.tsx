import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Brain, Sparkles, MapPin, TrendingUp, Recycle, Factory,
  ArrowRight, Star, Loader2, Leaf, DollarSign
} from 'lucide-react';

interface MatchResult {
  organization_name: string;
  material_type: string;
  match_score: number;
  distance_km: number;
  price_per_ton: number;
  carbon_savings_kg: number;
  reasoning: string;
  capacity_tons: number;
}

const wasteTypes = [
  'بلاستيك PET', 'بلاستيك HDPE', 'حديد خردة', 'ألمنيوم خردة',
  'نحاس خردة', 'ورق وكرتون', 'زجاج مكسور', 'إطارات مستعملة',
  'مخلفات إلكترونية', 'مخلفات عضوية', 'مخلفات بناء',
];

const governorates = [
  'القاهرة', 'الجيزة', 'الإسكندرية', 'الشرقية', 'الدقهلية',
  'البحيرة', 'المنوفية', 'القليوبية', 'الغربية', 'كفر الشيخ',
  'بورسعيد', 'السويس', 'الإسماعيلية', 'الفيوم', 'بني سويف',
  'المنيا', 'أسيوط', 'سوهاج', 'قنا', 'الأقصر', 'أسوان',
];

const AIMatchingPanel = () => {
  const [wasteType, setWasteType] = useState('');
  const [quantity, setQuantity] = useState('');
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<MatchResult[]>([]);

  const handleMatch = async () => {
    if (!wasteType || !quantity || !location) {
      toast.error('يرجى تعبئة جميع الحقول');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-circular-matcher', {
        body: { waste_type: wasteType, quantity_tons: Number(quantity), location_governorate: location },
      });

      if (error) throw error;
      setResults(data?.matches || []);

      if (!data?.matches?.length) {
        toast.info('لم يتم العثور على مطابقات حالياً. جاري توسيع نطاق البحث...');
      } else {
        toast.success(`تم العثور على ${data.matches.length} مطابقات محتملة`);
      }
    } catch (e: any) {
      console.error('AI matching error:', e);
      toast.error('حدث خطأ في البحث الذكي');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-500" />
          محرك المطابقة الذكي
        </h2>
        <p className="text-xs text-muted-foreground">AI Smart Matching - يقترح أفضل شريك تدوير بناءً على المادة والموقع والسعر</p>
      </div>

      {/* Search Form */}
      <Card className="border-purple-500/20">
        <CardContent className="p-4">
          <div className="grid md:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">نوع المخلف</Label>
              <Select value={wasteType} onValueChange={setWasteType}>
                <SelectTrigger><SelectValue placeholder="اختر النوع" /></SelectTrigger>
                <SelectContent>
                  {wasteTypes.map(w => (
                    <SelectItem key={w} value={w}>{w}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">الكمية (طن)</Label>
              <Input type="number" min="0" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="50" />
            </div>
            <div>
              <Label className="text-xs">الموقع</Label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger><SelectValue placeholder="المحافظة" /></SelectTrigger>
                <SelectContent>
                  {governorates.map(g => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleMatch} disabled={isLoading} className="w-full gap-1.5">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {isLoading ? 'جاري البحث...' : 'ابحث بالذكاء الاصطناعي'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            نتائج المطابقة ({results.length})
          </h3>

          {results.map((r, i) => (
            <Card key={i} className={`transition-all ${i === 0 ? 'border-emerald-500/30 bg-emerald-500/5' : 'hover:border-primary/30'}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {i === 0 && <Badge className="bg-emerald-500 text-white text-[10px]">أفضل تطابق</Badge>}
                    <Badge variant="outline" className="text-[10px] gap-1">
                      <Star className="w-3 h-3 text-amber-500" />
                      {r.match_score}% تطابق
                    </Badge>
                  </div>
                  <h3 className="font-bold text-sm">{r.organization_name}</h3>
                </div>

                <div className="grid grid-cols-4 gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-muted/50 text-center">
                    <MapPin className="w-3 h-3 mx-auto text-blue-500 mb-1" />
                    <p className="text-sm font-bold">{r.distance_km} كم</p>
                    <p className="text-[9px] text-muted-foreground">المسافة</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50 text-center">
                    <DollarSign className="w-3 h-3 mx-auto text-emerald-500 mb-1" />
                    <p className="text-sm font-bold">{r.price_per_ton?.toLocaleString()}</p>
                    <p className="text-[9px] text-muted-foreground">ج.م/طن</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50 text-center">
                    <Factory className="w-3 h-3 mx-auto text-orange-500 mb-1" />
                    <p className="text-sm font-bold">{r.capacity_tons}</p>
                    <p className="text-[9px] text-muted-foreground">طن/شهر</p>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-center">
                    <Leaf className="w-3 h-3 mx-auto text-emerald-500 mb-1" />
                    <p className="text-sm font-bold text-emerald-600">{r.carbon_savings_kg}</p>
                    <p className="text-[9px] text-muted-foreground">kg CO₂ وفر</p>
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-purple-500/5 border border-purple-500/10">
                  <p className="text-[10px] text-muted-foreground mb-0.5">💡 تحليل الذكاء الاصطناعي</p>
                  <p className="text-xs">{r.reasoning}</p>
                </div>

                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" className="flex-1 text-xs gap-1">
                    <ArrowRight className="w-3 h-3" />
                    عرض التفاصيل
                  </Button>
                  <Button size="sm" className="flex-1 text-xs gap-1">
                    <Recycle className="w-3 h-3" />
                    طلب تكافل
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && results.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">محرك المطابقة الذكي</p>
            <p className="text-xs mt-1">أدخل نوع المخلف والكمية والموقع وسيقوم الذكاء الاصطناعي باقتراح أفضل شريك تدوير</p>
            <div className="flex items-center justify-center gap-4 mt-4 text-[10px]">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> تحليل المسافة</span>
              <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> مقارنة الأسعار</span>
              <span className="flex items-center gap-1"><Leaf className="w-3 h-3" /> الأثر البيئي</span>
              <span className="flex items-center gap-1"><Star className="w-3 h-3" /> تقييم الجودة</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIMatchingPanel;
