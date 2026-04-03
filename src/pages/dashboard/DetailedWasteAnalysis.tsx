import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, Loader2, Recycle, AlertTriangle, CheckCircle, Trash2, BarChart3, Droplets, Scale, PackageOpen, Leaf, ShieldAlert, Star, DollarSign, TrendingUp, Coins, X, Plus, FileText, ImageIcon, ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { formatNumber, formatCurrency } from '@/lib/numberFormat';
import BackButton from '@/components/ui/back-button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface ImageItem {
  file: File;
  preview: string;
}

interface WasteComponent {
  name: string;
  name_en: string;
  waste_type: string;
  sub_type: string;
  percentage: number;
  estimated_weight_kg: number;
  condition: string;
  recyclable: boolean;
  market_value: string;
  color: string;
  notes: string;
}

interface ComponentPricing {
  name: string;
  waste_type: string;
  estimated_weight_kg: number;
  price_per_ton_egp: number;
  total_value_egp: number;
  price_source: string;
}

interface FinancialAnalysis {
  currency: string;
  components_pricing: ComponentPricing[];
  total_estimated_value_egp: number;
  mixed_ton_price_egp: number;
  price_per_kg_egp: number;
  sorted_vs_mixed_premium: string;
  market_notes: string;
}

interface AnalysisResult {
  overall_description: string;
  estimated_total_weight_kg: number;
  weight_confidence: string;
  overall_condition: string;
  is_hazardous: boolean;
  hazard_level: string;
  components: WasteComponent[];
  contamination: {
    dirt_percentage: number;
    moisture_percentage: number;
    contamination_level: string;
    contamination_details: string;
  };
  container_info: {
    type: string;
    fill_level_percent: number;
    size_estimate: string;
  };
  quality_assessment: {
    overall_grade: string;
    sorting_quality: string;
    purity_percentage: number;
    recommendations: string[];
  };
  recycling_potential: {
    recyclable_percentage: number;
    estimated_recovery_value: string;
    best_recycling_method: string;
    disposal_method: string;
  };
  financial_analysis?: FinancialAnalysis;
}

const wasteTypeColors: Record<string, string> = {
  plastic: 'bg-blue-500', paper: 'bg-amber-500', metal: 'bg-gray-500',
  glass: 'bg-cyan-500', electronic: 'bg-purple-500', organic: 'bg-green-500',
  chemical: 'bg-red-500', medical: 'bg-pink-500', construction: 'bg-orange-500',
  other: 'bg-slate-500',
};

const wasteTypeLabels: Record<string, string> = {
  plastic: 'بلاستيك', paper: 'ورق/كرتون', metal: 'معادن', glass: 'زجاج',
  electronic: 'إلكتروني', organic: 'عضوي', chemical: 'كيميائي',
  medical: 'طبي', construction: 'بناء', other: 'أخرى',
};

const gradeColors: Record<string, string> = {
  A: 'text-green-600 bg-green-100', B: 'text-blue-600 bg-blue-100',
  C: 'text-amber-600 bg-amber-100', D: 'text-orange-600 bg-orange-100',
  F: 'text-red-600 bg-red-100',
};

const DetailedWasteAnalysis = () => {
  const { organization, roles } = useAuth();
  const navigate = useNavigate();
  const [images, setImages] = useState<ImageItem[]>([]);
  const [description, setDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = roles.includes('admin');
  const orgType = organization?.organization_type;
  const hasAccess = isAdmin || orgType === 'transporter' || orgType === 'recycler';

  if (!hasAccess) {
    return (
              <div className="p-4 md:p-6 max-w-5xl mx-auto" dir="rtl">
        <BackButton />
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <ShieldX className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold">غير مصرح بالوصول</h2>
            <p className="text-muted-foreground text-center max-w-md">
              هذه الصفحة متاحة فقط لجهات النقل وجهات التدوير ومدير النظام
            </p>
            <Button onClick={() => navigate('/dashboard')} variant="outline">
              العودة للوحة التحكم
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const newImages: ImageItem[] = [];
    const maxTotal = 10;
    const allowed = maxTotal - images.length;
    
    Array.from(files).slice(0, allowed).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const preview = URL.createObjectURL(file);
      newImages.push({ file, preview });
    });
    
    if (newImages.length === 0) return;
    setImages(prev => [...prev, ...newImages]);
    if (files.length > allowed) {
      toast.info(`تم إضافة ${allowed} صور فقط (الحد الأقصى ${maxTotal})`);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleAnalyze = async () => {
    if (images.length === 0) {
      toast.error('يرجى رفع صورة واحدة على الأقل');
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    try {
      const formData = new FormData();
      images.forEach((img, i) => {
        formData.append(`image_${i}`, img.file);
      });
      if (description.trim()) {
        formData.append('description', description.trim());
      }

      const { data, error } = await supabase.functions.invoke('detailed-waste-analysis', {
        body: formData,
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'فشل التحليل');

      setResult(data.analysis);
      toast.success('تم تحليل الصور بنجاح');
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء التحليل');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    images.forEach(img => URL.revokeObjectURL(img.preview));
    setImages([]);
    setDescription('');
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto" dir="rtl">
      <BackButton />
      <div className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold">تحليل المخلفات بالذكاء الاصطناعي</h1>
        <p className="text-muted-foreground">ارفع صور المخلفات وأضف وصفاً للحصول على تحليل تفصيلي شامل مع التسعير</p>
      </div>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ImageIcon className="w-5 h-5 text-primary" />
            الصور ({images.length}/10)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Image Grid */}
          {images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {images.map((img, i) => (
                <motion.div
                  key={img.preview}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative group aspect-square rounded-lg overflow-hidden border bg-muted"
                >
                  <img src={img.preview} alt={`صورة ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute top-1 left-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <span className="absolute bottom-1 right-1 text-xs bg-background/80 text-foreground rounded px-1.5 py-0.5">
                    {i + 1}
                  </span>
                </motion.div>
              ))}

              {/* Add More Button */}
              {images.length < 10 && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <Plus className="w-6 h-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground mt-1">إضافة</span>
                </div>
              )}
            </div>
          )}

          {/* Empty State Upload Buttons */}
          {images.length === 0 && (
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <Camera className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="font-medium">ارفع صور المخلفات للتحليل</p>
                <p className="text-sm text-muted-foreground mt-1">يمكنك رفع حتى 10 صور - PNG, JPG أو JPEG</p>
              </div>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="gap-2">
                  <Upload className="w-4 h-4" />
                  رفع صور
                </Button>
                <Button onClick={() => cameraInputRef.current?.click()} variant="outline" className="gap-2">
                  <Camera className="w-4 h-4" />
                  التقاط من الكاميرا
                </Button>
              </div>
            </div>
          )}

          {/* Hidden Inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
            className="hidden"
          />

          {/* Action Buttons when images exist */}
          {images.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Button onClick={() => cameraInputRef.current?.click()} variant="outline" size="sm" className="gap-1.5">
                <Camera className="w-4 h-4" />
                كاميرا
              </Button>
              <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="sm" className="gap-1.5">
                <Upload className="w-4 h-4" />
                رفع المزيد
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Description Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="w-5 h-5 text-primary" />
            وصف المحتوى (اختياري)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="أضف وصفاً لمساعدة الذكاء الاصطناعي في التحليل الدقيق... مثلاً: حمولة كرتون مستعمل من مصنع مواد غذائية، أو خردة حديد من ورشة ميكانيكية..."
            className="min-h-[80px] resize-none text-right"
            dir="rtl"
          />
          <p className="text-xs text-muted-foreground mt-2">
            الوصف يساعد في تحديد نوع المخلفات وتسعيرها بدقة أعلى
          </p>
        </CardContent>
      </Card>

      {/* Analyze Button */}
      <Button
        onClick={handleAnalyze}
        disabled={isAnalyzing || images.length === 0}
        className="w-full"
        size="lg"
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="w-5 h-5 ml-2 animate-spin" />
            جاري تحليل {images.length > 1 ? `${images.length} صور` : 'الصورة'} بدقة...
          </>
        ) : (
          <>
            <BarChart3 className="w-5 h-5 ml-2" />
            تحليل {images.length > 1 ? `${images.length} صور` : images.length === 1 ? 'الصورة' : 'المخلفات'}
          </>
        )}
      </Button>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  النتيجة العامة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">{result.overall_description}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard icon={<Scale className="w-4 h-4" />} label="الوزن التقديري" value={`${result.estimated_total_weight_kg} كجم`} sub={`ثقة: ${result.weight_confidence === 'high' ? 'عالية' : result.weight_confidence === 'medium' ? 'متوسطة' : 'منخفضة'}`} />
                  <StatCard icon={<PackageOpen className="w-4 h-4" />} label="الحالة" value={result.overall_condition} />
                  <StatCard icon={<ShieldAlert className="w-4 h-4" />} label="مستوى الخطورة" value={result.hazard_level === 'none' ? 'آمن' : result.hazard_level === 'low' ? 'منخفض' : result.hazard_level === 'medium' ? 'متوسط' : result.hazard_level === 'high' ? 'عالي' : 'حرج'} color={result.is_hazardous ? 'text-red-600' : 'text-green-600'} />
                  <StatCard icon={<Star className="w-4 h-4" />} label="تقييم الجودة" value={result.quality_assessment?.overall_grade || 'N/A'} badge badgeClass={gradeColors[result.quality_assessment?.overall_grade] || ''} />
                </div>
              </CardContent>
            </Card>

            {/* Components Breakdown */}
            {result.components?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trash2 className="w-5 h-5 text-primary" />
                    تفاصيل المكونات ({result.components.length} مكون)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {result.components.map((comp, i) => (
                    <div key={i} className="p-4 rounded-lg border bg-card space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <Badge className={`${wasteTypeColors[comp.waste_type] || 'bg-slate-500'} text-white`}>
                            {wasteTypeLabels[comp.waste_type] || comp.waste_type}
                          </Badge>
                          <span className="font-semibold">{comp.name}</span>
                          <span className="text-xs text-muted-foreground">({comp.name_en})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {comp.recyclable && <Badge variant="outline" className="text-green-600 border-green-300">♻ قابل للتدوير</Badge>}
                          <Badge variant="secondary">{comp.percentage}%</Badge>
                        </div>
                      </div>
                      <Progress value={comp.percentage} className="h-2" />
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div><span className="text-muted-foreground">الوزن: </span><span className="font-medium">{comp.estimated_weight_kg} كجم</span></div>
                        <div><span className="text-muted-foreground">الحالة: </span><span className="font-medium">{comp.condition}</span></div>
                        <div><span className="text-muted-foreground">القيمة السوقية: </span><span className="font-medium">{comp.market_value === 'high' ? 'عالية' : comp.market_value === 'medium' ? 'متوسطة' : comp.market_value === 'low' ? 'منخفضة' : 'معدومة'}</span></div>
                        {comp.sub_type && <div><span className="text-muted-foreground">النوع الفرعي: </span><span className="font-medium">{comp.sub_type}</span></div>}
                      </div>
                      {comp.notes && <p className="text-xs text-muted-foreground">{comp.notes}</p>}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Contamination & Quality */}
            <div className="grid md:grid-cols-2 gap-4">
              {result.contamination && (
                <Card>
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><Droplets className="w-4 h-4 text-primary" /> التلوث والشوائب</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm"><span>نسبة التراب</span><span className="font-bold">{result.contamination.dirt_percentage}%</span></div>
                      <Progress value={result.contamination.dirt_percentage} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm"><span>نسبة الرطوبة</span><span className="font-bold">{result.contamination.moisture_percentage}%</span></div>
                      <Progress value={result.contamination.moisture_percentage} className="h-2" />
                    </div>
                    <Separator />
                    <div className="text-sm">
                      <span className="text-muted-foreground">مستوى التلوث: </span>
                      <Badge variant={result.contamination.contamination_level === 'high' ? 'destructive' : 'secondary'}>
                        {result.contamination.contamination_level === 'none' ? 'نظيف' : result.contamination.contamination_level === 'low' ? 'منخفض' : result.contamination.contamination_level === 'medium' ? 'متوسط' : 'عالي'}
                      </Badge>
                    </div>
                    {result.contamination.contamination_details && (
                      <p className="text-xs text-muted-foreground">{result.contamination.contamination_details}</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {result.recycling_potential && (
                <Card>
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><Leaf className="w-4 h-4 text-primary" /> إمكانية إعادة التدوير</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm"><span>نسبة القابل للتدوير</span><span className="font-bold text-green-600">{result.recycling_potential.recyclable_percentage}%</span></div>
                      <Progress value={result.recycling_potential.recyclable_percentage} className="h-2" />
                    </div>
                    <Separator />
                    <div className="space-y-2 text-sm">
                      {result.recycling_potential.estimated_recovery_value && (
                        <div><span className="text-muted-foreground">القيمة التقديرية: </span>{result.recycling_potential.estimated_recovery_value}</div>
                      )}
                      {result.recycling_potential.best_recycling_method && (
                        <div><span className="text-muted-foreground">أفضل طريقة: </span>{result.recycling_potential.best_recycling_method}</div>
                      )}
                      {result.recycling_potential.disposal_method && (
                        <div><span className="text-muted-foreground">التخلص: </span>{result.recycling_potential.disposal_method}</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Financial Analysis */}
            {result.financial_analysis && (
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-primary" />
                    التحليل المالي والتسعير
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg border bg-card text-center space-y-1">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs"><Coins className="w-4 h-4" />إجمالي القيمة</div>
                      <p className="font-bold text-lg text-primary">{formatCurrency(result.financial_analysis.total_estimated_value_egp)}</p>
                    </div>
                    <div className="p-3 rounded-lg border bg-card text-center space-y-1">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs"><TrendingUp className="w-4 h-4" />سعر الطن المختلط</div>
                      <p className="font-bold text-lg">{formatCurrency(result.financial_analysis.mixed_ton_price_egp)}</p>
                    </div>
                    <div className="p-3 rounded-lg border bg-card text-center space-y-1">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs"><Scale className="w-4 h-4" />سعر الكيلو</div>
                      <p className="font-bold text-lg">{formatNumber(result.financial_analysis.price_per_kg_egp, 2)} ج.م</p>
                    </div>
                    <div className="p-3 rounded-lg border bg-card text-center space-y-1">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs"><Recycle className="w-4 h-4" />فائدة الفرز</div>
                      <p className="font-bold text-sm">{result.financial_analysis.sorted_vs_mixed_premium}</p>
                    </div>
                  </div>

                  {result.financial_analysis.components_pricing?.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-muted-foreground">
                            <th className="text-right py-2 px-2">الصنف</th>
                            <th className="text-center py-2 px-2">الوزن (كجم)</th>
                            <th className="text-center py-2 px-2">سعر الطن</th>
                            <th className="text-center py-2 px-2">الإجمالي</th>
                            <th className="text-center py-2 px-2">المصدر</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.financial_analysis.components_pricing.map((cp, i) => (
                            <tr key={i} className="border-b last:border-0">
                              <td className="py-2 px-2 font-medium">
                                <div className="flex items-center gap-1">
                                  <span className={`w-2 h-2 rounded-full ${wasteTypeColors[cp.waste_type] || 'bg-muted'}`} />
                                  {cp.name}
                                </div>
                              </td>
                              <td className="text-center py-2 px-2">{formatNumber(cp.estimated_weight_kg, 1)}</td>
                              <td className="text-center py-2 px-2">{formatCurrency(cp.price_per_ton_egp)}</td>
                              <td className="text-center py-2 px-2 font-semibold text-primary">{formatCurrency(cp.total_value_egp)}</td>
                              <td className="text-center py-2 px-2 text-xs text-muted-foreground">{cp.price_source}</td>
                            </tr>
                          ))}
                          <tr className="font-bold border-t-2">
                            <td className="py-2 px-2">الإجمالي</td>
                            <td className="text-center py-2 px-2">{formatNumber(result.estimated_total_weight_kg, 1)}</td>
                            <td className="text-center py-2 px-2">—</td>
                            <td className="text-center py-2 px-2 text-primary">{formatCurrency(result.financial_analysis.total_estimated_value_egp)}</td>
                            <td />
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {result.financial_analysis.market_notes && (
                    <p className="text-xs text-muted-foreground border-t pt-2">{result.financial_analysis.market_notes}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            {result.quality_assessment?.recommendations?.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" /> التوصيات</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.quality_assessment.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            <Button onClick={reset} variant="outline" className="w-full">
              <Camera className="w-4 h-4 ml-2" />
              تحليل جديد
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatCard = ({ icon, label, value, sub, color, badge, badgeClass }: { icon: React.ReactNode; label: string; value: string; sub?: string; color?: string; badge?: boolean; badgeClass?: string }) => (
  <div className="p-3 rounded-lg border bg-card text-center space-y-1">
    <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs">{icon}{label}</div>
    {badge ? (
      <span className={`inline-block text-xl font-bold px-3 py-1 rounded-full ${badgeClass}`}>{value}</span>
    ) : (
      <p className={`font-bold text-lg ${color || ''}`}>{value}</p>
    )}
    {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
  </div>
  );

export default DetailedWasteAnalysis;
