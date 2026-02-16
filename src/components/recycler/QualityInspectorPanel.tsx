import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Camera, Loader2, ShieldCheck, ShieldAlert, ShieldX, Sparkles,
  RotateCcw, Beaker, Droplets, ThermometerSun, PackageCheck,
  Ban, AlertTriangle, TrendingUp, Factory, Leaf
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface QualityResult {
  material_type: string;
  purity_percentage: number;
  moisture_percentage: number;
  contamination_level: string;
  contaminants_found: string[];
  is_recyclable: boolean;
  recyclable_grade: string;
  rejection_reason: string | null;
  safe_end_products: { product: string; safety_level: string; notes: string }[];
  unsafe_end_products: { product: string; reason: string }[];
  estimated_yield_percentage: number;
  estimated_market_value_per_ton_egp: number;
  processing_method: string;
  processing_temperature: string;
  quality_recommendations: string[];
  safety_warnings: string[];
  confidence: number;
  egyptian_standard_ref: string;
}

const gradeConfig: Record<string, { color: string; bg: string; label: string; icon: any }> = {
  A: { color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'ممتاز', icon: ShieldCheck },
  B: { color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'جيد', icon: ShieldCheck },
  C: { color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'مقبول', icon: ShieldAlert },
  D: { color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'ضعيف', icon: ShieldAlert },
  rejected: { color: 'text-destructive', bg: 'bg-destructive/10', label: 'مرفوض', icon: ShieldX },
};

const safetyLevelLabels: Record<string, { label: string; color: string }> = {
  food_grade: { label: '🍽️ صالح للأغذية', color: 'text-emerald-600' },
  industrial: { label: '🏭 صناعي فقط', color: 'text-blue-600' },
  construction: { label: '🏗️ مواد بناء', color: 'text-amber-600' },
  rejected: { label: '🚫 ممنوع', color: 'text-destructive' },
};

const QualityInspectorPanel = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<QualityResult | null>(null);
  const [wasteType, setWasteType] = useState('');
  const [sourceDesc, setSourceDesc] = useState('');

  const handleCapture = useCallback(async (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
    setIsAnalyzing(true);
    setResult(null);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.readAsDataURL(file);
        r.onload = () => resolve(r.result as string);
        r.onerror = reject;
      });

      const { data, error } = await supabase.functions.invoke('recycler-quality-inspect', {
        body: { image: base64, wasteType, sourceDescription: sourceDesc },
      });

      if (error) throw error;
      if (data) {
        setResult(data);
        toast({
          title: data.is_recyclable ? '✅ قابل للتدوير' : '🚫 مرفوض',
          description: `${data.material_type} - درجة ${data.recyclable_grade}`,
          variant: data.is_recyclable ? 'default' : 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Quality inspection error:', error);
      toast({ title: 'خطأ في الفحص', description: error.message, variant: 'destructive' });
    } finally {
      setIsAnalyzing(false);
    }
  }, [wasteType, sourceDesc, toast]);

  const grade = result ? gradeConfig[result.recyclable_grade] || gradeConfig.rejected : null;
  const GradeIcon = grade?.icon || ShieldAlert;

  const reset = () => {
    setPreview(null);
    setResult(null);
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleCapture(file);
        }}
      />

      <Card className="border-emerald-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Beaker className="w-5 h-5 text-emerald-500" />
            فحص جودة المواد الواردة بالذكاء الاصطناعي
            <Badge variant="outline" className="text-[10px] mr-auto gap-1">
              <Sparkles className="w-3 h-3" />
              مفتش الجودة الذكي
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            {preview ? (
              <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="relative rounded-xl overflow-hidden aspect-video bg-muted">
                  <img src={preview} alt="Material" className="w-full h-full object-cover" />
                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                      <div className="text-center">
                        <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mx-auto mb-2" />
                        <p className="text-sm font-semibold">جاري فحص الجودة...</p>
                        <p className="text-xs text-muted-foreground">تحليل النقاء والشوائب والمنتجات الممكنة</p>
                      </div>
                    </div>
                  )}
                </div>

                {result && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                    {/* Grade Banner */}
                    <div className={`p-4 rounded-xl border-2 ${result.is_recyclable ? 'border-emerald-500/30' : 'border-destructive/30'} ${grade?.bg}`}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-14 h-14 rounded-full ${grade?.bg} flex items-center justify-center`}>
                          <GradeIcon className={`w-7 h-7 ${grade?.color}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-lg font-bold ${grade?.color}`}>
                              {result.is_recyclable ? '♻️ قابل للتدوير' : '🚫 مرفوض'}
                            </span>
                            <Badge className={`${grade?.color} ${grade?.bg}`}>{grade?.label} ({result.recyclable_grade})</Badge>
                          </div>
                          <p className="text-sm font-medium mt-1">{result.material_type}</p>
                          {result.rejection_reason && (
                            <p className="text-xs text-destructive mt-1">⛔ {result.rejection_reason}</p>
                          )}
                        </div>
                      </div>

                      {/* Metrics Row */}
                      <div className="grid grid-cols-3 gap-2 mt-3">
                        <div className="text-center p-2 rounded-lg bg-background/50">
                          <Beaker className="w-4 h-4 mx-auto text-emerald-500 mb-1" />
                          <p className="text-lg font-bold">{result.purity_percentage}%</p>
                          <p className="text-[10px] text-muted-foreground">نقاء</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-background/50">
                          <Droplets className="w-4 h-4 mx-auto text-blue-500 mb-1" />
                          <p className="text-lg font-bold">{result.moisture_percentage}%</p>
                          <p className="text-[10px] text-muted-foreground">رطوبة</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-background/50">
                          <TrendingUp className="w-4 h-4 mx-auto text-amber-500 mb-1" />
                          <p className="text-lg font-bold">{result.estimated_yield_percentage}%</p>
                          <p className="text-[10px] text-muted-foreground">عائد متوقع</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-3">
                        <span>ثقة: {result.confidence}%</span>
                        <span>•</span>
                        <span>قيمة سوقية: {result.estimated_market_value_per_ton_egp.toLocaleString()} ج.م/طن</span>
                        <span>•</span>
                        <span>{result.egyptian_standard_ref}</span>
                      </div>
                    </div>

                    {/* Safe End Products */}
                    {result.safe_end_products.length > 0 && (
                      <Card>
                        <CardContent className="pt-4 pb-4">
                          <p className="text-sm font-bold mb-2 flex items-center gap-2">
                            <PackageCheck className="w-4 h-4 text-emerald-500" />
                            المنتجات النهائية المسموحة
                          </p>
                          <div className="space-y-2">
                            {result.safe_end_products.map((p, i) => {
                              const sl = safetyLevelLabels[p.safety_level] || { label: p.safety_level, color: '' };
                              return (
                                <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50">
                                  <span className={`text-xs font-bold ${sl.color} whitespace-nowrap`}>{sl.label}</span>
                                  <div>
                                    <p className="text-xs font-medium">{p.product}</p>
                                    <p className="text-[10px] text-muted-foreground">{p.notes}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Unsafe Products Warning */}
                    {result.unsafe_end_products.length > 0 && (
                      <Card className="border-destructive/30">
                        <CardContent className="pt-4 pb-4">
                          <p className="text-sm font-bold mb-2 flex items-center gap-2 text-destructive">
                            <Ban className="w-4 h-4" />
                            ⛔ منتجات ممنوعة (خطر على السلامة)
                          </p>
                          <div className="space-y-2">
                            {result.unsafe_end_products.map((p, i) => (
                              <div key={i} className="p-2 rounded-lg bg-destructive/5 border border-destructive/20">
                                <p className="text-xs font-bold text-destructive">{p.product}</p>
                                <p className="text-[10px] text-muted-foreground">{p.reason}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Processing Info */}
                    <Card>
                      <CardContent className="pt-4 pb-4">
                        <p className="text-sm font-bold mb-2 flex items-center gap-2">
                          <Factory className="w-4 h-4 text-blue-500" />
                          طريقة المعالجة
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2 rounded-lg bg-muted/50">
                            <p className="text-muted-foreground">الطريقة</p>
                            <p className="font-medium">{result.processing_method}</p>
                          </div>
                          <div className="p-2 rounded-lg bg-muted/50">
                            <p className="text-muted-foreground">درجة الحرارة</p>
                            <p className="font-medium flex items-center gap-1">
                              <ThermometerSun className="w-3 h-3" />
                              {result.processing_temperature}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Safety Warnings */}
                    {result.safety_warnings.length > 0 && (
                      <Card className="border-amber-500/30">
                        <CardContent className="pt-4 pb-4">
                          <p className="text-sm font-bold mb-2 flex items-center gap-2 text-amber-600">
                            <AlertTriangle className="w-4 h-4" />
                            تحذيرات السلامة
                          </p>
                          <ul className="space-y-1.5">
                            {result.safety_warnings.map((w, i) => (
                              <li key={i} className="text-xs flex items-start gap-2">
                                <span className="text-amber-500 mt-0.5">⚠️</span>
                                {w}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    {/* Contaminants */}
                    {result.contaminants_found.length > 0 && (
                      <Card>
                        <CardContent className="pt-4 pb-4">
                          <p className="text-sm font-bold mb-2">🧫 الشوائب المكتشفة ({result.contamination_level})</p>
                          <div className="flex flex-wrap gap-2">
                            {result.contaminants_found.map((c, i) => (
                              <Badge key={i} variant="outline" className="text-xs border-amber-500/30 text-amber-600">{c}</Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Recommendations */}
                    {result.quality_recommendations.length > 0 && (
                      <Card>
                        <CardContent className="pt-4 pb-4">
                          <p className="text-sm font-bold mb-2 flex items-center gap-2">
                            <Leaf className="w-4 h-4 text-emerald-500" />
                            توصيات الجودة
                          </p>
                          <ul className="space-y-1.5">
                            {result.quality_recommendations.map((r, i) => (
                              <li key={i} className="text-xs flex items-start gap-2">
                                <span className="text-emerald-500 mt-0.5">✅</span>
                                {r}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </motion.div>
                )}

                <Button variant="outline" className="w-full gap-2" onClick={() => { reset(); fileInputRef.current?.click(); }}>
                  <RotateCcw className="w-4 h-4" />
                  فحص مادة أخرى
                </Button>
              </motion.div>
            ) : (
              <motion.div key="capture" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                <Input
                  placeholder="نوع المخلف (اختياري: بلاستيك، ورق، معادن...)"
                  value={wasteType}
                  onChange={(e) => setWasteType(e.target.value)}
                  className="text-right"
                />
                <Textarea
                  placeholder="وصف إضافي (اختياري: المصدر، حالة المادة...)"
                  value={sourceDesc}
                  onChange={(e) => setSourceDesc(e.target.value)}
                  className="text-right h-16"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full aspect-video rounded-xl border-2 border-dashed border-emerald-500/30 bg-emerald-500/5 flex flex-col items-center justify-center gap-3 hover:bg-emerald-500/10 transition-colors"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <Camera className="w-8 h-8 text-emerald-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold">صوّر المادة الواردة لفحص الجودة</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      AI يحدد النقاء والشوائب والمنتجات المسموحة والممنوعة
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      مثال: بلاستيك ملوث بزيوت ≠ أطباق طعام
                    </p>
                  </div>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
};

export default QualityInspectorPanel;
